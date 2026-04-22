import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { dbClient } from '@/lib/db'
import { createJsapiOrder, buildPayParams, MOCK_MODE } from '@/lib/wechat-pay'

/**
 * 创建微信支付订单
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

    // 获取用户信息（需要 openid 用于支付）
    const user = await dbClient.users.findById(userId)
    if (!user) {
      return NextResponse.json({ error: '用户不存在' }, { status: 404 })
    }

    // 定价（单位：分）
    const PRICE_MAP: Record<string, number> = {
      single: 980,   // 9.8元 / 次
      month: 2980,   // 29.8元 / 月
      year: 19800,   // 198元 / 年
    }
    const amount = PRICE_MAP[type]
    const description = type === 'single' ? '单次学情报告解锁' : type === 'month' ? '月度会员' : '年度会员'

    // 创建订单记录
    const order = dbClient.orders.create(userId, type as 'single' | 'month' | 'year', amount)

    // 调用微信支付统一下单
    let payParams = null
    try {
      const { prepayId } = await createJsapiOrder({
        description,
        outTradeNo: order.id,
        amount,
        openid: user.openid,
      })
      payParams = buildPayParams(prepayId)
    } catch (payErr: any) {
      if (!MOCK_MODE) {
        return NextResponse.json({ error: '创建支付订单失败', detail: payErr.message }, { status: 500 })
      }
      // Mock 模式下返回模拟参数
      payParams = {
        appId: process.env.WECHAT_APPID || 'mock_appid',
        timeStamp: String(Math.floor(Date.now() / 1000)),
        nonceStr: 'mock_nonce',
        package: `prepay_id=mock_${order.id}`,
        signType: 'RSA',
        paySign: 'mock_sign',
      }
    }

    return NextResponse.json({
      success: true,
      orderId: order.id,
      amount,
      type,
      description,
      payParams,
      mock: MOCK_MODE,
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
