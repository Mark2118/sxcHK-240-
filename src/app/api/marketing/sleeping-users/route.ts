import { NextRequest, NextResponse } from 'next/server'
import Database from 'better-sqlite3'
import path from 'path'

const dbPath = process.env.DATABASE_URL?.replace('file:', '') || path.join(process.cwd(), 'data', 'wingo-xsc.db')
const db = new Database(dbPath)

export async function GET(req: NextRequest) {
  try {
    const stmt = db.prepare(`
      SELECT 
        u.id as userId,
        u.openid,
        u.nickname,
        MAX(r.created_at) as lastReportAt,
        COUNT(r.id) as totalReports
      FROM users u
      LEFT JOIN reports r ON u.id = r.user_id
      GROUP BY u.id
      HAVING lastReportAt IS NULL OR lastReportAt < datetime('now', '-3 days')
      ORDER BY lastReportAt ASC
    `)
    const users = stmt.all() as any[]

    return NextResponse.json({
      success: true,
      count: users.length,
      users: users.map((u) => ({
        userId: u.userId,
        openid: u.openid,
        nickname: u.nickname,
        lastReportAt: u.lastReportAt,
        totalReports: u.totalReports,
      })),
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || '查询失败' }, { status: 500 })
  }
}
