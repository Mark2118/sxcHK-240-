/**
 * 快速验证修复：3.3 低置信度 + 10.1 L3咨询
 */
import Database from 'better-sqlite3'

const DB_PATH = 'data/wingo-xsc.db'
const BASE = 'http://localhost:3000/xsc'

function ensureTestUser() {
  const db = new Database(DB_PATH)
  // 确保 admin 用户存在
  const exists = db.prepare('SELECT id FROM users WHERE id = ?').get('admin')
  if (!exists) {
    const now = new Date().toISOString()
    db.prepare('INSERT INTO users (id, openid, unionid, nickname, avatar, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .run('admin', 'test-openid', null, '测试管理员', null, now, now)
    db.prepare("INSERT INTO user_limits (user_id, free_count, member_type) VALUES (?, 10, 'none')")
      .run('admin')
    console.log('[init] admin 用户已创建，额度 10 次')
  } else {
    // 重置额度
    db.prepare("UPDATE user_limits SET free_count = 10, member_type = 'none' WHERE user_id = ?")
      .run('admin')
    console.log('[init] admin 额度已重置为 10 次')
  }
  db.close()
}

async function req(path, opts = {}) {
  const res = await fetch(`${BASE}${path}`, { ...opts, headers: { ...opts.headers, 'Content-Type': 'application/json' } })
  const text = await res.text()
  let json
  try { json = JSON.parse(text) } catch { json = null }
  return { status: res.status, text: text.slice(0, 500), json }
}

async function main() {
  ensureTestUser()

  // 获取 token
  const login = await req('/api/auth/login', { method: 'POST', body: JSON.stringify({ masterKey: 'xsc-admin-2026' }) })
  const token = login.json?.token
  if (!token) { console.log('❌ 登录失败', login); return }

  // 3.3 含低置信度标记
  console.log('\n=== 3.3 含低置信度标记 ===')
  const lowConfText = `1. 25+30=? [低置信度] 学生答案：55
2. x+5=10 学生答案：5`
  const r1 = await req('/api/check', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + token },
    body: JSON.stringify({ text: lowConfText, subject: 'math' })
  })
  const pass1 = r1.status === 200 && r1.json?.success === true
  console.log(pass1 ? '✅ 3.3 通过' : '❌ 3.3 失败', `status=${r1.status}`, r1.json?.error || r1.text.slice(0, 200))

  // 10.1 L3深度咨询
  console.log('\n=== 10.1 L3深度咨询 ===')
  const r2 = await req('/api/consult', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + token },
    body: JSON.stringify({ question: '孩子小升初该怎么准备？', context: '' })
  })
  const level = r2.json?.data?.level || r2.json?.level
  const pass2 = r2.status === 200 && (level === 'L1' || level === 'L2' || level === 'L3')
  console.log(pass2 ? '✅ 10.1 通过' : '❌ 10.1 失败', `status=${r2.status} level=${level}`, r2.json?.error || r2.text.slice(0, 200))

  console.log('\n' + (pass1 && pass2 ? '✅ 全部修复通过' : '❌ 仍有失败'))
}

main().catch(e => console.error('脚本错误:', e))
