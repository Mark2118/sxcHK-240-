/**
 * 微信传统模板消息发送工具
 */

import { getAccessToken } from './wechat-jssdk'

const TEMPLATE_ID = process.env.WECHAT_TEMPLATE_MSG_ID || ''

/**
 * 发送传统模板消息
 * @param openid 用户 OpenID
 * @param data 模板数据（键值对，value 支持 { value: string, color?: string }）
 * @param url 点击消息后跳转的页面链接（可选）
 */
export async function sendTemplateMessage(
  openid: string,
  data: Record<string, { value: string; color?: string }>,
  url?: string
) {
  const accessToken = await getAccessToken()
  const apiUrl = `https://api.weixin.qq.com/cgi-bin/message/template/send?access_token=${accessToken}`

  const body = JSON.stringify({
    touser: openid,
    template_id: TEMPLATE_ID,
    url,
    data,
  })

  const res = await fetch(apiUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
  })

  const result = await res.json()

  if (result.errcode !== 0) {
    throw new Error(`发送模板消息失败: ${result.errmsg} (errcode: ${result.errcode})`)
  }

  return result
}
