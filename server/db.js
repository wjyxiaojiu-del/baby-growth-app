const Database = require('better-sqlite3')
const path = require('path')

const DB_PATH = path.join(__dirname, 'data', 'baby_growth.db')

// 确保 data 目录存在
const fs = require('fs')
fs.mkdirSync(path.join(__dirname, 'data'), { recursive: true })

const db = new Database(DB_PATH)

// 开启 WAL 模式提高并发性能
db.pragma('journal_mode = WAL')

// 初始化表结构
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    openid TEXT UNIQUE NOT NULL,
    nickname TEXT DEFAULT '',
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS user_data (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    openid TEXT UNIQUE NOT NULL,
    data TEXT NOT NULL DEFAULT '{}',
    version INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  );

  CREATE INDEX IF NOT EXISTS idx_user_data_openid ON user_data(openid);
`)

// 预编译语句
const stmts = {
  getOrCreateUser: db.prepare(`INSERT OR IGNORE INTO users (openid) VALUES (?)`),
  getUser: db.prepare(`SELECT * FROM users WHERE openid = ?`),
  updateNickname: db.prepare(`UPDATE users SET nickname = ?, updated_at = datetime('now') WHERE openid = ?`),

  getData: db.prepare(`SELECT data, version FROM user_data WHERE openid = ?`),
  upsertData: db.prepare(`
    INSERT INTO user_data (openid, data, version, updated_at)
    VALUES (?, ?, 1, datetime('now'))
    ON CONFLICT(openid) DO UPDATE SET
      data = excluded.data,
      version = user_data.version + 1,
      updated_at = datetime('now')
  `),

  deleteUser: db.prepare(`DELETE FROM user_data WHERE openid = ?`),
  deleteUserData: db.prepare(`DELETE FROM users WHERE openid = ?`),

  getUserCount: db.prepare(`SELECT COUNT(*) as count FROM users`),
  getDataCount: db.prepare(`SELECT COUNT(*) as count FROM user_data`)
}

module.exports = { db, stmts }
