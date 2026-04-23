/**
 * WinGo 营销自动化事件中心
 * 将关键业务事件推送到 n8n (Mac n8n 100.106.90.55:5678)，由 n8n 编排自动化营销序列
 * 设计原则：fire-and-forget，失败不影响主业务流程
 */

const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL || 'http://172.17.0.1:5678/webhook/wingo-events'
const FEISHU_WEBHOOK_URL = process.env.FEISHU_WEBHOOK_URL || ''
const N8N_TIMEOUT_MS = 5000
let n8nConsecutiveFailures = 0
const MAX_N8N_FAILURES = 3

export type MarketingEvent =
  | 'user_registered'      // 新用户注册/关注
  | 'report_generated'     // 学情报告生成完成
  | 'free_quota_used'      // 使用了一次免费额度
  | 'free_quota_exhausted' // 免费额度用完
  | 'payment_initiated'    // 发起支付
  | 'payment_success'      // 支付成功
  | 'payment_failed'       // 支付失败
  | 'member_expiring'      // 会员即将到期（由n8n定时检测，后端不触发）
  | 'application_submitted' // 试用申请提交
  | 'consultation_completed' // 深度咨询完成

interface MarketingPayload {
  event: MarketingEvent
  userId?: string
  openid?: string
  nickname?: string
  timestamp: string
  // 事件特定字段
  reportId?: string
  subject?: string
  score?: number
  remainingFree?: number
  memberType?: 'none' | 'month' | 'year'
  orderType?: 'month' | 'year'
  amount?: number
  utmSource?: string
  [key: string]: any
}

/**
 * 推送营销事件到 n8n（fire-and-forget，不阻塞、不抛错）
 */
export function emitMarketingEvent(event: MarketingEvent, data: Omit<MarketingPayload, 'event' | 'timestamp'>) {
  const payload: MarketingPayload = {
    event,
    timestamp: new Date().toISOString(),
    ...data,
  }

  // 异步发送，不 await，不阻塞主流程
  sendToN8N(payload).catch(() => {
    // 静默失败，营销事件不是关键路径
  })
}

async function alertFeishu(message: string) {
  if (!FEISHU_WEBHOOK_URL) return
  try {
    await fetch(FEISHU_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ msg_type: 'text', content: { text: message } }),
    })
  } catch { /* 静默失败 */ }
}

async function sendToN8N(payload: MarketingPayload) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), N8N_TIMEOUT_MS)

  try {
    const res = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    })

    clearTimeout(timeout)

    if (!res.ok) {
      n8nConsecutiveFailures++
      if (n8nConsecutiveFailures >= MAX_N8N_FAILURES) {
        await alertFeishu(`🚨 n8n 挂了！连续 ${MAX_N8N_FAILURES} 次推送失败，请检查 200 服务器上的 n8n 容器。时间：${new Date().toLocaleString('zh-CN')}`)
        n8nConsecutiveFailures = 0
      }
    } else {
      n8nConsecutiveFailures = 0
    }
  } catch (err: any) {
    clearTimeout(timeout)
    n8nConsecutiveFailures++
    if (err.name === 'AbortError') {
    } else {
    }
    if (n8nConsecutiveFailures >= MAX_N8N_FAILURES) {
      await alertFeishu(`🚨 n8n 挂了！连续 ${MAX_N8N_FAILURES} 次推送失败，请检查 200 服务器上的 n8n 容器。时间：${new Date().toLocaleString('zh-CN')}`)
      n8nConsecutiveFailures = 0
    }
  }
}

// ====== 便捷封装 ======

/** 新用户注册 */
export function emitUserRegistered(userId: string, openid: string, nickname?: string, utmSource?: string) {
  emitMarketingEvent('user_registered', { userId, openid, nickname, utmSource })
}

/** 报告生成完成 */
export function emitReportGenerated(
  userId: string,
  openid: string,
  reportId: string,
  subject: string,
  score: number,
  correct: number,
  totalQuestions: number,
  remainingFree: number,
  memberType?: 'none' | 'month' | 'year'
) {
  const accuracy = totalQuestions > 0 ? Math.round((correct / totalQuestions) * 100) : 0
  emitMarketingEvent('report_generated', {
    userId, openid, reportId, subject, score, correct, totalQuestions, accuracy, remainingFree, memberType,
  })
}

/** 免费额度用完 */
export function emitFreeQuotaExhausted(userId: string, openid: string) {
  emitMarketingEvent('free_quota_exhausted', { userId, openid })
}

/** 支付成功 */
export function emitPaymentSuccess(
  userId: string,
  openid: string,
  orderType: 'month' | 'year',
  amount: number
) {
  emitMarketingEvent('payment_success', { userId, openid, orderType, amount })
}

/** 试用申请提交 */
export function emitApplicationSubmitted(
  applicationId: string,
  company: string,
  contactName: string,
  phone: string,
  email?: string,
  problem?: string
) {
  emitMarketingEvent('application_submitted', {
    applicationId, company, contactName, phone, email, problem,
  })
}
export function emitPaymentFailed(userId: string, openid: string, amount: number) {
  emitMarketingEvent('payment_failed', { userId, openid, amount })
}

/** 深度咨询完成 */
export function emitConsultationCompleted(
  userId: string,
  openid: string,
  consultationId: string,
  level: 'L1' | 'L2' | 'L3',
  leadScore: number,
  question: string
) {
  emitMarketingEvent('consultation_completed', {
    userId, openid, consultationId, level, leadScore, question,
  })
}
