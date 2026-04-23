/**
 * WinGo 企业级 API 中间件
 * - 请求日志（带 traceId）
 * - 速率限制
 * - 错误统一处理
 * - CORS 安全头
 * - 响应时间统计
 */

import { NextRequest, NextResponse } from 'next/server'
import { logger } from './logger'
import { AppError, getErrorResponse } from './errors'
import { checkRateLimit, rateLimitPresets, rateLimitHeaders, RateLimitResult } from './rate-limit'

interface MiddlewareContext {
  traceId: string
  startTime: number
  rateLimit?: RateLimitResult
}

function getClientIP(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0].trim()
  const realIP = req.headers.get('x-real-ip')
  if (realIP) return realIP
  return 'unknown'
}

function getRateLimitKey(req: NextRequest): string {
  const ip = getClientIP(req)
  const authHeader = req.headers.get('authorization')
  if (authHeader) {
    // 按用户限流
    return `user:${authHeader.slice(0, 32)}:${req.nextUrl.pathname}`
  }
  // 按 IP 限流
  return `ip:${ip}:${req.nextUrl.pathname}`
}

function getRateLimitPreset(pathname: string) {
  if (pathname.includes('/auth/')) return rateLimitPresets.auth
  if (pathname.includes('/check')) return rateLimitPresets.analyze
  if (pathname.includes('/webhook/')) return rateLimitPresets.webhook
  if (pathname.includes('/ops/') || pathname.includes('/summary/')) return rateLimitPresets.admin
  return rateLimitPresets.public
}

export function withMiddleware(
  handler: (req: NextRequest, ctx: MiddlewareContext) => Promise<NextResponse> | NextResponse
) {
  return async (req: NextRequest) => {
    const traceId = logger.traceId()
    const startTime = Date.now()
    const path = req.nextUrl.pathname
    const method = req.method
    const ip = getClientIP(req)

    const logCtx = { traceId, path, method, ip }
    const routeLogger = logger.withContext(logCtx)

    // 1. 速率限制检查
    const rateLimitKey = getRateLimitKey(req)
    const rateLimitConfig = getRateLimitPreset(path)
    const rateLimit = checkRateLimit(rateLimitKey, rateLimitConfig)

    if (!rateLimit.allowed) {
      routeLogger.warn('Rate limit exceeded', { retryAfter: rateLimit.retryAfter })
      return NextResponse.json(
        { success: false, error: { code: 'RATE_LIMITED', message: '请求过于频繁，请稍后再试' } },
        {
          status: 429,
          headers: {
            ...rateLimitHeaders(rateLimit),
            'Content-Type': 'application/json',
          },
        }
      )
    }

    // 2. 记录请求开始
    routeLogger.info('Request started')

    try {
      // 3. 执行业务逻辑
      const response = await handler(req, { traceId, startTime, rateLimit })

      // 4. 附加响应头
      const duration = Date.now() - startTime
      response.headers.set('X-Request-Id', traceId)
      response.headers.set('X-Response-Time', `${duration}ms`)
      Object.entries(rateLimitHeaders(rateLimit)).forEach(([k, v]) => {
        response.headers.set(k, v)
      })

      // 5. 安全头
      response.headers.set('X-Content-Type-Options', 'nosniff')
      response.headers.set('X-Frame-Options', 'DENY')
      response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')

      // 6. 记录请求完成
      routeLogger.info('Request completed', { duration, status: response.status })

      return response
    } catch (error) {
      // 7. 统一错误处理
      const duration = Date.now() - startTime

      if (error instanceof AppError) {
        if (error.shouldLog) {
          routeLogger.error(`AppError: ${error.code}`, error, { statusCode: error.statusCode, duration })
        }
        const response = NextResponse.json(error.toJSON(), { status: error.statusCode })
        response.headers.set('X-Request-Id', traceId)
        return response
      }

      // 未知错误
      routeLogger.error('Unhandled error', error instanceof Error ? error : new Error(String(error)), { duration })

      const errorResponse = getErrorResponse(error)
      const response = NextResponse.json(errorResponse, { status: 500 })
      response.headers.set('X-Request-Id', traceId)
      return response
    }
  }
}

// 便捷中间件：仅限流
export function withRateLimit(
  handler: (req: NextRequest) => Promise<NextResponse> | NextResponse,
  preset?: keyof typeof rateLimitPresets
) {
  return async (req: NextRequest) => {
    const ip = getClientIP(req)
    const path = req.nextUrl.pathname
    const key = `ip:${ip}:${path}`
    const config = preset ? rateLimitPresets[preset] : getRateLimitPreset(path)
    const rateLimit = checkRateLimit(key, config)

    if (!rateLimit.allowed) {
      return NextResponse.json(
        { success: false, error: { code: 'RATE_LIMITED', message: '请求过于频繁，请稍后再试' } },
        { status: 429, headers: rateLimitHeaders(rateLimit) }
      )
    }

    const response = await handler(req)
    Object.entries(rateLimitHeaders(rateLimit)).forEach(([k, v]) => response.headers.set(k, v))
    return response
  }
}
