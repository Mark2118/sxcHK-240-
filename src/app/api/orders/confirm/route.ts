import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { dbClient } from '@/lib/db'

/**
 * 用户确认已支付（扫码转账后提交）
 * POST /api/orders/confirm
 * Body: { orderId: string }
 */
export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 })
    }

    const payload = await verifyToken(token)
    if (!payload?.userId) {
      return NextResponse.json({ error: '登录已过期' }, { status: 401 })
    }

    const userId = payload.userId as string
    const body = await req.json()
    const { orderId } = body

    if (!orderId) {
      return NextResponse.json({ error: '缺少订单号' }, { status: 400 })
    }

    // 查找订单
    const order = dbClient.orders.findById(orderId)
    if (!order) {
      return NextResponse.json({ error: '订单不存在' }, { status: 404 })
    }

    if (order.userId !== userId) {
      return NextResponse.json({ error: '无权操作此订单' }, { status: 403 })
    }

    if (order.status !== 'pending') {
      return NextResponse.json({ error: '订单状态异常', status: order.status }, { status: 400 })
    }

    // 更新订单为待审核状态（人工确认后开通）
    dbClient.orders.updateStatus(orderId, 'awaiting_confirmation')

    // TODO: n8n 自动化工作流 — 发送飞书/邮件通知运营人员审核

    return NextResponse.json({
      success: true,
      message: '已提交支付确认，我们将在10分钟内审核并开通会员',
      orderId,
      status: 'awaiting_confirmation',
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || '确认失败' }, { status: 500 })
  }
}
