import { describe, it, expect, vi } from 'vitest'
import { createLogger } from '@/lib/logger'

describe('Logger', () => {
  it('should create logger with service name', () => {
    const logger = createLogger('test-service')
    expect(logger).toHaveProperty('debug')
    expect(logger).toHaveProperty('info')
    expect(logger).toHaveProperty('warn')
    expect(logger).toHaveProperty('error')
    expect(logger).toHaveProperty('fatal')
    expect(logger).toHaveProperty('traceId')
  })

  it('should generate traceId', () => {
    const logger = createLogger('test')
    const id = logger.traceId()
    expect(typeof id).toBe('string')
    expect(id.length).toBeGreaterThan(10)
  })

  it('should create contextual logger', () => {
    const logger = createLogger('test')
    const ctx = logger.withContext({ userId: 'u123', traceId: 't456' })
    expect(ctx).toHaveProperty('info')
    expect(ctx).toHaveProperty('error')
  })
})
