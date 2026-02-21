const { Router } = require('express');
const db = require('../db');
const gcal = require('../google-calendar');
const router = Router();

// Background sync to Google Calendar (non-blocking)
function syncToGoogleBackground(task) {
  if (!gcal.isAuthenticated() || !task.start_time) return;
  gcal.syncTaskToGoogle(task).then((eventId) => {
    if (eventId && eventId !== task.google_event_id) {
      db.prepare('UPDATE tasks SET google_event_id = ? WHERE id = ?').run(eventId, task.id);
    }
  }).catch((err) => console.error('Google sync error:', err.message));
}

// PUT /api/tasks/reorder — MUST be before /:id
router.put('/reorder', (req, res) => {
  const { date, order } = req.body;
  if (!date || !order) return res.status(400).json({ error: 'date and order required' });

  const updateStmt = db.prepare('UPDATE tasks SET sort_order = ? WHERE id = ? AND date = ?');
  const transaction = db.transaction((items) => {
    items.forEach((id, index) => {
      updateStmt.run(index, id, date);
    });
  });
  transaction(order);

  const tasks = db.prepare(
    'SELECT * FROM tasks WHERE date = ? ORDER BY sort_order ASC'
  ).all(date);
  res.json(tasks);
});

// Generate recurring tasks for a given date
function generateRecurring(date) {
  const d = new Date(date + 'T12:00:00');
  const dayOfWeek = d.getDay(); // 0=Sun, 1=Mon, ...
  const isWeekday = dayOfWeek >= 1 && dayOfWeek <= 5;

  // Find all recurring template tasks (tasks with recurring field set)
  const templates = db.prepare(
    "SELECT * FROM tasks WHERE recurring IS NOT NULL AND recurring != ''"
  ).all();

  const insertStmt = db.prepare(`
    INSERT INTO tasks (title, category, date, start_time, duration_min, recurring, sort_order)
    VALUES (?, ?, ?, ?, ?, NULL, ?)
  `);

  let created = 0;
  for (const tpl of templates) {
    let shouldCreate = false;
    if (tpl.recurring === 'daily') shouldCreate = true;
    else if (tpl.recurring === 'weekdays' && isWeekday) shouldCreate = true;
    else if (tpl.recurring === 'weekly' && tpl.date) {
      const tplDay = new Date(tpl.date + 'T12:00:00').getDay();
      if (tplDay === dayOfWeek) shouldCreate = true;
    }

    if (!shouldCreate) continue;

    // Check if already exists for this date
    const exists = db.prepare(
      'SELECT id FROM tasks WHERE title = ? AND date = ?'
    ).get(tpl.title, date);

    if (!exists) {
      const maxOrder = db.prepare(
        'SELECT COALESCE(MAX(sort_order), -1) + 1 as next FROM tasks WHERE date = ?'
      ).get(date);
      insertStmt.run(tpl.title, tpl.category, date, tpl.start_time, tpl.duration_min, maxOrder.next);
      created++;
    }
  }
  return created;
}

// GET /api/tasks?date=YYYY-MM-DD
router.get('/', (req, res) => {
  const { date } = req.query;
  if (!date) return res.status(400).json({ error: 'date query param required' });

  // Auto-generate recurring tasks for this date
  generateRecurring(date);

  const tasks = db.prepare(
    'SELECT * FROM tasks WHERE date = ? ORDER BY sort_order ASC, start_time ASC'
  ).all(date);

  res.json(tasks);
});

// POST /api/tasks
router.post('/', (req, res) => {
  const { title, category, date, start_time, duration_min, recurring } = req.body;
  if (!title || !date) return res.status(400).json({ error: 'title and date required' });

  const maxOrder = db.prepare(
    'SELECT COALESCE(MAX(sort_order), -1) + 1 as next FROM tasks WHERE date = ?'
  ).get(date);

  const result = db.prepare(`
    INSERT INTO tasks (title, category, date, start_time, duration_min, recurring, sort_order)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    title,
    category || 'autre',
    date,
    start_time || null,
    duration_min || 30,
    recurring || null,
    maxOrder.next
  );

  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(result.lastInsertRowid);
  syncToGoogleBackground(task);
  res.status(201).json(task);
});

// PUT /api/tasks/:id
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const fields = req.body;

  const existing = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
  if (!existing) return res.status(404).json({ error: 'task not found' });

  const allowedFields = ['title', 'category', 'status', 'date', 'start_time',
                          'duration_min', 'pomodoros_done', 'sort_order', 'recurring'];
  const updates = [];
  const values = [];

  for (const field of allowedFields) {
    if (fields[field] !== undefined) {
      updates.push(`${field} = ?`);
      values.push(fields[field]);
    }
  }

  if (updates.length === 0) return res.status(400).json({ error: 'no valid fields to update' });

  updates.push("updated_at = datetime('now')");
  values.push(id);

  db.prepare(`UPDATE tasks SET ${updates.join(', ')} WHERE id = ?`).run(...values);

  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
  syncToGoogleBackground(task);
  res.json(task);
});

// DELETE /api/tasks/:id
router.delete('/:id', (req, res) => {
  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id);
  if (!task) return res.status(404).json({ error: 'task not found' });

  // Delete Google Calendar event if exists
  if (task.google_event_id) {
    gcal.deleteGoogleEvent(task.google_event_id).catch((err) =>
      console.error('Google delete error:', err.message)
    );
  }

  db.prepare('DELETE FROM tasks WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

module.exports = router;
