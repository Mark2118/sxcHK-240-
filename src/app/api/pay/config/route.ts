import { NextResponse } from 'next/server'

/**
 * 获取微信支付前端配置
 * GET /api/pay/config
 * 返回微信支付所需的 AppID 等公共配置
 */
export async function GET() {
  const appid = process.env.WECHAT_APPID || ''

  return NextResponse.json({
    success: true,
    appid,
    // 注意：不要返回密钥等敏感信息
  })
}
