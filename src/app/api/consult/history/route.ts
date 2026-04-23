import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { dbClient } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '') || req.cookies.get('auth-token')?.value
    if (!token) return NextResponse.json({ error: '未登录' }, { status: 401 })
    const payload = await verifyToken(token)
    if (!payload?.userId) return NextResponse.json({ error: '登录已过期' }, { status: 401 })

    const records = dbClient.consultations.findByUserId(payload.userId as string, 50)
    return NextResponse.json({ success: true, data: records })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || '查询失败' }, { status: 500 })
  }
}
