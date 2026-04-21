import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { dbClient } from '@/lib/db'

export async function GET(req: NextRequest) {
  const token = req.cookies.get('auth-token')?.value
  if (!token) return NextResponse.json({ error: '未登录' }, { status: 401 })

  const payload = await verifyToken(token)
  if (!payload?.userId) return NextResponse.json({ error: '登录已过期' }, { status: 401 })

  const canGenerate = dbClient.userLimits.canGenerate(payload.userId as string)
  return NextResponse.json(canGenerate)
}
