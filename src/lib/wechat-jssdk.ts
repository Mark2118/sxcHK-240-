/**
 * 微信 JS-SDK 签名工具
 */

import crypto from 'crypto'

const APPID = process.env.WECHAT_APPID || ''
const APP_SECRET = process.env.WECHAT_SECRET || ''

// 简单的内存缓存
let accessTokenCache: { token: string; expiresAt: number } | null = null
let jsapiTicketCache: { ticket: string; expiresAt: number } | null = null

/**
 * 获取 Access Token（带缓存）
 */
export async function getAccessToken(): Promise<string> {
  const now = Date.now()
  if (accessTokenCache && accessTokenCache.expiresAt > now + 60000) {
    return accessTokenCache.token
  }

  const url = `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${APPID}&secret=${APP_SECRET}`
  const res = await fetch(url)
  const data = await res.json()

  if (!res.ok || data.errcode) {
    throw new Error(data.errmsg || '获取 access_token 失败')
  }

  accessTokenCache = {
    token: data.access_token,
    expiresAt: now + data.expires_in * 1000,
  }

  return data.access_token
}

/**
 * 获取 JSAPI Ticket（带缓存）
 */
export async function getJsapiTicket(): Promise<string> {
  const now = Date.now()
  if (jsapiTicketCache && jsapiTicketCache.expiresAt > now + 60000) {
    return jsapiTicketCache.ticket
  }

  const accessToken = await getAccessToken()
  const url = `https://api.weixin.qq.com/cgi-bin/ticket/getticket?access_token=${accessToken}&type=jsapi`
  const res = await fetch(url)
  const data = await res.json()

  if (!res.ok || data.errcode) {
    throw new Error(data.errmsg || '获取 jsapi_ticket 失败')
  }

  jsapiTicketCache = {
    ticket: data.ticket,
    expiresAt: now + data.expires_in * 1000,
  }

  return data.ticket
}

/**
 * 生成 JS-SDK 配置
 */
export async function buildJssdkConfig(url: string) {
  const ticket = await getJsapiTicket()
  const nonceStr = Math.random().toString(36).substring(2, 15)
  const timestamp = Math.floor(Date.now() / 1000).toString()

  // 注意：url 必须去掉 hash 部分
  const cleanUrl = url.split('#')[0]

  const str = `jsapi_ticket=${ticket}&noncestr=${nonceStr}&timestamp=${timestamp}&url=${cleanUrl}`
  const signature = crypto.createHash('sha1').update(str).digest('hex')

  return {
    appId: APPID,
    timestamp,
    nonceStr,
    signature,
  }
}
