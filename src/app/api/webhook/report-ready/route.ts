import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL_REPORT_READY || process.env.N8N_WEBHOOK_URL || 'http://localhost:5678/webhook/report-ready'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { userId, openid, reportId, score, weakPoints, subject, createdAt } = body

    if (!userId || !reportId) {
      return NextResponse.json({ success: false, error: '缺少用户ID或报告ID' }, { status: 400 })
    }

    // 转发到 n8n
    const n8nRes = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event: 'report.ready',
        timestamp: new Date().toISOString(),
        user: { userId, openid },
        report: { reportId, score, weakPoints: weakPoints || [], subject, createdAt },
      }),
    })

    if (!n8nRes.ok) {
      console.error('[n8n webhook] report-ready failed:', n8nRes.status, await n8nRes.text())
    }

    return NextResponse.json({ success: true, message: '已触发报告推送工作流' })
  } catch (error: any) {
    console.error('[webhook report-ready] error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
