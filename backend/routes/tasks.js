const { Router } = require('express');
const db = require('../db');
const router = Router();

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

// GET /api/tasks?date=YYYY-MM-DD
router.get('/', (req, res) => {
  const { date } = req.query;
  if (!date) return res.status(400).json({ error: 'date query param required' });

  const tasks = db.prepare(
    'SELECT * FROM tasks WHERE date = ? ORDER BY sort_order ASC, start_time ASC'
  ).all(date);

  res.json(tasks);
});

// POST /api/tasks
router.post('/', (req, res) => {
  const { title, category, date, start_time, duration_min } = req.body;
  if (!title || !date) return res.status(400).json({ error: 'title and date required' });

  const maxOrder = db.prepare(
    'SELECT COALESCE(MAX(sort_order), -1) + 1 as next FROM tasks WHERE date = ?'
  ).get(date);

  const result = db.prepare(`
    INSERT INTO tasks (title, category, date, start_time, duration_min, sort_order)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    title,
    category || 'autre',
    date,
    start_time || null,
    duration_min || 30,
    maxOrder.next
  );

  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(task);
});

// PUT /api/tasks/:id
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const fields = req.body;

  const existing = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
  if (!existing) return res.status(404).json({ error: 'task not found' });

  const allowedFields = ['title', 'category', 'status', 'date', 'start_time',
                          'duration_min', 'pomodoros_done', 'sort_order'];
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
  res.json(task);
});

// DELETE /api/tasks/:id
router.delete('/:id', (req, res) => {
  const result = db.prepare('DELETE FROM tasks WHERE id = ?').run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'task not found' });
  res.json({ success: true });
});

module.exports = router;
