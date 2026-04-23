import { NextRequest, NextResponse } from 'next/server'
import { dbClient } from '@/lib/db'

/**
 * 香港版：支付回调（简化，仅用于 Mock 测试和手动确认）
 * POST /api/orders/callback
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    if (body.orderId) {
      dbClient.orders.markPaid(body.orderId, 'manual_' + Date.now())
    }
    return NextResponse.json({ code: 'SUCCESS', message: 'OK' })
  } catch (error: any) {
    return NextResponse.json({ code: 'FAIL', message: error.message }, { status: 500 })
  }
}
