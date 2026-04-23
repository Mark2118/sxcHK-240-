import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL_LIMIT_EXCEEDED || process.env.N8N_WEBHOOK_URL || 'http://localhost:5678/webhook/limit-exceeded'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { userId, openid, nickname, freeCount, memberType } = body

    if (!userId) {
      return NextResponse.json({ success: false, error: '缺少用户ID' }, { status: 400 })
    }

    // 转发到 n8n
    const n8nRes = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event: 'limit.exceeded',
        timestamp: new Date().toISOString(),
        user: { userId, openid, nickname, freeCount, memberType },
      }),
    })

    if (!n8nRes.ok) {
      console.error('[n8n webhook] limit-exceeded failed:', n8nRes.status, await n8nRes.text())
    }

    return NextResponse.json({ success: true, message: '已触发付费转化工作流' })
  } catch (error: any) {
    console.error('[webhook limit-exceeded] error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
