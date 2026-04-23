import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { dbClient } from '@/lib/db'

export const dynamic = 'force-dynamic'

/**
 * POST /api/referral/claim — 使用邀请码
 * Body: { code: string }
 * 被邀请人获得 +2 次免费额度，邀请人也获得 +2 次
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

    const inviteeId = payload.userId as string
    let body: { code?: string }
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ success: false, error: '请求体格式错误' }, { status: 400 })
    }

    const code = body?.code?.toUpperCase()?.trim()
    if (!code) {
      return NextResponse.json({ success: false, error: '缺少邀请码' }, { status: 400 })
    }

    // 检查用户是否存在
    const invitee = dbClient.users.findById(inviteeId)
    if (!invitee) {
      return NextResponse.json({ success: false, error: '用户不存在' }, { status: 404 })
    }

    // 查询邀请码
    const referral = dbClient.referrals.findByCode(code)
    if (!referral) {
      return NextResponse.json({ success: false, error: '邀请码不存在' }, { status: 404 })
    }

    // 不能用自己的邀请码
    if (referral.inviterId === inviteeId) {
      return NextResponse.json({ success: false, error: '不能使用自己的邀请码' }, { status: 400 })
    }

    // 检查是否已被使用
    if (referral.inviteeId) {
      return NextResponse.json({ success: false, error: '邀请码已被使用' }, { status: 400 })
    }

    // 检查被邀请人是否已经使用过其他邀请码（一个用户只能被邀请一次）
    const alreadyClaimed = dbClient.referrals.findByInvitee(inviteeId)
    if (alreadyClaimed) {
      return NextResponse.json({ success: false, error: '您已经使用过邀请码，每个用户仅限一次' }, { status: 400 })
    }

    // 标记邀请码为已使用
    const claimed = dbClient.referrals.claim(code, inviteeId)
    if (!claimed) {
      return NextResponse.json({ success: false, error: '邀请码使用失败，可能已被使用' }, { status: 400 })
    }

    // 给双方各加 2 次免费额度
    const inviteeAdded = dbClient.userLimits.addFreeQuota(inviteeId, 2)
    const inviterAdded = dbClient.userLimits.addFreeQuota(referral.inviterId, 2)

    return NextResponse.json({
      success: true,
      data: {
        code,
        inviteeId,
        inviterId: referral.inviterId,
        inviteeBonus: inviteeAdded ? 2 : 0,
        inviterBonus: inviterAdded ? 2 : 0,
        claimedAt: new Date().toISOString(),
      },
    })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || '使用邀请码失败' }, { status: 500 })
  }
}
