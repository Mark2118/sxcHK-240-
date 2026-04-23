import { describe, it, expect } from 'vitest'
import { checkRateLimit, rateLimitPresets, rateLimitHeaders } from '@/lib/rate-limit'

describe('Rate Limit', () => {
  it('should allow first request', () => {
    const result = checkRateLimit('test-key-1', { windowMs: 60000, maxRequests: 5 })
    expect(result.allowed).toBe(true)
    expect(result.remaining).toBe(4)
    expect(result.limit).toBe(5)
  })

  it('should block after max requests', () => {
    const key = 'test-key-2'
    const config = { windowMs: 60000, maxRequests: 2 }
    checkRateLimit(key, config)
    checkRateLimit(key, config)
    const result = checkRateLimit(key, config)
    expect(result.allowed).toBe(false)
    expect(result.remaining).toBe(0)
    expect(result.retryAfter).toBeDefined()
  })

  it('should reset after window expires', async () => {
    const key = 'test-key-3'
    const config = { windowMs: 50, maxRequests: 1 }
    checkRateLimit(key, config)
    await new Promise((r) => setTimeout(r, 60))
    const result = checkRateLimit(key, config)
    expect(result.allowed).toBe(true)
  })

  it('should generate correct headers', () => {
    const result = {
      allowed: true,
      limit: 60,
      remaining: 59,
      resetAt: Date.now() + 60000,
    }
    const headers = rateLimitHeaders(result)
    expect(headers['X-RateLimit-Limit']).toBe('60')
    expect(headers['X-RateLimit-Remaining']).toBe('59')
    expect(headers['X-RateLimit-Reset']).toBeDefined()
  })

  it('should have preset configurations', () => {
    expect(rateLimitPresets.public.maxRequests).toBe(60)
    expect(rateLimitPresets.auth.maxRequests).toBe(10)
    expect(rateLimitPresets.analyze.maxRequests).toBe(5)
  })
})
