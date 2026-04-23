const N8N_BASE_URL = process.env.N8N_WEBHOOK_URL || 'http://localhost:5678/webhook'
const FEISHU_WEBHOOK_URL = process.env.FEISHU_WEBHOOK_URL || ''
const N8N_TIMEOUT_MS = 5000

export type MarketingEvent =
  | 'user_registered'
  | 'report_generated'
  | 'free_quota_exhausted'
  | 'payment_success'
  | 'payment_failed'
  | 'application_submitted'
  | 'consultation_completed'

const EVENT_PATHS: Record<MarketingEvent, string> = {
  user_registered:         'hk-welcome',
  report_generated:        'hk-report',
  free_quota_exhausted:    'hk-convert',
  payment_success:         'hk-order',
  payment_failed:          'hk-order-fail',
  application_submitted:   'hk-b2b-lead',
  consultation_completed:  'hk-consult',
}

interface MarketingPayload {
  event: MarketingEvent
  userId?: string
  openid?: string
  nickname?: string
  timestamp: string
  [key: string]: any
}

export function emitMarketingEvent(event: MarketingEvent, data: Omit<MarketingPayload, 'event' | 'timestamp'>) {
  const payload: MarketingPayload = { event, timestamp: new Date().toISOString(), ...data }
  const path = EVENT_PATHS[event] || 'wingo-events'
  fetch(`${N8N_BASE_URL}/${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }).catch(() => {})
}

export const emitUserRegistered = (userId: string, openid: string, nickname?: string) =>
  emitMarketingEvent('user_registered', { userId, openid, nickname })

export const emitReportGenerated = (userId: string, openid: string, reportId: string, subject: string, score: number, correct: number, totalQuestions: number, remainingFree: number, memberType?: string) =>
  emitMarketingEvent('report_generated', { userId, openid, reportId, subject, score, correct, totalQuestions, accuracy: totalQuestions > 0 ? Math.round((correct / totalQuestions) * 100) : 0, remainingFree, memberType })

export const emitFreeQuotaExhausted = (userId: string, openid: string) =>
  emitMarketingEvent('free_quota_exhausted', { userId, openid })

export const emitPaymentSuccess = (userId: string, openid: string, orderType: string, amount: number) =>
  emitMarketingEvent('payment_success', { userId, openid, orderType, amount })

export const emitPaymentFailed = (userId: string, openid: string, amount: number) =>
  emitMarketingEvent('payment_failed', { userId, openid, amount })

export const emitApplicationSubmitted = (applicationId: string, company: string, contactName: string, phone: string, email?: string, problem?: string) =>
  emitMarketingEvent('application_submitted', { applicationId, company, contactName, phone, email, problem })

export const emitConsultationCompleted = (userId: string, openid: string, consultationId: string, level: string, leadScore: number, question: string) =>
  emitMarketingEvent('consultation_completed', { userId, openid, consultationId, level, leadScore, question })
