const cron = require('node-cron');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const db = require('./db');
const { sendMessage, isBridgeReady, archiveSummary } = require('./whatsapp');

const APP_URL = process.env.APP_URL || 'http://localhost:3002';

const RECIPIENTS = [
  { key: 'arnaud', phone: process.env.WA_ARNAUD, label: null },
  { key: 'erick', phone: process.env.WA_ERICK, label: 'Papa' },
  { key: 'elisa', phone: process.env.WA_ELISA, label: 'Elisa' },
  { key: 'martine', phone: process.env.WA_MARTINE, label: 'Maman' },
];

function formatDate(dateStr) {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function progressBar(pct) {
  const filled = Math.round(pct / 10);
  return '█'.repeat(filled) + '░'.repeat(10 - filled) + ` ${pct}%`;
}

function generateSummary(date, contactKey) {
  const tasks = db.prepare('SELECT * FROM tasks WHERE date = ? ORDER BY sort_order ASC').all(date);

  if (tasks.length === 0) return null;

  const done = tasks.filter((t) => t.status === 'terminee');
  const skipped = tasks.filter((t) => t.status === 'skippee');
  const todo = tasks.filter((t) => t.status === 'a_faire' || t.status === 'en_cours');

  const total = tasks.length;
  const pct = total > 0 ? Math.round((done.length / total) * 100) : 0;

  let msg = `Bilan Routina — Arnaud — ${formatDate(date)}\n\n`;
  msg += `${progressBar(pct)}\n\n`;

  if (done.length > 0) {
    msg += `Terminées (${done.length}) :\n`;
    for (const t of done) {
      msg += `- ${t.title} (${t.category})`;
      if (t.pomodoros_done > 0) msg += ` — ${t.pomodoros_done} pomodoro${t.pomodoros_done > 1 ? 's' : ''}`;
      msg += '\n';
    }
    msg += '\n';
  }

  if (skipped.length > 0) {
    msg += `Skippées (${skipped.length}) :\n`;
    for (const t of skipped) {
      msg += `- ${t.title} (${t.category})\n`;
    }
    msg += '\n';
  }

  if (todo.length > 0) {
    msg += `Restantes (${todo.length}) :\n`;
    for (const t of todo) {
      msg += `- ${t.title} (${t.category})\n`;
    }
    msg += '\n';
  }

  msg += `Score : ${done.length}/${total}`;

  if (contactKey) {
    msg += `\n\nDonnez-moi de la force ! 💪\n👉 ${APP_URL}/chat/${contactKey}`;
  }

  return msg;
}

async function sendDailySummary() {
  const date = todayStr();

  // Check if there are tasks at all
  const testSummary = generateSummary(date, null);
  if (!testSummary) {
    console.log('[cron] No tasks today, skipping summary');
    return;
  }

  const ready = await isBridgeReady();
  if (!ready) {
    console.error('[cron] WhatsApp bridge not ready, skipping summary');
    return;
  }

  for (const { key, phone } of RECIPIENTS) {
    if (!phone) continue;
    const contactKey = key === 'arnaud' ? null : key;
    const summary = generateSummary(date, contactKey);
    try {
      await sendMessage(phone, summary);
      console.log(`[cron] Summary sent to ${key} (${phone})`);
    } catch (err) {
      console.error(`[cron] Failed to send to ${key}:`, err.message);
    }
  }

  // Archive Arnaud's version (no link) to vault
  archiveSummary(date, generateSummary(date, null));
  console.log(`[cron] Summary archived for ${date}`);
}

function startCron() {
  // Every day at 20:00
  cron.schedule('0 20 * * *', () => {
    console.log('[cron] Triggering daily summary...');
    sendDailySummary().catch((err) => console.error('[cron] Summary error:', err));
  }, { timezone: 'Europe/Paris' });

  console.log('Cron scheduled: daily summary at 20:00 Europe/Paris');
}

module.exports = { startCron, sendDailySummary, generateSummary };
