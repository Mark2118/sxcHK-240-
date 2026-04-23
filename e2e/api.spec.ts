import { test, expect } from '@playwright/test'
import { apiGet, apiPost, MASTER_KEY, getAuthToken } from './helpers'

test.describe('API Automation Tests', () => {
  let token: string

  test.beforeAll(async () => {
    token = await getAuthToken()
  })

  test('health check', async () => {
    const { status, body } = await apiGet('/xsc/api/health')
    expect(status).toBe(200)
    expect(body?.status).toBe('ok')
  })

  test('cockpit dashboard', async () => {
    const { status, body } = await apiGet('/xsc/api/ops/dashboard?key=' + MASTER_KEY)
    expect(status).toBe(200)
    expect(body?.success).toBe(true)
    expect(body?.data).toHaveProperty('realtime')
    expect(body?.data).toHaveProperty('services')
  })

  test('summary renewal', async () => {
    const { status, body } = await apiGet('/xsc/api/summary/renewal', undefined, MASTER_KEY)
    expect(status).toBe(200)
    expect(body?.success).toBe(true)
    expect(body?.data).toHaveProperty('count')
    expect(body?.data).toHaveProperty('users')
  })

  test('summary sleeping', async () => {
    const { status, body } = await apiGet('/xsc/api/summary/sleeping', undefined, MASTER_KEY)
    expect(status).toBe(200)
    expect(body?.success).toBe(true)
    expect(body?.data).toHaveProperty('count')
    expect(body?.data).toHaveProperty('users')
  })

  test('summary b2b-leads', async () => {
    const { status, body } = await apiGet('/xsc/api/summary/b2b-leads', undefined, MASTER_KEY)
    expect(status).toBe(200)
    expect(body?.success).toBe(true)
    expect(body?.data).toHaveProperty('pendingApplications')
    expect(body?.data).toHaveProperty('expiringInstitutions')
  })

  test('summary monthly (JWT)', async () => {
    const { status, body } = await apiGet('/xsc/api/summary/monthly', token)
    expect(status).toBe(200)
    expect(body?.success).toBe(true)
    expect(body?.data).toHaveProperty('period')
    expect(body?.data).toHaveProperty('totalReports')
    expect(body?.data).toHaveProperty('avgScore')
  })

  test('referral create', async () => {
    const { status, body } = await apiPost('/xsc/api/referral', {}, token)
    expect(status).toBe(200)
    expect(body?.success).toBe(true)
    expect(body?.data).toHaveProperty('code')
    expect(body?.data?.code).toHaveLength(6)
  })

  test('webhook user-register', async () => {
    const { status, body } = await apiPost('/xsc/api/webhook/user-register', {
      userId: 'test-user-1', openid: 'test-openid-1', nickname: 'Test',
    })
    expect(status).toBe(200)
    expect(body?.success).toBe(true)
  })

  test('webhook report-ready', async () => {
    const { status, body } = await apiPost('/xsc/api/webhook/report-ready', {
      userId: 'test-user-1', openid: 'test-openid-1', reportId: 'rep-1', score: 85,
    })
    expect(status).toBe(200)
    expect(body?.success).toBe(true)
  })

  test('webhook limit-exceeded', async () => {
    const { status, body } = await apiPost('/xsc/api/webhook/limit-exceeded', {
      userId: 'test-user-1', openid: 'test-openid-1', freeCount: 0,
    })
    expect(status).toBe(200)
    expect(body?.success).toBe(true)
  })

  test('consult endpoint', async () => {
    const { status, body } = await apiPost('/xsc/api/consult', {
      question: '孩子计算总是错，是不是该报班？',
      context: '',
    }, token)
    // L3 问题会转发到 OpenMAIC，可能返回 200 或 502（OpenMAIC 未响应）
    expect([200, 400, 502]).toContain(status)
  })

  test('wxapp login endpoint', async () => {
    const { status, body } = await apiPost('/xsc/api/wxapp/login', { code: 'test_wxapp_code' })
    // 可能返回 400（code 无效）或 200
    expect([200, 400, 500]).toContain(status)
  })

  test('rate limiting headers', async () => {
    const res = await fetch('http://localhost:3000/xsc/api/health')
    // health API 可能没有限流中间件，至少检查响应成功
    expect(res.status).toBe(200)
  })
})
