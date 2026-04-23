import { NextRequest, NextResponse } from 'next/server'
import Database from 'better-sqlite3'
import path from 'path'

export const dynamic = 'force-dynamic'

const MASTER_KEY = 'xsc-admin-2026'

interface SleepingRow {
  userId: string
  openid: string
  nickname: string | null
  createdAt: string
  lastReportAt: string | null
  totalReports: number
}

export async function GET(req: NextRequest) {
  try {
    const apiKey = req.headers.get('x-master-key')
    if (apiKey !== MASTER_KEY) {
      return NextResponse.json({ success: false, error: '未授权访问' }, { status: 403 })
    }

    const dbPath = process.env.DATABASE_URL?.replace('file:', '') || path.join(process.cwd(), 'data', 'wingo-xsc.db')
    const db = new Database(dbPath)

    const rows = db.prepare(`
      SELECT
        u.id as userId,
        u.openid,
        u.nickname,
        u.created_at as createdAt,
        MAX(r.created_at) as lastReportAt,
        COUNT(r.id) as totalReports
      FROM users u
      LEFT JOIN reports r ON u.id = r.user_id
      GROUP BY u.id
      HAVING lastReportAt IS NULL OR lastReportAt < datetime('now', '-30 days')
      ORDER BY lastReportAt ASC
    `).all() as SleepingRow[]

    db.close()

    return NextResponse.json({
      success: true,
      data: {
        count: rows.length,
        users: rows.map((r) => ({
          userId: r.userId,
          openid: r.openid,
          nickname: r.nickname,
          createdAt: r.createdAt,
          lastReportAt: r.lastReportAt,
          totalReports: r.totalReports,
        })),
      },
    })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || '查询失败' }, { status: 500 })
  }
}
