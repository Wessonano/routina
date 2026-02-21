const { Router } = require('express');
const db = require('../db');
const gcal = require('../google-calendar');
const router = Router();

// GET /api/calendar/status — check if Google Calendar is connected
router.get('/status', (req, res) => {
  res.json({ connected: gcal.isAuthenticated() });
});

// GET /api/calendar/auth — get OAuth2 URL to connect Google Calendar
router.get('/auth', (req, res) => {
  const url = gcal.getAuthUrl();
  if (!url) {
    return res.status(500).json({ error: 'Google credentials not configured' });
  }
  res.json({ url });
});

// GET /api/calendar/callback — OAuth2 callback from Google
router.get('/callback', async (req, res) => {
  const { code } = req.query;
  if (!code) return res.status(400).json({ error: 'missing code' });

  try {
    await gcal.handleCallback(code);
    // Redirect to frontend after successful auth
    const baseUrl = process.env.NODE_ENV === 'production' ? '' : 'http://localhost:5173';
    res.redirect(`${baseUrl}/?gcal=connected`);
  } catch (err) {
    res.status(500).json({ error: 'OAuth failed: ' + err.message });
  }
});

// GET /api/calendar/events?date=YYYY-MM-DD — external Google Calendar events
router.get('/events', async (req, res) => {
  const { date } = req.query;
  if (!date) return res.status(400).json({ error: 'date required' });

  if (!gcal.isAuthenticated()) {
    return res.json([]);
  }

  try {
    const events = await gcal.getExternalEvents(date);
    res.json(events);
  } catch (err) {
    console.error('Calendar events fetch error:', err.message);
    res.json([]);
  }
});

// POST /api/calendar/sync — sync all tasks for a date to Google Calendar
router.post('/sync', async (req, res) => {
  const { date } = req.body;
  if (!date) return res.status(400).json({ error: 'date required' });

  if (!gcal.isAuthenticated()) {
    return res.status(401).json({ error: 'Google Calendar not connected' });
  }

  try {
    const tasks = db.prepare(
      'SELECT * FROM tasks WHERE date = ? AND start_time IS NOT NULL'
    ).all(date);

    const results = [];
    for (const task of tasks) {
      try {
        const eventId = await gcal.syncTaskToGoogle(task);
        if (eventId && eventId !== task.google_event_id) {
          db.prepare('UPDATE tasks SET google_event_id = ? WHERE id = ?')
            .run(eventId, task.id);
        }
        results.push({ taskId: task.id, eventId, status: 'ok' });
      } catch (err) {
        results.push({ taskId: task.id, status: 'error', error: err.message });
      }
    }

    res.json({ synced: results.length, results });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
