const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const BRIDGE_URL = process.env.WHATSAPP_BRIDGE_URL || 'http://localhost:3001';
const VAULT_PATH = process.env.VAULT_PATH;

async function sendMessage(number, message) {
  const res = await fetch(`${BRIDGE_URL}/send`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ number, message }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `WhatsApp send failed: ${res.status}`);
  }

  return res.json();
}

async function isBridgeReady() {
  try {
    const res = await fetch(`${BRIDGE_URL}/health`);
    const data = await res.json();
    return data.status === 'ok';
  } catch {
    return false;
  }
}

// Archive the daily summary to vault
function archiveSummary(date, message) {
  if (!VAULT_PATH) return;

  const dailyDir = path.join(VAULT_PATH, 'daily');
  if (!fs.existsSync(dailyDir)) fs.mkdirSync(dailyDir, { recursive: true });

  const filePath = path.join(dailyDir, `${date}.md`);
  const section = `\n## Routina — Bilan quotidien\n\n${message}\n`;

  if (fs.existsSync(filePath)) {
    fs.appendFileSync(filePath, section);
  } else {
    fs.writeFileSync(filePath, `# ${date}\n${section}`);
  }
}

module.exports = { sendMessage, isBridgeReady, archiveSummary };
