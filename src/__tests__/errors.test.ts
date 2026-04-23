import { describe, it, expect } from 'vitest'
import { AppError, isAppError, getErrorResponse } from '@/lib/errors'

describe('AppError', () => {
  it('should create UNAUTHORIZED error', () => {
    const err = new AppError('UNAUTHORIZED')
    expect(err.code).toBe('UNAUTHORIZED')
    expect(err.statusCode).toBe(401)
    expect(err.userMessage).toBe('请先登录')
    expect(err.toJSON().success).toBe(false)
  })

  it('should create VALIDATION_ERROR with details', () => {
    const err = new AppError('VALIDATION_ERROR', {
      message: '字段校验失败',
      details: { field: 'email', reason: 'invalid' },
    })
    expect(err.statusCode).toBe(400)
    expect(err.details).toEqual({ field: 'email', reason: 'invalid' })
  })

  it('should identify AppError instances', () => {
    const err = new AppError('INTERNAL_ERROR')
    expect(isAppError(err)).toBe(true)
    expect(isAppError(new Error('plain'))).toBe(false)
    expect(isAppError('string')).toBe(false)
  })

  it('should format unknown errors', () => {
    const resp = getErrorResponse(new Error('something broke'))
    expect(resp.success).toBe(false)
    expect(resp.error.code).toBe('INTERNAL_ERROR')
  })
})
