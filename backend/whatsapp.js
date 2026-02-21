const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const BRIDGE_URL = process.env.WHATSAPP_BRIDGE_URL || 'http://localhost:3001';
const VAULT_PATH = process.env.VAULT_PATH;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function restartBridge() {
  console.log('[whatsapp] Restarting whatsapp-bridge service...');
  try {
    execSync('systemctl --user restart whatsapp-bridge', { timeout: 30000 });
  } catch (err) {
    console.error('[whatsapp] Failed to restart bridge:', err.message);
    return false;
  }

  // Wait for bridge to be ready (up to 60s)
  for (let i = 0; i < 12; i++) {
    await sleep(5000);
    if (await isBridgeReady()) {
      console.log('[whatsapp] Bridge restarted and ready');
      return true;
    }
  }
  console.error('[whatsapp] Bridge not ready after restart');
  return false;
}

async function sendMessageOnce(number, message) {
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

async function sendMessage(number, message) {
  try {
    return await sendMessageOnce(number, message);
  } catch (err) {
    console.warn(`[whatsapp] Send to ${number} failed: ${err.message} — restarting bridge and retrying...`);
    const restarted = await restartBridge();
    if (!restarted) throw err;
    return await sendMessageOnce(number, message);
  }
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
