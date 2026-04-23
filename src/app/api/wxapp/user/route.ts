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

    const user = dbClient.users.findById(payload.userId as string)
    if (!user) return NextResponse.json({ error: '用户不存在' }, { status: 404 })

    const limit = dbClient.userLimits.findByUserId(user.id)

    return NextResponse.json({
      success: true,
      data: {
        id: user.id,
        nickname: user.nickname || '微信用户',
        avatar: user.avatar || '',
        createdAt: user.createdAt,
        quota: {
          freeCount: limit?.freeCount ?? 0,
          memberType: limit?.memberType || 'none',
          memberExpire: limit?.memberExpire || null,
        },
      },
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || '查询失败' }, { status: 500 })
  }
}
