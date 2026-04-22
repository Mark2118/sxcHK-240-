import { NextRequest, NextResponse } from 'next/server'
import { buildJssdkConfig } from '@/lib/wechat-jssdk'

export async function GET(req: NextRequest) {
  try {
    const url = req.nextUrl.searchParams.get('url')
    if (!url) {
      return NextResponse.json({ error: '缺少 url 参数' }, { status: 400 })
    }

    const config = await buildJssdkConfig(url)
    return NextResponse.json(config)
  } catch (error: any) {
    return NextResponse.json({ error: error.message || '获取配置失败' }, { status: 500 })
  }
}
