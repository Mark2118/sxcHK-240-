import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { dbClient } from '@/lib/db'

export async function GET(req: NextRequest) {
  const token = req.cookies.get('auth-token')?.value
  if (!token) return NextResponse.json({ error: '未登录' }, { status: 401 })

  const payload = await verifyToken(token)
  if (!payload?.userId) return NextResponse.json({ error: '登录已过期' }, { status: 401 })

  const user = dbClient.users.findById(payload.userId as string)
  if (!user) return NextResponse.json({ error: '用户不存在' }, { status: 404 })

  const limit = dbClient.userLimits.findByUserId(user.id)
  return NextResponse.json({
    user: { id: user.id, nickname: user.nickname, avatar: user.avatar, createdAt: user.createdAt },
    limit: limit ? { freeCount: limit.freeCount, memberType: limit.memberType, memberExpire: limit.memberExpire } : null,
  })
}
