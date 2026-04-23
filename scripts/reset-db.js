/**
 * 重置数据库 — 清空所有数据但保留表结构
 * 用法: node scripts/reset-db.js
 */

const Database = require('better-sqlite3')
const path = require('path')

const dbPath = process.env.DATABASE_URL?.replace('file:', '') || path.join(process.cwd(), 'data', 'wingo-xsc.db')
const db = new Database(dbPath)

const tables = ['users', 'user_limits', 'reports', 'orders', 'user_report_access', 'applications', 'institutions', 'classes', 'students', 'batch_analyses']

for (const t of tables) {
  try {
    db.prepare(`DELETE FROM ${t}`).run()
    console.log(`[✓] 清空表: ${t}`)
  } catch (e) {
    console.log(`[×] 跳过表: ${t} (${e.message})`)
  }
}

console.log('[✓] 数据库已重置，下次启动自动重建结构')
