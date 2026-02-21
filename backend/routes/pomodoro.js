const { Router } = require('express');
const db = require('../db');
const router = Router();

// POST /api/pomodoro/start/:taskId
router.post('/start/:taskId', (req, res) => {
  const { taskId } = req.params;

  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(taskId);
  if (!task) return res.status(404).json({ error: 'task not found' });

  db.prepare("UPDATE tasks SET status = 'en_cours', updated_at = datetime('now') WHERE id = ?")
    .run(taskId);

  const result = db.prepare(
    "INSERT INTO pomodoro_sessions (task_id, started_at) VALUES (?, datetime('now'))"
  ).run(taskId);

  const session = db.prepare('SELECT * FROM pomodoro_sessions WHERE id = ?')
    .get(result.lastInsertRowid);

  const workMin = db.prepare("SELECT value FROM settings WHERE key = 'pomodoro_work_min'").get();

  res.json({
    session,
    task: db.prepare('SELECT * FROM tasks WHERE id = ?').get(taskId),
    work_min: parseInt(workMin?.value || '25'),
  });
});

// POST /api/pomodoro/complete/:id (session id)
router.post('/complete/:id', (req, res) => {
  const { id } = req.params;

  const session = db.prepare('SELECT * FROM pomodoro_sessions WHERE id = ?').get(id);
  if (!session) return res.status(404).json({ error: 'session not found' });

  db.prepare(
    "UPDATE pomodoro_sessions SET ended_at = datetime('now'), completed = 1 WHERE id = ?"
  ).run(id);

  db.prepare(
    "UPDATE tasks SET pomodoros_done = pomodoros_done + 1, updated_at = datetime('now') WHERE id = ?"
  ).run(session.task_id);

  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(session.task_id);
  res.json({ session: { ...session, completed: 1 }, task });
});

// POST /api/pomodoro/skip/:taskId
router.post('/skip/:taskId', (req, res) => {
  const { taskId } = req.params;

  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(taskId);
  if (!task) return res.status(404).json({ error: 'task not found' });

  db.prepare("UPDATE tasks SET status = 'skippee', updated_at = datetime('now') WHERE id = ?")
    .run(taskId);

  db.prepare(`
    UPDATE pomodoro_sessions
    SET ended_at = datetime('now'), completed = 0
    WHERE task_id = ? AND ended_at IS NULL
  `).run(taskId);

  res.json(db.prepare('SELECT * FROM tasks WHERE id = ?').get(taskId));
});

module.exports = router;
