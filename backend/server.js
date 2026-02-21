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
app.use('/api/comments', require('./routes/comments'));

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

// Dashboard stats endpoint
app.get('/api/stats/dashboard', (req, res) => {
  // 1. Daily stats for last 7 days
  const daily = db.prepare(`
    SELECT date,
           COUNT(*) as total,
           SUM(CASE WHEN status = 'terminee' THEN 1 ELSE 0 END) as done,
           SUM(CASE WHEN status = 'skippee' THEN 1 ELSE 0 END) as skipped
    FROM tasks
    WHERE date >= date('now', '-6 days') AND date <= date('now')
    GROUP BY date
    ORDER BY date
  `).all();

  // Fill missing days with zeros
  const dailyMap = {};
  for (const row of daily) {
    dailyMap[row.date] = row;
  }
  const dailyFull = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    dailyFull.push(dailyMap[dateStr] || { date: dateStr, total: 0, done: 0, skipped: 0 });
  }

  // 2. Categories (last 30 days)
  const categories = db.prepare(`
    SELECT category,
           COUNT(*) as total,
           SUM(CASE WHEN status = 'terminee' THEN 1 ELSE 0 END) as done
    FROM tasks
    WHERE date >= date('now', '-30 days')
    GROUP BY category
    ORDER BY total DESC
  `).all();

  // 3. Pomodoros completed (week + month)
  const pomodoroWeek = db.prepare(`
    SELECT COUNT(*) as c FROM pomodoro_sessions
    WHERE completed = 1 AND started_at >= datetime('now', '-7 days')
  `).get().c;

  const pomodoroMonth = db.prepare(`
    SELECT COUNT(*) as c FROM pomodoro_sessions
    WHERE completed = 1 AND started_at >= datetime('now', '-30 days')
  `).get().c;

  // 4. Streak: consecutive days with at least 1 task done
  const streakRows = db.prepare(`
    SELECT date, SUM(CASE WHEN status = 'terminee' THEN 1 ELSE 0 END) as done
    FROM tasks
    WHERE date <= date('now')
    GROUP BY date
    ORDER BY date DESC
    LIMIT 60
  `).all();

  let streak = 0;
  const today = new Date();
  for (let i = 0; i <= 60; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    const row = streakRows.find(r => r.date === dateStr);
    if (row && row.done > 0) {
      streak++;
    } else if (i === 0) {
      // Today can have 0 done (day not over yet), skip it
      continue;
    } else {
      break;
    }
  }

  res.json({
    daily: dailyFull,
    categories,
    pomodoros: { week: pomodoroWeek, month: pomodoroMonth },
    streak,
  });
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

// Start cron jobs
const { startCron } = require('./cron');
startCron();

// Manual trigger for daily summary (for testing)
app.post('/api/summary/send', async (req, res) => {
  const { sendDailySummary } = require('./cron');
  try {
    await sendDailySummary();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Routina API running on http://localhost:${PORT}`);
});
