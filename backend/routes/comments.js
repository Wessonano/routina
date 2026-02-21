const { Router } = require('express');
const db = require('../db');
const { sendMessage } = require('../whatsapp');
const router = Router();

// Known contacts mapping
const CONTACTS = {
  '33684829480': 'erick',
  '33664341098': 'elisa',
  '33660282669': 'martine',
};

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// GET /api/comments?date=YYYY-MM-DD
router.get('/', (req, res) => {
  const date = req.query.date || todayStr();
  const comments = db.prepare(
    'SELECT * FROM comments WHERE date = ? ORDER BY created_at ASC'
  ).all(date);
  res.json(comments);
});

// POST /api/comments — reply from Arnaud (sends via WhatsApp)
router.post('/', async (req, res) => {
  const { date, message, replyTo } = req.body;
  if (!message) return res.status(400).json({ error: 'message required' });

  const commentDate = date || todayStr();

  // Save in DB
  const result = db.prepare(
    'INSERT INTO comments (date, author, message, replied_to) VALUES (?, ?, ?, ?)'
  ).run(commentDate, 'arnaud', message, replyTo || null);

  const comment = db.prepare('SELECT * FROM comments WHERE id = ?').get(result.lastInsertRowid);

  // If replying to someone, send via WhatsApp
  if (replyTo) {
    const parent = db.prepare('SELECT * FROM comments WHERE id = ?').get(replyTo);
    if (parent && parent.phone) {
      try {
        await sendMessage(parent.phone, message);
      } catch (err) {
        console.error('Failed to send WhatsApp reply:', err.message);
      }
    }
  }

  res.status(201).json(comment);
});

// POST /api/comments/webhook — incoming WhatsApp message from bridge
// The WhatsApp bridge will call this for messages from known contacts
router.post('/webhook', (req, res) => {
  const { phone, name, message } = req.body;
  if (!phone || !message) return res.status(400).json({ error: 'phone and message required' });

  const cleanPhone = phone.replace(/[^0-9]/g, '');
  const author = CONTACTS[cleanPhone];

  // Only store messages from known accompagnants
  if (!author) return res.json({ stored: false, reason: 'unknown contact' });

  const date = todayStr();

  const result = db.prepare(
    'INSERT INTO comments (date, author, phone, message) VALUES (?, ?, ?, ?)'
  ).run(date, author, cleanPhone, message);

  const comment = db.prepare('SELECT * FROM comments WHERE id = ?').get(result.lastInsertRowid);

  console.log(`[comment] New from ${author}: ${message.substring(0, 50)}...`);
  res.status(201).json({ stored: true, comment });
});

// GET /api/comments/unread — count of comments not from arnaud for today
router.get('/unread', (req, res) => {
  const date = req.query.date || todayStr();
  const count = db.prepare(
    "SELECT COUNT(*) as c FROM comments WHERE date = ? AND author != 'arnaud'"
  ).get(date);
  res.json({ count: count.c });
});

module.exports = router;
