const cron = require('node-cron');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const db = require('./db');
const { sendMessage, isBridgeReady, archiveSummary } = require('./whatsapp');

const WA_ERICK = process.env.WA_ERICK;
const WA_ELISA = process.env.WA_ELISA;
const WA_MARTINE = process.env.WA_MARTINE;

function formatDate(dateStr) {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function generateSummary(date) {
  const tasks = db.prepare('SELECT * FROM tasks WHERE date = ? ORDER BY sort_order ASC').all(date);

  if (tasks.length === 0) return null;

  const done = tasks.filter((t) => t.status === 'terminee');
  const skipped = tasks.filter((t) => t.status === 'skippee');
  const todo = tasks.filter((t) => t.status === 'a_faire' || t.status === 'en_cours');

  let msg = `Bilan Routina — Arnaud — ${formatDate(date)}\n\n`;

  if (done.length > 0) {
    msg += `Terminees (${done.length}) :\n`;
    for (const t of done) {
      msg += `- ${t.title} (${t.category})`;
      if (t.pomodoros_done > 0) msg += ` — ${t.pomodoros_done} pomodoro${t.pomodoros_done > 1 ? 's' : ''}`;
      msg += '\n';
    }
    msg += '\n';
  }

  if (skipped.length > 0) {
    msg += `Skippees (${skipped.length}) :\n`;
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

  const total = tasks.length;
  const pct = total > 0 ? Math.round((done.length / total) * 100) : 0;
  msg += `Score : ${done.length}/${total} (${pct}%)\n\n`;
  msg += `Commentez ce message pour me donner votre avis !`;

  return msg;
}

async function sendDailySummary() {
  const date = todayStr();
  const summary = generateSummary(date);

  if (!summary) {
    console.log('[cron] No tasks today, skipping summary');
    return;
  }

  const ready = await isBridgeReady();
  if (!ready) {
    console.error('[cron] WhatsApp bridge not ready, skipping summary');
    return;
  }

  const recipients = [WA_ERICK, WA_ELISA, WA_MARTINE].filter(Boolean);

  for (const number of recipients) {
    try {
      await sendMessage(number, summary);
      console.log(`[cron] Summary sent to ${number}`);
    } catch (err) {
      console.error(`[cron] Failed to send to ${number}:`, err.message);
    }
  }

  // Archive to vault
  archiveSummary(date, summary);
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
