import { NextRequest, NextResponse } from 'next/server'
import Database from 'better-sqlite3'
import path from 'path'

export const dynamic = 'force-dynamic'

const MASTER_KEY = 'xsc-admin-2026'

interface RenewalRow {
  userId: string
  openid: string
  nickname: string | null
  memberType: string
  memberExpire: string
  daysLeft: number
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
        ul.member_type as memberType,
        ul.member_expire as memberExpire,
        CAST(julianday(ul.member_expire) - julianday('now') AS INTEGER) as daysLeft
      FROM users u
      JOIN user_limits ul ON u.id = ul.user_id
      WHERE ul.member_type != 'none'
        AND ul.member_expire IS NOT NULL
        AND ul.member_expire <= datetime('now', '+7 days')
        AND ul.member_expire > datetime('now')
      ORDER BY ul.member_expire ASC
    `).all() as RenewalRow[]

    db.close()

    return NextResponse.json({
      success: true,
      data: {
        count: rows.length,
        users: rows.map((r) => ({
          userId: r.userId,
          openid: r.openid,
          nickname: r.nickname,
          memberType: r.memberType,
          memberExpire: r.memberExpire,
          daysLeft: r.daysLeft,
        })),
      },
    })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || '查询失败' }, { status: 500 })
  }
}
