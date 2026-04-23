import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { dbClient } from '@/lib/db'

/**
 * 创建订单（香港版：仅创建待支付订单，不走微信支付JSAPI）
 * POST /api/orders
 * Body: { type: 'single' | 'month' | 'year' }
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
    const { type } = body

    if (!type || !['single', 'month', 'year'].includes(type)) {
      return NextResponse.json({ error: '无效的套餐类型' }, { status: 400 })
    }

    // 定价（单位：分）
    const PRICE_MAP: Record<string, number> = {
      single: 990,   // 9.9元 / 次
      month: 3900,   // 39元 / 月
      year: 29900,   // 299元 / 年
    }
    const amount = PRICE_MAP[type]
    const description = type === 'single' ? '单次学情报告解锁' : type === 'month' ? '月度会员' : '年度会员'

    // 创建订单记录（状态：pending，等待用户扫码支付后确认）
    const order = dbClient.orders.create(userId, type as 'single' | 'month' | 'year', amount)

    return NextResponse.json({
      success: true,
      orderId: order.id,
      amount,
      type,
      description,
      status: 'pending',
      message: '订单已创建，请扫码支付后点击"我已支付"',
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || '创建订单失败' }, { status: 500 })
  }
}

/**
 * 获取用户订单列表
 * GET /api/orders
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

    const orders = dbClient.orders.findByUserId(payload.userId as string)
    return NextResponse.json({ success: true, orders })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || '查询失败' }, { status: 500 })
  }
}
