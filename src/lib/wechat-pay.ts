/**
 * 微信支付 API v3 工具函数
 * 使用占位符模式，待配置真实商户参数后切换
 */

import crypto from 'crypto'

const MOCK_MODE = process.env.WECHAT_PAY_MOCK === 'true'
// 注意：MOCK 模式仅在开发环境显式开启时使用，生产环境必须配置真实商户参数

const CONFIG = {
  appid: process.env.WECHAT_APPID || '',
  mchid: process.env.WECHAT_MCHID || '',
  apiV3Key: process.env.WECHAT_APIV3_KEY || '',
  certSerialNo: process.env.WECHAT_CERT_SERIAL_NO || '',
  privateKey: process.env.WECHAT_PRIVATE_KEY || '',
  notifyUrl: process.env.WECHAT_PAY_NOTIFY_URL || '',
}

/**
 * 生成随机字符串
 */
export function generateNonceStr(length: number = 32): string {
  return crypto.randomBytes(length).toString('base64').slice(0, length)
}

/**
 * 生成时间戳（秒）
 */
export function generateTimestamp(): string {
  return Math.floor(Date.now() / 1000).toString()
}

/**
 * RSA-SHA256 签名
 */
function sign(message: string): string {
  if (!CONFIG.privateKey) throw new Error('微信支付私钥未配置')
  const sign = crypto.createSign('RSA-SHA256')
  sign.update(message)
  return sign.sign(CONFIG.privateKey, 'base64')
}

/**
 * 构建 Authorization 头
 */
function buildAuthorization(method: string, url: string, body: string): string {
  const timestamp = generateTimestamp()
  const nonceStr = generateNonceStr()
  const message = `${method}\n${url}\n${timestamp}\n${nonceStr}\n${body}\n`
  const signature = sign(message)
  return `mchid="${CONFIG.mchid}",nonce_str="${nonceStr}",timestamp="${timestamp}",serial_no="${CONFIG.certSerialNo}",signature="${signature}"`
}

/**
 * AES-GCM 解密（用于回调通知）
 */
export function decryptCallback(ciphertext: string, associatedData: string, nonce: string): any {
  const key = Buffer.from(CONFIG.apiV3Key)
  const authTag = Buffer.from(ciphertext.slice(-32), 'hex')
  const encryptedData = Buffer.from(ciphertext.slice(0, -32), 'hex')
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(nonce))
  decipher.setAAD(Buffer.from(associatedData))
  decipher.setAuthTag(authTag)
  let decrypted = decipher.update(encryptedData, undefined, 'utf8')
  decrypted += decipher.final('utf8')
  return JSON.parse(decrypted)
}

/**
 * 统一下单（JSAPI）
 */
export async function createJsapiOrder(params: {
  description: string
  outTradeNo: string
  amount: number
  openid: string
  notifyUrl?: string
}): Promise<{ prepayId: string }> {
  if (MOCK_MODE) {
    console.log('[MOCK] 创建微信支付订单:', params)
    // Mock 模式下返回模拟 prepay_id
    return { prepayId: `mock_${params.outTradeNo}` }
  }

  const url = '/v3/pay/transactions/jsapi'
  const fullUrl = `https://api.mch.weixin.qq.com${url}`
  const body = JSON.stringify({
    appid: CONFIG.appid,
    mchid: CONFIG.mchid,
    description: params.description,
    out_trade_no: params.outTradeNo,
    notify_url: params.notifyUrl || CONFIG.notifyUrl,
    amount: {
      total: params.amount,
      currency: 'CNY',
    },
    payer: {
      openid: params.openid,
    },
  })

  const authorization = buildAuthorization('POST', url, body)

  const res = await fetch(fullUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `WECHATPAY2-SHA256-RSA2048 ${authorization}`,
      'Accept': 'application/json',
    },
    body,
  })

  const data = await res.json()

  if (!res.ok) {
    console.error('微信统一下单失败:', data)
    throw new Error(data.message || '创建支付订单失败')
  }

  return { prepayId: data.prepay_id }
}

/**
 * 生成前端调起支付参数
 */
export function buildPayParams(prepayId: string): {
  appId: string
  timeStamp: string
  nonceStr: string
  package: string
  signType: string
  paySign: string
} {
  const timeStamp = generateTimestamp()
  const nonceStr = generateNonceStr()
  const packageStr = `prepay_id=${prepayId}`
  const message = `${CONFIG.appid}\n${timeStamp}\n${nonceStr}\n${packageStr}\n`
  const paySign = sign(message)

  return {
    appId: CONFIG.appid,
    timeStamp,
    nonceStr,
    package: packageStr,
    signType: 'RSA',
    paySign,
  }
}

/**
 * 查询订单状态
 */
export async function queryOrder(outTradeNo: string): Promise<{ status: string; transactionId?: string }> {
  if (MOCK_MODE) {
    return { status: 'SUCCESS', transactionId: `mock_tx_${outTradeNo}` }
  }

  const url = `/v3/pay/transactions/out-trade-no/${outTradeNo}?mchid=${CONFIG.mchid}`
  const fullUrl = `https://api.mch.weixin.qq.com${url}`
  const authorization = buildAuthorization('GET', url, '')

  const res = await fetch(fullUrl, {
    method: 'GET',
    headers: {
      'Authorization': `WECHATPAY2-SHA256-RSA2048 ${authorization}`,
      'Accept': 'application/json',
    },
  })

  const data = await res.json()

  if (!res.ok) {
    console.error('查询订单失败:', data)
    throw new Error(data.message || '查询订单失败')
  }

  return { status: data.trade_state, transactionId: data.transaction_id }
}

export { MOCK_MODE, CONFIG }
