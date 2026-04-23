/**
 * WinGo 企业级错误体系
 * - 结构化错误码
 * - HTTP 状态码映射
 * - 用户友好错误消息
 */

export type ErrorCode =
  // 认证/授权
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'TOKEN_EXPIRED'
  | 'INVALID_TOKEN'
  // 输入校验
  | 'VALIDATION_ERROR'
  | 'MISSING_FIELD'
  | 'INVALID_FORMAT'
  // 业务逻辑
  | 'RESOURCE_NOT_FOUND'
  | 'DUPLICATE_RESOURCE'
  | 'QUOTA_EXCEEDED'
  | 'PAYMENT_REQUIRED'
  // 外部服务
  | 'EXTERNAL_SERVICE_ERROR'
  | 'TIMEOUT'
  | 'RATE_LIMITED'
  // 系统
  | 'INTERNAL_ERROR'
  | 'NOT_IMPLEMENTED'
  | 'SERVICE_UNAVAILABLE'

interface ErrorMeta {
  statusCode: number
  userMessage: string
  shouldLog: boolean
  logLevel: 'warn' | 'error'
}

const ERROR_MAP: Record<ErrorCode, ErrorMeta> = {
  UNAUTHORIZED: { statusCode: 401, userMessage: '请先登录', shouldLog: false, logLevel: 'warn' },
  FORBIDDEN: { statusCode: 403, userMessage: '没有权限执行此操作', shouldLog: true, logLevel: 'warn' },
  TOKEN_EXPIRED: { statusCode: 401, userMessage: '登录已过期，请重新登录', shouldLog: false, logLevel: 'warn' },
  INVALID_TOKEN: { statusCode: 401, userMessage: '登录信息无效', shouldLog: true, logLevel: 'warn' },
  VALIDATION_ERROR: { statusCode: 400, userMessage: '输入数据格式不正确', shouldLog: false, logLevel: 'warn' },
  MISSING_FIELD: { statusCode: 400, userMessage: '缺少必要参数', shouldLog: false, logLevel: 'warn' },
  INVALID_FORMAT: { statusCode: 400, userMessage: '数据格式错误', shouldLog: false, logLevel: 'warn' },
  RESOURCE_NOT_FOUND: { statusCode: 404, userMessage: '请求的资源不存在', shouldLog: false, logLevel: 'warn' },
  DUPLICATE_RESOURCE: { statusCode: 409, userMessage: '资源已存在', shouldLog: false, logLevel: 'warn' },
  QUOTA_EXCEEDED: { statusCode: 429, userMessage: '使用额度已用完，请升级会员', shouldLog: false, logLevel: 'warn' },
  PAYMENT_REQUIRED: { statusCode: 402, userMessage: '需要付费解锁此功能', shouldLog: false, logLevel: 'warn' },
  EXTERNAL_SERVICE_ERROR: { statusCode: 502, userMessage: '外部服务暂时不可用，请稍后重试', shouldLog: true, logLevel: 'error' },
  TIMEOUT: { statusCode: 504, userMessage: '请求超时，请稍后重试', shouldLog: true, logLevel: 'warn' },
  RATE_LIMITED: { statusCode: 429, userMessage: '请求过于频繁，请稍后再试', shouldLog: true, logLevel: 'warn' },
  INTERNAL_ERROR: { statusCode: 500, userMessage: '系统内部错误，请稍后重试', shouldLog: true, logLevel: 'error' },
  NOT_IMPLEMENTED: { statusCode: 501, userMessage: '此功能尚未实现', shouldLog: true, logLevel: 'warn' },
  SERVICE_UNAVAILABLE: { statusCode: 503, userMessage: '服务暂时不可用，请稍后重试', shouldLog: true, logLevel: 'error' },
}

export class AppError extends Error {
  public readonly code: ErrorCode
  public readonly statusCode: number
  public readonly userMessage: string
  public readonly shouldLog: boolean
  public readonly logLevel: 'warn' | 'error'
  public readonly details?: Record<string, unknown>

  constructor(
    code: ErrorCode,
    options?: {
      message?: string
      details?: Record<string, unknown>
      cause?: Error
    }
  ) {
    const meta = ERROR_MAP[code]
    super(options?.message || meta.userMessage, { cause: options?.cause })
    this.code = code
    this.statusCode = meta.statusCode
    this.userMessage = meta.userMessage
    this.shouldLog = meta.shouldLog
    this.logLevel = meta.logLevel
    this.details = options?.details
    this.name = 'AppError'
    Error.captureStackTrace(this, AppError)
  }

  toJSON() {
    return {
      success: false,
      error: {
        code: this.code,
        message: this.userMessage,
        ...(process.env.NODE_ENV !== 'production' && this.details ? { details: this.details } : {}),
      },
    }
  }
}

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError
}

export function getErrorResponse(error: unknown) {
  if (isAppError(error)) {
    return error.toJSON()
  }
  if (error instanceof Error) {
    return {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: process.env.NODE_ENV === 'production' ? '系统内部错误' : error.message,
      },
    }
  }
  return {
    success: false,
    error: { code: 'INTERNAL_ERROR', message: '未知错误' },
  }
}
