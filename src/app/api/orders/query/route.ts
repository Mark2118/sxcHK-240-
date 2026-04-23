import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { dbClient } from '@/lib/db'

/**
 * 查询订单状态
 * GET /api/orders/query?orderId=WGO-xxx
 */
export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 })
    }

    const payload = await verifyToken(token)
    if (!payload?.userId) {
      return NextResponse.json({ error: '登录已过期' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const orderId = searchParams.get('orderId')

    if (!orderId) {
      return NextResponse.json({ error: '缺少订单ID' }, { status: 400 })
    }

    const order = dbClient.orders.findById(orderId)
    if (!order) {
      return NextResponse.json({ error: '订单不存在' }, { status: 404 })
    }

    if (order.userId !== payload.userId) {
      return NextResponse.json({ error: '无权查看此订单' }, { status: 403 })
    }

    return NextResponse.json({
      success: true,
      order: {
        id: order.id,
        type: order.type,
        amount: order.amount,
        status: order.status,
        createdAt: order.createdAt,
        paidAt: order.paidAt,
      },
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || '查询失败' }, { status: 500 })
  }
}
