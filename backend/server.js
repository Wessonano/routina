require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3002;

app.use(cors());
app.use(express.json());

// API routes
app.use('/api/tasks', require('./routes/tasks'));
app.use('/api/pomodoro', require('./routes/pomodoro'));
app.use('/api/calendar', require('./routes/calendar'));

// Stats endpoint
app.get('/api/stats', (req, res) => {
  const period = req.query.period || 'day';
  let dateFilter;

  if (period === 'week') {
    dateFilter = "date >= date('now', '-7 days')";
  } else if (period === 'month') {
    dateFilter = "date >= date('now', '-30 days')";
  } else {
    dateFilter = "date = date('now')";
  }

  const stats = {
    tasks_total: db.prepare(`SELECT COUNT(*) as c FROM tasks WHERE ${dateFilter}`).get().c,
    tasks_done: db.prepare(
      `SELECT COUNT(*) as c FROM tasks WHERE ${dateFilter} AND status = 'terminee'`
    ).get().c,
    tasks_skipped: db.prepare(
      `SELECT COUNT(*) as c FROM tasks WHERE ${dateFilter} AND status = 'skippee'`
    ).get().c,
    pomodoros_completed: db.prepare(`
      SELECT COUNT(*) as c FROM pomodoro_sessions ps
      JOIN tasks t ON ps.task_id = t.id
      WHERE t.${dateFilter} AND ps.completed = 1
    `).get().c,
  };

  stats.completion_rate = stats.tasks_total > 0
    ? Math.round((stats.tasks_done / stats.tasks_total) * 100)
    : 0;

  res.json(stats);
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Production: serve built frontend
if (process.env.NODE_ENV === 'production') {
  const frontendDist = path.join(__dirname, '..', 'frontend', 'dist');
  app.use(express.static(frontendDist));
  app.get('*', (req, res) => {
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Routina API running on http://localhost:${PORT}`);
});
