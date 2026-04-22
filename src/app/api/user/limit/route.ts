import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { dbClient } from '@/lib/db'

export async function GET(req: NextRequest) {
  // 优先从 Authorization header 读取（与项目其他 API 保持一致）
  const token = req.headers.get('authorization')?.replace('Bearer ', '') || req.cookies.get('auth-token')?.value
  if (!token) return NextResponse.json({ error: '未登录' }, { status: 401 })

  const payload = await verifyToken(token)
  if (!payload?.userId) return NextResponse.json({ error: '登录已过期' }, { status: 401 })

  const canGenerate = dbClient.userLimits.canGenerate(payload.userId as string)
  return NextResponse.json({ success: true, ...canGenerate })
}
