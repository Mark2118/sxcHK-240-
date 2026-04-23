/**
 * 填充演示数据 — 3个班级 + 10个学员 + 2条批量分析记录
 * 用法: node scripts/seed-demo.js
 */

const Database = require('better-sqlite3')
const path = require('path')

const dbPath = process.env.DATABASE_URL?.replace('file:', '') || path.join(process.cwd(), 'data', 'wingo-xsc.db')
const db = new Database(dbPath)

const now = new Date().toISOString()

// 1. 创建演示机构
const apiKey = 'wgo_demo_' + Date.now().toString(36)
const apiSecret = Date.now().toString(36) + Math.random().toString(36).slice(2)
const instId = 'WGI-DEMO'

db.prepare(`
  INSERT OR REPLACE INTO institutions (id, name, type, contact, phone, email, api_key, api_secret, plan, created_at, updated_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`).run(instId, '演示机构', 'training', '演示老师', '13800000001', 'demo@wingo.edu', apiKey, apiSecret, 'trial', now, now)

console.log('[✓] 演示机构:', instId, 'API Key:', apiKey)

// 2. 创建3个班级
const classes = [
  { id: 'WGC-DEMO-1', name: '六年级一班', grade: 6, subject: 'math' },
  { id: 'WGC-DEMO-2', name: '五年级二班', grade: 5, subject: 'chinese' },
  { id: 'WGC-DEMO-3', name: '四年级三班', grade: 4, subject: 'english' },
]

for (const c of classes) {
  db.prepare(`
    INSERT OR REPLACE INTO classes (id, institution_id, name, grade, subject, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(c.id, instId, c.name, c.grade, c.subject, now, now)
}
console.log('[✓] 3个班级已创建')

// 3. 创建10个学员
const names = ['小明', '小红', '小刚', '小丽', '小华', '小芳', '小杰', '小敏', '小涛', '小静']
for (let i = 0; i < names.length; i++) {
  const classId = classes[i % 3].id
  db.prepare(`
    INSERT OR REPLACE INTO students (id, institution_id, class_id, name, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(`WGS-DEMO-${i + 1}`, instId, classId, names[i], now, now)
}
console.log('[✓] 10个学员已创建')

// 4. 创建2条批量分析记录（带模拟结果）
const mockResults = [
  {
    students: [
      { studentName: '小明', score: 85, totalQuestions: 10, correct: 8, wrong: 2, weakPoints: ['分数运算', '应用题'], moduleScores: [{ module: '计算模块', scoreRate: 80 }, { module: '应用题模块', scoreRate: 90 }] },
      { studentName: '小红', score: 92, totalQuestions: 10, correct: 9, wrong: 1, weakPoints: ['几何图形'], moduleScores: [{ module: '计算模块', scoreRate: 95 }, { module: '几何模块', scoreRate: 85 }] },
      { studentName: '小刚', score: 78, totalQuestions: 10, correct: 7, wrong: 3, weakPoints: ['分数运算', '几何图形', '应用题'], moduleScores: [{ module: '计算模块', scoreRate: 70 }, { module: '几何模块', scoreRate: 75 }, { module: '应用题模块', scoreRate: 80 }] },
    ],
    summary: {
      totalStudents: 3, avgScore: 85,
      classWeakPoints: [{ name: '分数运算', count: 2, affectedStudents: 2 }, { name: '几何图形', count: 2, affectedStudents: 2 }],
      moduleAvg: [{ module: '计算模块', avgRate: 82 }, { module: '几何模块', avgRate: 80 }, { module: '应用题模块', avgRate: 85 }],
      studentRank: [{ name: '小红', score: 92, rank: 1 }, { name: '小明', score: 85, rank: 2 }, { name: '小刚', score: 78, rank: 3 }]
    }
  },
  {
    students: [
      { studentName: '小丽', score: 88, totalQuestions: 10, correct: 8, wrong: 2, weakPoints: ['阅读理解'], moduleScores: [{ module: '阅读模块', scoreRate: 85 }] },
      { studentName: '小华', score: 95, totalQuestions: 10, correct: 9, wrong: 1, weakPoints: [], moduleScores: [{ module: '阅读模块', scoreRate: 95 }] },
    ],
    summary: {
      totalStudents: 2, avgScore: 92,
      classWeakPoints: [{ name: '阅读理解', count: 1, affectedStudents: 1 }],
      moduleAvg: [{ module: '阅读模块', avgRate: 90 }],
      studentRank: [{ name: '小华', score: 95, rank: 1 }, { name: '小丽', score: 88, rank: 2 }]
    }
  }
]

for (let i = 0; i < mockResults.length; i++) {
  const r = mockResults[i]
  db.prepare(`
    INSERT OR REPLACE INTO batch_analyses (id, institution_id, class_id, status, total, completed, results, created_at, completed_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    `WGB-DEMO-${i + 1}`, instId, classes[i].id, 'completed', r.students.length, r.students.length,
    JSON.stringify(r), now, now
  )
}
console.log('[✓] 2条批量分析记录已创建')

console.log('')
console.log('═══════════════════════════════════════')
console.log('  演示数据填充完成!')
console.log('  API Key : ' + apiKey)
console.log('  API Secret : ' + apiSecret)
console.log('═══════════════════════════════════════')
