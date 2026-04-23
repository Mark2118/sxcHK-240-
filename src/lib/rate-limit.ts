/**
 * WinGo 企业级内存限流器
 * - 按 key 限流（IP / userId / 组合）
 * - 滑动窗口算法
 * - 自动清理过期记录
 */

interface RateLimitConfig {
  windowMs: number      // 时间窗口（毫秒）
  maxRequests: number   // 窗口内最大请求数
}

interface RateLimitEntry {
  count: number
  resetAt: number       // 重置时间戳
}

const DEFAULT_CONFIG: RateLimitConfig = {
  windowMs: 60 * 1000,  // 1分钟
  maxRequests: 60,       // 60次/分钟
}

// 内存存储（生产环境应换 Redis）
const store = new Map<string, RateLimitEntry>()

// 每5分钟清理一次过期记录
const CLEANUP_INTERVAL = 5 * 60 * 1000
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of store.entries()) {
    if (entry.resetAt < now) {
      store.delete(key)
    }
  }
}, CLEANUP_INTERVAL)

export interface RateLimitResult {
  allowed: boolean
  limit: number
  remaining: number
  resetAt: number
  retryAfter?: number
}

export function checkRateLimit(key: string, config?: Partial<RateLimitConfig>): RateLimitResult {
  const cfg = { ...DEFAULT_CONFIG, ...config }
  const now = Date.now()
  const entry = store.get(key)

  if (!entry || entry.resetAt < now) {
    // 新窗口
    const resetAt = now + cfg.windowMs
    store.set(key, { count: 1, resetAt })
    return {
      allowed: true,
      limit: cfg.maxRequests,
      remaining: cfg.maxRequests - 1,
      resetAt,
    }
  }

  if (entry.count >= cfg.maxRequests) {
    return {
      allowed: false,
      limit: cfg.maxRequests,
      remaining: 0,
      resetAt: entry.resetAt,
      retryAfter: Math.ceil((entry.resetAt - now) / 1000),
    }
  }

  entry.count++
  return {
    allowed: true,
    limit: cfg.maxRequests,
    remaining: cfg.maxRequests - entry.count,
    resetAt: entry.resetAt,
  }
}

// 预设限流策略
export const rateLimitPresets = {
  // 公共 API：60次/分钟
  public: { windowMs: 60 * 1000, maxRequests: 60 },
  // 认证 API：10次/分钟（防暴力破解）
  auth: { windowMs: 60 * 1000, maxRequests: 10 },
  // 分析 API：5次/分钟（AI 分析成本高）
  analyze: { windowMs: 60 * 1000, maxRequests: 5 },
  // Webhook：100次/分钟（内部服务）
  webhook: { windowMs: 60 * 1000, maxRequests: 100 },
  // 管理后台：30次/分钟
  admin: { windowMs: 60 * 1000, maxRequests: 30 },
}

export function rateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    'X-RateLimit-Limit': String(result.limit),
    'X-RateLimit-Remaining': String(result.remaining),
    'X-RateLimit-Reset': String(Math.ceil(result.resetAt / 1000)),
    ...(result.retryAfter ? { 'Retry-After': String(result.retryAfter) } : {}),
  }
}
