const { Router } = require('express');
const db = require('../db');
const { sendMessage } = require('../whatsapp');
const router = Router();

// Known contacts mapping (phone → contact name)
const CONTACTS = {
  '33684829480': 'erick',
  '33664341098': 'elisa',
  '33660282669': 'martine',
};

// Reverse mapping (contact name → phone)
const CONTACT_PHONES = {
  erick: '33684829480',
  elisa: '33664341098',
  martine: '33660282669',
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

// GET /api/comments/conversation/:contact — all messages for a contact (all dates)
router.get('/conversation/:contact', (req, res) => {
  const contact = req.params.contact;
  if (!CONTACT_PHONES[contact]) return res.status(400).json({ error: 'unknown contact' });

  const comments = db.prepare(
    "SELECT * FROM comments WHERE author = ? OR (author = 'arnaud' AND target_contact = ?) ORDER BY created_at ASC"
  ).all(contact, contact);
  res.json(comments);
});

// GET /api/comments/unread/:contact — unread count for a specific contact
router.get('/unread/:contact', (req, res) => {
  const contact = req.params.contact;
  const count = db.prepare(
    "SELECT COUNT(*) as c FROM comments WHERE author = ? AND read = 0"
  ).get(contact);
  res.json({ count: count.c });
});

// GET /api/comments/unread-total — total unread across all contacts
router.get('/unread-total', (req, res) => {
  const count = db.prepare(
    "SELECT COUNT(*) as c FROM comments WHERE author != 'arnaud' AND read = 0"
  ).get();
  res.json({ count: count.c });
});

// GET /api/comments/unread — count of unread comments for a date (legacy)
router.get('/unread', (req, res) => {
  const date = req.query.date || todayStr();
  const count = db.prepare(
    "SELECT COUNT(*) as c FROM comments WHERE date = ? AND author != 'arnaud' AND read = 0"
  ).get(date);
  res.json({ count: count.c });
});

// POST /api/comments — reply from Arnaud (sends via WhatsApp)
router.post('/', async (req, res) => {
  const { date, message, replyTo, targetContact } = req.body;
  if (!message) return res.status(400).json({ error: 'message required' });

  const commentDate = date || todayStr();

  // Save in DB with target_contact
  const result = db.prepare(
    'INSERT INTO comments (date, author, message, replied_to, target_contact) VALUES (?, ?, ?, ?, ?)'
  ).run(commentDate, 'arnaud', message, replyTo || null, targetContact || null);

  const comment = db.prepare('SELECT * FROM comments WHERE id = ?').get(result.lastInsertRowid);

  // Resolve phone: use targetContact first, then replyTo, then last non-arnaud commenter
  let targetPhone = null;

  if (targetContact && CONTACT_PHONES[targetContact]) {
    targetPhone = CONTACT_PHONES[targetContact];
  } else if (replyTo) {
    const parent = db.prepare('SELECT * FROM comments WHERE id = ?').get(replyTo);
    if (parent && parent.phone) targetPhone = parent.phone;
  }

  if (!targetPhone) {
    const lastComment = db.prepare(
      "SELECT phone FROM comments WHERE date = ? AND author != 'arnaud' AND phone IS NOT NULL ORDER BY created_at DESC LIMIT 1"
    ).get(commentDate);
    if (lastComment) targetPhone = lastComment.phone;
  }

  if (targetPhone) {
    try {
      let waMessage = message;
      if (replyTo) {
        const parent = db.prepare('SELECT message FROM comments WHERE id = ?').get(replyTo);
        if (parent) {
          const quoted = parent.message.split('\n').map(l => `> ${l}`).join('\n');
          waMessage = `${quoted}\n\n${message}`;
        }
      }
      await sendMessage(targetPhone, waMessage);
    } catch (err) {
      console.error('Failed to send WhatsApp reply:', err.message);
    }
  }

  res.status(201).json(comment);
});

// POST /api/comments/external — message sent by external user via web chat
router.post('/external', (req, res) => {
  const { contact, message } = req.body;
  if (!contact || !message) return res.status(400).json({ error: 'contact and message required' });
  if (!CONTACT_PHONES[contact]) return res.status(400).json({ error: 'unknown contact' });

  const date = todayStr();
  const phone = CONTACT_PHONES[contact];

  const result = db.prepare(
    'INSERT INTO comments (date, author, phone, message) VALUES (?, ?, ?, ?)'
  ).run(date, contact, phone, message);

  const comment = db.prepare('SELECT * FROM comments WHERE id = ?').get(result.lastInsertRowid);

  console.log(`[comment] External web from ${contact}: ${message.substring(0, 50)}...`);
  res.status(201).json(comment);
});

// POST /api/comments/webhook — incoming WhatsApp message from bridge
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

// POST /api/comments/read/:contact — mark all messages from a contact as read
router.post('/read/:contact', (req, res) => {
  const contact = req.params.contact;
  db.prepare(
    "UPDATE comments SET read = 1 WHERE author = ? AND read = 0"
  ).run(contact);
  res.json({ success: true });
});

// POST /api/comments/read — mark all comments as read for a date (legacy)
router.post('/read', (req, res) => {
  const date = req.body.date || todayStr();
  db.prepare(
    "UPDATE comments SET read = 1 WHERE date = ? AND author != 'arnaud' AND read = 0"
  ).run(date);
  res.json({ success: true });
});

module.exports = router;
