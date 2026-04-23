import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { dbClient } from '@/lib/db'

export const dynamic = 'force-dynamic'

/**
 * POST /api/referral — 创建邀请码
 */
export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '') || req.cookies.get('auth-token')?.value
    if (!token) {
      return NextResponse.json({ success: false, error: '未登录' }, { status: 401 })
    }

    const payload = await verifyToken(token)
    if (!payload?.userId) {
      return NextResponse.json({ success: false, error: '登录已过期' }, { status: 401 })
    }

    const userId = payload.userId as string

    // 检查用户是否存在
    const user = dbClient.users.findById(userId)
    if (!user) {
      return NextResponse.json({ success: false, error: '用户不存在' }, { status: 404 })
    }

    // 检查是否已创建过邀请码（可选：允许多个）
    // 这里允许一个用户创建多个邀请码
    const referral = dbClient.referrals.create(userId)

    return NextResponse.json({
      success: true,
      data: {
        id: referral.id,
        code: referral.code,
        inviterId: referral.inviterId,
        createdAt: referral.createdAt,
      },
    })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || '创建邀请码失败' }, { status: 500 })
  }
}

/**
 * GET /api/referral?code=XXX — 查询邀请码信息
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const code = searchParams.get('code')

    if (!code) {
      return NextResponse.json({ success: false, error: '缺少邀请码参数' }, { status: 400 })
    }

    const referral = dbClient.referrals.findByCode(code.toUpperCase())
    if (!referral) {
      return NextResponse.json({ success: false, error: '邀请码不存在' }, { status: 404 })
    }

    const inviter = dbClient.users.findById(referral.inviterId)

    return NextResponse.json({
      success: true,
      data: {
        code: referral.code,
        inviterId: referral.inviterId,
        inviterNickname: inviter?.nickname || null,
        isClaimed: !!referral.inviteeId,
        claimedAt: referral.claimedAt || null,
        createdAt: referral.createdAt,
      },
    })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || '查询失败' }, { status: 500 })
  }
}
