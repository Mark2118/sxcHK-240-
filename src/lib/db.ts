/**
 * WinGo 学情洞察 — SQLite 持久化数据库层
 * 数据持久化，重启不丢失
 */

import Database from 'better-sqlite3'
import path from 'path'
import { emitUserRegistered, emitFreeQuotaExhausted } from './marketing'

const dbPath = process.env.DATABASE_URL?.replace('file:', '') || path.join(process.cwd(), 'data', 'wingo-xsc.db')

const db = new Database(dbPath)
db.pragma('journal_mode = WAL')

// 初始化表结构（兼容旧表，自动迁移）
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    openid TEXT UNIQUE NOT NULL,
    unionid TEXT,
    nickname TEXT,
    avatar TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS user_limits (
    user_id TEXT PRIMARY KEY,
    free_count INTEGER DEFAULT 3,
    member_type TEXT DEFAULT 'none',
    member_expire TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS reports (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    subject TEXT NOT NULL,
    score INTEGER NOT NULL,
    total_questions INTEGER NOT NULL,
    correct INTEGER NOT NULL,
    wrong INTEGER NOT NULL,
    ocr_text TEXT,
    report_json TEXT NOT NULL,
    html TEXT,
    exercises_json TEXT,
    knowledge_summary TEXT,
    status TEXT DEFAULT 'free',
    created_at TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    type TEXT NOT NULL,
    amount INTEGER NOT NULL,
    status TEXT DEFAULT 'pending',
    wx_order_id TEXT,
    created_at TEXT NOT NULL,
    paid_at TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS user_report_access (
    user_id TEXT NOT NULL,
    report_id TEXT NOT NULL,
    accessed_at TEXT NOT NULL,
    PRIMARY KEY (user_id, report_id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (report_id) REFERENCES reports(id)
  );

  CREATE INDEX IF NOT EXISTS idx_reports_created_at ON reports(created_at DESC);
  CREATE INDEX IF NOT EXISTS idx_reports_user_id ON reports(user_id);
  CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
  CREATE INDEX IF NOT EXISTS idx_user_report_access_user_id ON user_report_access(user_id);
`)

// 兼容旧表迁移（幂等性处理，防止 Next.js 构建多 worker 并发导致 duplicate column）
function addColumnIfMissing(table: string, column: string, definition: string) {
  try {
    db.prepare(`SELECT ${column} FROM ${table} LIMIT 1`).get()
  } catch (err: any) {
    if (err.message?.includes('no such column')) {
      try {
        db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`)
      } catch (alterErr: any) {
        // 忽略并发导致的 duplicate column 错误
        if (!alterErr.message?.includes('duplicate column name')) {
          console.warn(`[DB] 添加列 ${column} 失败:`, alterErr.message)
        }
      }
    }
  }
}

addColumnIfMissing('reports', 'ocr_text', 'TEXT')
addColumnIfMissing('reports', 'user_id', 'TEXT')
addColumnIfMissing('reports', 'status', "TEXT DEFAULT 'free'")
addColumnIfMissing('reports', 'knowledge_summary', 'TEXT')

export interface KnowledgeSummary {
  modules: Record<string, { correct: number; total: number; rate: number }>
  weakPoints: string[]
  knowledgePoints: Array<{ name: string; isCorrect: boolean; module: string }>
}

export interface CheckRecord {
  id: string
  userId?: string
  subject: string
  score: number
  totalQuestions: number
  correct: number
  wrong: number
  ocrText?: string
  reportJson: string
  html?: string
  exercisesJson?: string
  knowledgeSummary?: string
  status?: string
  createdAt: string
}

export interface UserRecord {
  id: string
  openid: string
  unionid?: string
  nickname?: string
  avatar?: string
  createdAt: string
  updatedAt: string
}

export interface UserLimitRecord {
  userId: string
  freeCount: number
  memberType: 'none' | 'month' | 'year'
  memberExpire?: string
}

export interface OrderRecord {
  id: string
  userId: string
  type: 'single' | 'month' | 'year'
  amount: number
  status: 'pending' | 'paid' | 'failed'
  wxOrderId?: string
  createdAt: string
  paidAt?: string
}

export interface UserReportAccessRecord {
  userId: string
  reportId: string
  accessedAt: string
}

export const dbClient = {
  users: {
    findByOpenid: (openid: string) => {
      const stmt = db.prepare('SELECT id, openid, unionid, nickname, avatar, created_at as createdAt, updated_at as updatedAt FROM users WHERE openid = ?')
      return (stmt.get(openid) as UserRecord) || null
    },
    create: (openid: string, unionid?: string, nickname?: string, avatar?: string) => {
      const id = 'WGU-' + Date.now().toString(36).toUpperCase()
      const now = new Date().toISOString()
      const stmt = db.prepare('INSERT INTO users (id, openid, unionid, nickname, avatar, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
      stmt.run(id, openid, unionid || null, nickname || null, avatar || null, now, now)
      db.prepare("INSERT INTO user_limits (user_id, free_count, member_type) VALUES (?, 3, 'none')").run(id)
      // 触发营销事件：新用户注册
      emitUserRegistered(id, openid, nickname)
      return { id, openid, unionid, nickname, avatar, createdAt: now, updatedAt: now } as UserRecord
    },
    update: (id: string, data: Partial<Pick<UserRecord, 'nickname' | 'avatar'>>) => {
      const sets: string[] = []
      const vals: (string | null)[] = []
      if (data.nickname !== undefined) { sets.push('nickname = ?'); vals.push(data.nickname) }
      if (data.avatar !== undefined) { sets.push('avatar = ?'); vals.push(data.avatar) }
      if (sets.length === 0) return false
      sets.push('updated_at = ?')
      vals.push(new Date().toISOString())
      vals.push(id)
      const stmt = db.prepare(`UPDATE users SET ${sets.join(', ')} WHERE id = ?`)
      return stmt.run(...vals).changes > 0
    },
    findById: (id: string) => {
      const stmt = db.prepare('SELECT id, openid, unionid, nickname, avatar, created_at as createdAt, updated_at as updatedAt FROM users WHERE id = ?')
      return (stmt.get(id) as UserRecord) || null
    },
  },
  userLimits: {
    findByUserId: (userId: string) => {
      const stmt = db.prepare('SELECT user_id as userId, free_count as freeCount, member_type as memberType, member_expire as memberExpire FROM user_limits WHERE user_id = ?')
      return (stmt.get(userId) as UserLimitRecord) || null
    },
    decrementFree: (userId: string) => {
      const stmt = db.prepare('UPDATE user_limits SET free_count = free_count - 1 WHERE user_id = ? AND free_count > 0')
      return stmt.run(userId).changes > 0
    },
    setMember: (userId: string, type: 'month' | 'year', expireDate: string) => {
      const stmt = db.prepare('UPDATE user_limits SET member_type = ?, member_expire = ? WHERE user_id = ?')
      return stmt.run(type, expireDate, userId).changes > 0
    },
    canGenerate: (userId: string) => {
      const limit = dbClient.userLimits.findByUserId(userId)
      if (!limit) return { can: false, reason: 'no_user' }
      if (limit.memberType !== 'none' && limit.memberExpire && new Date(limit.memberExpire) > new Date()) {
        return { can: true, type: 'member', freeCount: limit.freeCount }
      }
      if (limit.freeCount > 0) {
        return { can: true, type: 'free', freeCount: limit.freeCount }
      }
      return { can: false, reason: 'no_quota', type: limit.memberType, freeCount: 0 }
    },
    canViewFullReport: (userId: string) => {
      const limit = dbClient.userLimits.findByUserId(userId)
      if (!limit) return { can: false, reason: 'no_user' }
      if (limit.memberType !== 'none' && limit.memberExpire && new Date(limit.memberExpire) > new Date()) {
        return { can: true, type: 'member', freeCount: limit.freeCount }
      }
      if (limit.freeCount > 0) {
        return { can: true, type: 'free', freeCount: limit.freeCount }
      }
      return { can: false, reason: 'no_quota', type: limit.memberType, freeCount: 0 }
    },
    useFreeQuota: (userId: string) => {
      const before = dbClient.userLimits.findByUserId(userId)
      const stmt = db.prepare('UPDATE user_limits SET free_count = free_count - 1 WHERE user_id = ? AND free_count > 0')
      const success = stmt.run(userId).changes > 0
      // 触发营销事件：免费额度用完
      if (success && before && before.freeCount === 1) {
        const user = dbClient.users.findById(userId)
        if (user) emitFreeQuotaExhausted(userId, user.openid)
      }
      return success
    },
    addFreeQuota: (userId: string, count: number = 1) => {
      const stmt = db.prepare('UPDATE user_limits SET free_count = free_count + ? WHERE user_id = ?')
      return stmt.run(count, userId).changes > 0
    },
  },
  userReportAccess: {
    hasAccess: (userId: string, reportId: string) => {
      const stmt = db.prepare('SELECT 1 FROM user_report_access WHERE user_id = ? AND report_id = ?')
      return !!stmt.get(userId, reportId)
    },
    grantAccess: (userId: string, reportId: string) => {
      const now = new Date().toISOString()
      const stmt = db.prepare('INSERT OR IGNORE INTO user_report_access (user_id, report_id, accessed_at) VALUES (?, ?, ?)')
      stmt.run(userId, reportId, now)
      return true
    },
  },
  orders: {
    create: (userId: string, type: 'single' | 'month' | 'year', amount: number) => {
      const id = 'WGO-' + Date.now().toString(36).toUpperCase()
      const now = new Date().toISOString()
      const stmt = db.prepare('INSERT INTO orders (id, user_id, type, amount, status, created_at) VALUES (?, ?, ?, ?, ?, ?)')
      stmt.run(id, userId, type, amount, 'pending', now)
      return { id, userId, type, amount, status: 'pending', createdAt: now } as OrderRecord
    },
    markPaid: (id: string, wxOrderId: string) => {
      const now = new Date().toISOString()
      const stmt = db.prepare('UPDATE orders SET status = ?, wx_order_id = ?, paid_at = ? WHERE id = ?')
      return stmt.run('paid', wxOrderId, now, id).changes > 0
    },
    findById: (id: string) => {
      const stmt = db.prepare('SELECT id, user_id as userId, type, amount, status, wx_order_id as wxOrderId, created_at as createdAt, paid_at as paidAt FROM orders WHERE id = ?')
      return (stmt.get(id) as OrderRecord) || null
    },
    findByUserId: (userId: string) => {
      const stmt = db.prepare('SELECT id, user_id as userId, type, amount, status, wx_order_id as wxOrderId, created_at as createdAt, paid_at as paidAt FROM orders WHERE user_id = ? ORDER BY created_at DESC')
      return stmt.all(userId) as OrderRecord[]
    },
  },
  check: {
    create: async (data: Omit<CheckRecord, 'id' | 'createdAt'>) => {
      const id = 'WGXQ-' + Date.now().toString(36).toUpperCase()
      const createdAt = new Date().toISOString()
      const stmt = db.prepare(`
        INSERT INTO reports (id, user_id, subject, score, total_questions, correct, wrong, ocr_text, report_json, html, exercises_json, knowledge_summary, status, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)
      stmt.run(
        id,
        data.userId || null,
        data.subject,
        data.score,
        data.totalQuestions,
        data.correct,
        data.wrong,
        data.ocrText || null,
        data.reportJson,
        data.html || null,
        data.exercisesJson || null,
        data.knowledgeSummary || null,
        data.status || 'free',
        createdAt
      )
      return { id, ...data, createdAt }
    },

    findByUserIdForTrends: async (userId: string, subject?: string, limit: number = 100) => {
      let sql = `
        SELECT id, user_id as userId, subject, score, total_questions as totalQuestions, correct, wrong,
               report_json as reportJson, knowledge_summary as knowledgeSummary, status, created_at as createdAt
        FROM reports
        WHERE user_id = ?
      `
      const params: (string | number)[] = [userId]
      if (subject) {
        sql += ' AND subject = ?'
        params.push(subject)
      }
      sql += ' ORDER BY created_at ASC LIMIT ?'
      params.push(limit)
      const stmt = db.prepare(sql)
      return stmt.all(...params) as CheckRecord[]
    },

    findMany: async (limit: number = 50) => {
      const stmt = db.prepare(`
        SELECT id, user_id as userId, subject, score, total_questions as totalQuestions, correct, wrong, ocr_text as ocrText, report_json as reportJson, html, exercises_json as exercisesJson, status, created_at as createdAt
        FROM reports
        ORDER BY created_at DESC
        LIMIT ?
      `)
      return stmt.all(limit) as CheckRecord[]
    },

    findById: async (id: string) => {
      const stmt = db.prepare(`
        SELECT id, user_id as userId, subject, score, total_questions as totalQuestions, correct, wrong, ocr_text as ocrText, report_json as reportJson, html, exercises_json as exercisesJson, status, created_at as createdAt
        FROM reports
        WHERE id = ?
      `)
      return (stmt.get(id) as CheckRecord) || null
    },

    delete: async (id: string) => {
      const stmt = db.prepare('DELETE FROM reports WHERE id = ?')
      const result = stmt.run(id)
      return result.changes > 0
    },
    findByUserId: async (userId: string, limit: number = 50) => {
      const stmt = db.prepare(`
        SELECT id, user_id as userId, subject, score, total_questions as totalQuestions, correct, wrong, status, created_at as createdAt
        FROM reports
        WHERE user_id = ?
        ORDER BY created_at DESC
        LIMIT ?
      `)
      return stmt.all(userId, limit) as CheckRecord[]
    },
  },
}
