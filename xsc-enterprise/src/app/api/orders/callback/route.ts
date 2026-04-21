import { NextRequest, NextResponse } from 'next/server'
import { dbClient } from '@/lib/db'
import { decryptCallback, MOCK_MODE } from '@/lib/wechat-pay'
import { emitPaymentSuccess } from '@/lib/marketing'

/**
 * 微信支付回调通知
 * POST /api/orders/callback
 * 微信支付平台主动推送支付结果
 */
export async function POST(req: NextRequest) {
  try {
    // Mock 模式下直接返回成功
    if (MOCK_MODE) {
      const body = await req.json().catch(() => ({}))
      console.log('[MOCK] 收到支付回调:', body)
      // Mock 模式下也尝试处理
      if (body.orderId) {
        await handlePaymentSuccess(body.orderId, `mock_tx_${body.orderId}`)
      }
      return NextResponse.json({ code: 'SUCCESS', message: 'OK' })
    }

    // 读取回调体
    const body = await req.json()
    const { resource } = body

    if (!resource) {
      return NextResponse.json({ code: 'FAIL', message: '缺少资源数据' }, { status: 400 })
    }

    // 解密回调数据
    const decrypted = decryptCallback(
      resource.ciphertext,
      resource.associated_data,
      resource.nonce
    )

    const { out_trade_no, transaction_id, trade_state } = decrypted

    if (trade_state === 'SUCCESS') {
      await handlePaymentSuccess(out_trade_no, transaction_id)
    }

    // 必须返回 SUCCESS，否则微信会重复通知
    return NextResponse.json({ code: 'SUCCESS', message: 'OK' })
  } catch (error: any) {
    console.error('支付回调处理错误:', error)
    return NextResponse.json({ code: 'FAIL', message: error.message }, { status: 500 })
  }
}

/**
 * 处理支付成功逻辑
 */
async function handlePaymentSuccess(orderId: string, transactionId: string) {
  const order = dbClient.orders.findById(orderId)
  if (!order || order.status === 'paid') {
    return
  }

  // 更新订单状态
  dbClient.orders.markPaid(orderId, transactionId)

  // 开通会员或增加额度
  const { userId, type } = order

  if (type === 'single') {
    // 单次解锁：增加1次免费额度
    dbClient.userLimits.addFreeQuota(userId, 1)
  } else if (type === 'month') {
    const expire = new Date()
    expire.setMonth(expire.getMonth() + 1)
    dbClient.userLimits.setMember(userId, 'month', expire.toISOString())
  } else if (type === 'year') {
    const expire = new Date()
    expire.setFullYear(expire.getFullYear() + 1)
    dbClient.userLimits.setMember(userId, 'year', expire.toISOString())
  }

  // 触发营销事件：支付成功
  const user = dbClient.users.findById(userId)
  if (user) {
    emitPaymentSuccess(userId, user.openid, type as 'month' | 'year', order.amount)
  }

  console.log(`订单 ${orderId} 支付成功，用户 ${userId} 已开通 ${type}`)
}
