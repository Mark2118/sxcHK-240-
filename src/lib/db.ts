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

  CREATE TABLE IF NOT EXISTS applications (
    id TEXT PRIMARY KEY,
    company TEXT NOT NULL,
    contact_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT,
    problem TEXT,
    status TEXT DEFAULT 'pending',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  -- ====== B端机构表 ======
  CREATE TABLE IF NOT EXISTS institutions (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    contact TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT,
    logo TEXT,
    primary_color TEXT DEFAULT '#3B82F6',
    report_template TEXT DEFAULT 'default',
    api_key TEXT UNIQUE NOT NULL,
    api_secret TEXT NOT NULL,
    plan TEXT DEFAULT 'trial',
    expires_at TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS classes (
    id TEXT PRIMARY KEY,
    institution_id TEXT NOT NULL,
    name TEXT NOT NULL,
    grade INTEGER NOT NULL,
    subject TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (institution_id) REFERENCES institutions(id)
  );

  CREATE TABLE IF NOT EXISTS students (
    id TEXT PRIMARY KEY,
    institution_id TEXT NOT NULL,
    class_id TEXT NOT NULL,
    name TEXT NOT NULL,
    parent_user_id TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (institution_id) REFERENCES institutions(id),
    FOREIGN KEY (class_id) REFERENCES classes(id)
  );

  CREATE TABLE IF NOT EXISTS batch_analyses (
    id TEXT PRIMARY KEY,
    institution_id TEXT NOT NULL,
    class_id TEXT NOT NULL,
    status TEXT DEFAULT 'processing',
    total INTEGER NOT NULL,
    completed INTEGER DEFAULT 0,
    results TEXT,
    created_at TEXT NOT NULL,
    completed_at TEXT,
    FOREIGN KEY (institution_id) REFERENCES institutions(id),
    FOREIGN KEY (class_id) REFERENCES classes(id)
  );

  CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);
  CREATE INDEX IF NOT EXISTS idx_applications_created_at ON applications(created_at DESC);
  CREATE INDEX IF NOT EXISTS idx_reports_user_id ON reports(user_id);
  CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
  CREATE INDEX IF NOT EXISTS idx_user_report_access_user_id ON user_report_access(user_id);
  CREATE INDEX IF NOT EXISTS idx_institutions_api_key ON institutions(api_key);
  CREATE INDEX IF NOT EXISTS idx_classes_institution ON classes(institution_id);
  CREATE INDEX IF NOT EXISTS idx_students_institution_class ON students(institution_id, class_id);
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

export interface InstitutionRecord {
  id: string
  name: string
  type: string
  contact: string
  phone: string
  email?: string
  logo?: string
  primaryColor?: string
  reportTemplate?: string
  apiKey: string
  apiSecret: string
  plan: string
  expiresAt?: string
  createdAt: string
  updatedAt: string
}

export interface ClassRecord {
  id: string
  institutionId: string
  name: string
  grade: number
  subject: string
  createdAt: string
  updatedAt: string
}

export interface StudentRecord {
  id: string
  institutionId: string
  classId: string
  name: string
  parentUserId?: string
  createdAt: string
  updatedAt: string
}

export interface BatchAnalysisRecord {
  id: string
  institutionId: string
  classId: string
  status: string
  total: number
  completed: number
  results?: string
  createdAt: string
  completedAt?: string
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

  // ====== B端机构 ======
  institutions: {
    create: (data: {
      name: string
      type: string
      contact: string
      phone: string
      email?: string
    }) => {
      const id = 'WGI-' + Date.now().toString(36).toUpperCase()
      const apiKey = 'wgo_' + crypto.randomUUID().replace(/-/g, '')
      const apiSecret = crypto.randomUUID().replace(/-/g, '')
      const now = new Date().toISOString()
      const stmt = db.prepare(`
        INSERT INTO institutions (id, name, type, contact, phone, email, api_key, api_secret, plan, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)
      stmt.run(id, data.name, data.type, data.contact, data.phone, data.email || null, apiKey, apiSecret, 'trial', now, now)
      return { id, name: data.name, type: data.type, contact: data.contact, phone: data.phone, email: data.email, apiKey, apiSecret, plan: 'trial', createdAt: now, updatedAt: now } as InstitutionRecord
    },
    findByApiKey: (apiKey: string) => {
      const stmt = db.prepare(`
        SELECT id, name, type, contact, phone, email, logo, primary_color as primaryColor, report_template as reportTemplate,
               api_key as apiKey, api_secret as apiSecret, plan, expires_at as expiresAt, created_at as createdAt, updated_at as updatedAt
        FROM institutions WHERE api_key = ?
      `)
      return (stmt.get(apiKey) as InstitutionRecord) || null
    },
    findById: (id: string) => {
      const stmt = db.prepare(`
        SELECT id, name, type, contact, phone, email, logo, primary_color as primaryColor, report_template as reportTemplate,
               api_key as apiKey, api_secret as apiSecret, plan, expires_at as expiresAt, created_at as createdAt, updated_at as updatedAt
        FROM institutions WHERE id = ?
      `)
      return (stmt.get(id) as InstitutionRecord) || null
    },
    update: (id: string, data: Partial<Pick<InstitutionRecord, 'name' | 'contact' | 'phone' | 'email' | 'logo' | 'primaryColor' | 'reportTemplate'>>) => {
      const sets: string[] = []
      const vals: (string | null)[] = []
      if (data.name !== undefined) { sets.push('name = ?'); vals.push(data.name) }
      if (data.contact !== undefined) { sets.push('contact = ?'); vals.push(data.contact) }
      if (data.phone !== undefined) { sets.push('phone = ?'); vals.push(data.phone) }
      if (data.email !== undefined) { sets.push('email = ?'); vals.push(data.email) }
      if (data.logo !== undefined) { sets.push('logo = ?'); vals.push(data.logo) }
      if (data.primaryColor !== undefined) { sets.push('primary_color = ?'); vals.push(data.primaryColor) }
      if (data.reportTemplate !== undefined) { sets.push('report_template = ?'); vals.push(data.reportTemplate) }
      if (sets.length === 0) return false
      sets.push('updated_at = ?')
      vals.push(new Date().toISOString())
      vals.push(id)
      const stmt = db.prepare(`UPDATE institutions SET ${sets.join(', ')} WHERE id = ?`)
      return stmt.run(...vals).changes > 0
    },
  },

  classes: {
    create: (data: { institutionId: string; name: string; grade: number; subject: string }) => {
      const id = 'WGC-' + Date.now().toString(36).toUpperCase()
      const now = new Date().toISOString()
      const stmt = db.prepare(`INSERT INTO classes (id, institution_id, name, grade, subject, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)`)
      stmt.run(id, data.institutionId, data.name, data.grade, data.subject, now, now)
      return { id, ...data, createdAt: now, updatedAt: now } as ClassRecord
    },
    findByInstitution: (institutionId: string) => {
      const stmt = db.prepare(`
        SELECT id, institution_id as institutionId, name, grade, subject, created_at as createdAt, updated_at as updatedAt
        FROM classes WHERE institution_id = ? ORDER BY created_at DESC
      `)
      return stmt.all(institutionId) as ClassRecord[]
    },
    findById: (id: string) => {
      const stmt = db.prepare(`
        SELECT id, institution_id as institutionId, name, grade, subject, created_at as createdAt, updated_at as updatedAt
        FROM classes WHERE id = ?
      `)
      return (stmt.get(id) as ClassRecord) || null
    },
    delete: (id: string) => {
      return db.prepare('DELETE FROM classes WHERE id = ?').run(id).changes > 0
    },
  },

  students: {
    create: (data: { institutionId: string; classId: string; name: string; parentUserId?: string }) => {
      const id = 'WGS-' + Date.now().toString(36).toUpperCase()
      const now = new Date().toISOString()
      const stmt = db.prepare(`INSERT INTO students (id, institution_id, class_id, name, parent_user_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)`)
      stmt.run(id, data.institutionId, data.classId, data.name, data.parentUserId || null, now, now)
      return { id, ...data, createdAt: now, updatedAt: now } as StudentRecord
    },
    findByClass: (classId: string) => {
      const stmt = db.prepare(`
        SELECT id, institution_id as institutionId, class_id as classId, name, parent_user_id as parentUserId, created_at as createdAt, updated_at as updatedAt
        FROM students WHERE class_id = ? ORDER BY created_at DESC
      `)
      return stmt.all(classId) as StudentRecord[]
    },
    findByInstitution: (institutionId: string) => {
      const stmt = db.prepare(`
        SELECT id, institution_id as institutionId, class_id as classId, name, parent_user_id as parentUserId, created_at as createdAt, updated_at as updatedAt
        FROM students WHERE institution_id = ? ORDER BY created_at DESC
      `)
      return stmt.all(institutionId) as StudentRecord[]
    },
    delete: (id: string) => {
      return db.prepare('DELETE FROM students WHERE id = ?').run(id).changes > 0
    },
  },

  batchAnalyses: {
    create: (data: { institutionId: string; classId: string; total: number }) => {
      const id = 'WGB-' + Date.now().toString(36).toUpperCase()
      const now = new Date().toISOString()
      const stmt = db.prepare(`INSERT INTO batch_analyses (id, institution_id, class_id, status, total, created_at) VALUES (?, ?, ?, ?, ?, ?)`)
      stmt.run(id, data.institutionId, data.classId, 'processing', data.total, now)
      return { id, ...data, status: 'processing', completed: 0, createdAt: now } as BatchAnalysisRecord
    },
    findByInstitution: (institutionId: string) => {
      const stmt = db.prepare(`
        SELECT id, institution_id as institutionId, class_id as classId, status, total, completed, results, created_at as createdAt, completed_at as completedAt
        FROM batch_analyses WHERE institution_id = ? ORDER BY created_at DESC
      `)
      return stmt.all(institutionId) as BatchAnalysisRecord[]
    },
    findById: (id: string) => {
      const stmt = db.prepare(`
        SELECT id, institution_id as institutionId, class_id as classId, status, total, completed, results, created_at as createdAt, completed_at as completedAt
        FROM batch_analyses WHERE id = ?
      `)
      return (stmt.get(id) as BatchAnalysisRecord) || null
    },
    updateProgress: (id: string, completed: number, results?: string) => {
      const now = new Date().toISOString()
      const stmt = db.prepare(`
        UPDATE batch_analyses SET completed = ?, results = ?, status = ?, completed_at = ? WHERE id = ?
      `)
      return stmt.run(completed, results || null, completed > 0 ? 'completed' : 'processing', now, id).changes > 0
    },
    updateStatus: (id: string, status: string) => {
      const stmt = db.prepare(`UPDATE batch_analyses SET status = ? WHERE id = ?`)
      return stmt.run(status, id).changes > 0
    },
  },

  // ====== 试用申请表 ======
  applications: {
    create: async (data: {
      company: string
      contactName: string
      phone: string
      email?: string
      problem?: string
    }) => {
      const id = 'WGA-' + Date.now().toString(36).toUpperCase()
      const now = new Date().toISOString()
      const stmt = db.prepare(`
        INSERT INTO applications (id, company, contact_name, phone, email, problem, status, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)
      stmt.run(id, data.company, data.contactName, data.phone, data.email || null, data.problem || null, 'pending', now, now)
      return { id, ...data, status: 'pending' as const, createdAt: now, updatedAt: now }
    },

    findById: async (id: string) => {
      const stmt = db.prepare(`
        SELECT id, company, contact_name as contactName, phone, email, problem, status, created_at as createdAt, updated_at as updatedAt
        FROM applications WHERE id = ?
      `)
      return (stmt.get(id) as any) || null
    },

    findByStatus: async (status?: string, limit: number = 50) => {
      if (status) {
        const stmt = db.prepare(`
          SELECT id, company, contact_name as contactName, phone, email, problem, status, created_at as createdAt
          FROM applications WHERE status = ? ORDER BY created_at DESC LIMIT ?
        `)
        return stmt.all(status, limit) as any[]
      }
      const stmt = db.prepare(`
        SELECT id, company, contact_name as contactName, phone, email, problem, status, created_at as createdAt
        FROM applications ORDER BY created_at DESC LIMIT ?
      `)
      return stmt.all(limit) as any[]
    },

    updateStatus: async (id: string, status: 'pending' | 'approved' | 'rejected' | 'active') => {
      const stmt = db.prepare(`
        UPDATE applications SET status = ?, updated_at = ? WHERE id = ?
      `)
      const result = stmt.run(status, new Date().toISOString(), id)
      return result.changes > 0
    },
  },
}
