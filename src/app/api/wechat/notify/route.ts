import { NextRequest, NextResponse } from 'next/server'
import { sendTemplateMessage } from '@/lib/wechat-notify'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { openid, data, url } = body

    if (!openid || !data) {
      return NextResponse.json({ error: '缺少 openid 或 data 参数' }, { status: 400 })
    }

    const result = await sendTemplateMessage(openid, data, url)
    return NextResponse.json({ success: true, result })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || '发送失败' }, { status: 500 })
  }
}
