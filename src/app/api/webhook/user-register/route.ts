import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL_USER_REGISTER || process.env.N8N_WEBHOOK_URL || 'http://localhost:5678/webhook/user-register'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { userId, openid, nickname, createdAt } = body

    if (!userId || !openid) {
      return NextResponse.json({ success: false, error: '缺少用户ID或openid' }, { status: 400 })
    }

    // 转发到 n8n
    const n8nRes = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event: 'user.register',
        timestamp: new Date().toISOString(),
        user: { userId, openid, nickname, createdAt },
      }),
    })

    if (!n8nRes.ok) {
      console.error('[n8n webhook] user-register failed:', n8nRes.status, await n8nRes.text())
    }

    return NextResponse.json({ success: true, message: '已触发欢迎工作流' })
  } catch (error: any) {
    console.error('[webhook user-register] error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
