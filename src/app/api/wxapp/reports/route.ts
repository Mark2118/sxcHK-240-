import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { dbClient } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) return NextResponse.json({ error: '未登录' }, { status: 401 })
    const payload = await verifyToken(token)
    if (!payload?.userId) return NextResponse.json({ error: '登录已过期' }, { status: 401 })

    const records = await dbClient.check.findByUserId(payload.userId as string, 50)

    const simplified = records.map((r) => {
      let weakPoints: string[] = []
      try {
        const report = JSON.parse(r.reportJson)
        weakPoints = (report.weakPoints || []).slice(0, 3)
      } catch {}
      return {
        id: r.id,
        date: r.createdAt.slice(0, 10),
        score: r.score,
        weakPoints,
        subject: r.subject,
      }
    })

    return NextResponse.json({ success: true, data: simplified })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || '查询失败' }, { status: 500 })
  }
}
