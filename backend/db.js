const Database = require('better-sqlite3');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '..', 'routina.db');
const db = new Database(DB_PATH);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    category TEXT DEFAULT 'autre',
    status TEXT DEFAULT 'a_faire',
    date TEXT NOT NULL,
    start_time TEXT,
    duration_min INTEGER DEFAULT 30,
    pomodoros_done INTEGER DEFAULT 0,
    google_event_id TEXT,
    recurring TEXT,
    sort_order INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS pomodoro_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    task_id INTEGER REFERENCES tasks(id) ON DELETE CASCADE,
    started_at TEXT NOT NULL,
    ended_at TEXT,
    completed INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT
  );

  CREATE INDEX IF NOT EXISTS idx_tasks_date ON tasks(date);
  CREATE INDEX IF NOT EXISTS idx_tasks_date_sort ON tasks(date, sort_order);
  CREATE INDEX IF NOT EXISTS idx_pomodoro_task ON pomodoro_sessions(task_id);
`);

const settingsCount = db.prepare('SELECT COUNT(*) as c FROM settings').get();
if (settingsCount.c === 0) {
  const insert = db.prepare('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)');
  insert.run('pomodoro_work_min', '25');
  insert.run('pomodoro_break_min', '5');
  insert.run('pomodoro_long_break_min', '15');
  insert.run('pomodoro_long_break_after', '4');
}

module.exports = db;
