/**
 * WinGo 企业级结构化日志系统
 * - 统一日志格式（JSON）
 * - 支持日志级别（debug/info/warn/error/fatal）
 * - 自动附加时间戳、traceId、上下文
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal'

interface LogContext {
  traceId?: string
  userId?: string
  requestId?: string
  path?: string
  [key: string]: unknown
}

interface LogEntry {
  timestamp: string
  level: LogLevel
  message: string
  service: string
  context?: LogContext
  error?: {
    name: string
    message: string
    stack?: string
  }
  duration?: number
}

const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
  fatal: 4,
}

const CURRENT_LOG_LEVEL: LogLevel =
  (process.env.LOG_LEVEL as LogLevel) || (process.env.NODE_ENV === 'production' ? 'info' : 'debug')

function shouldLog(level: LogLevel): boolean {
  return LOG_LEVEL_PRIORITY[level] >= LOG_LEVEL_PRIORITY[CURRENT_LOG_LEVEL]
}

function formatEntry(entry: LogEntry): string {
  if (process.env.NODE_ENV === 'production' || process.env.LOG_FORMAT === 'json') {
    return JSON.stringify(entry)
  }
  const ctx = entry.context ? ` | ${JSON.stringify(entry.context)}` : ''
  const dur = entry.duration ? ` | ${entry.duration}ms` : ''
  const err = entry.error ? ` | ERROR: ${entry.error.name}: ${entry.error.message}` : ''
  return `[${entry.timestamp}] ${entry.level.toUpperCase()} | ${entry.service} | ${entry.message}${ctx}${dur}${err}`
}

function writeLog(entry: LogEntry): void {
  const line = formatEntry(entry)
  if (entry.level === 'error' || entry.level === 'fatal') {
    console.error(line)
  } else if (entry.level === 'warn') {
    console.warn(line)
  } else {
    console.log(line)
  }
}

function createLogger(service: string) {
  const traceId = (): string => {
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
      return (crypto as any).randomUUID()
    }
    return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
  }

  return {
    debug: (message: string, context?: LogContext) => {
      if (!shouldLog('debug')) return
      writeLog({ timestamp: new Date().toISOString(), level: 'debug', message, service, context })
    },
    info: (message: string, context?: LogContext) => {
      if (!shouldLog('info')) return
      writeLog({ timestamp: new Date().toISOString(), level: 'info', message, service, context })
    },
    warn: (message: string, context?: LogContext) => {
      if (!shouldLog('warn')) return
      writeLog({ timestamp: new Date().toISOString(), level: 'warn', message, service, context })
    },
    error: (message: string, error?: Error, context?: LogContext) => {
      if (!shouldLog('error')) return
      writeLog({
        timestamp: new Date().toISOString(),
        level: 'error',
        message,
        service,
        context: { ...context, traceId: context?.traceId || traceId() },
        error: error
          ? { name: error.name, message: error.message, stack: process.env.NODE_ENV !== 'production' ? error.stack : undefined }
          : undefined,
      })
    },
    fatal: (message: string, error?: Error, context?: LogContext) => {
      writeLog({
        timestamp: new Date().toISOString(),
        level: 'fatal',
        message,
        service,
        context: { ...context, traceId: context?.traceId || traceId() },
        error: error
          ? { name: error.name, message: error.message, stack: error.stack }
          : undefined,
      })
    },
    withContext: (ctx: LogContext) => createLoggerWithContext(service, ctx),
    traceId,
  }
}

function createLoggerWithContext(service: string, baseContext: LogContext) {
  const base = createLogger(service)
  return {
    debug: (message: string, ctx?: LogContext) => base.debug(message, { ...baseContext, ...ctx }),
    info: (message: string, ctx?: LogContext) => base.info(message, { ...baseContext, ...ctx }),
    warn: (message: string, ctx?: LogContext) => base.warn(message, { ...baseContext, ...ctx }),
    error: (message: string, error?: Error, ctx?: LogContext) => base.error(message, error, { ...baseContext, ...ctx }),
    fatal: (message: string, error?: Error, ctx?: LogContext) => base.fatal(message, error, { ...baseContext, ...ctx }),
  }
}

export const logger = createLogger('xsc-core')
export { createLogger }
export type { LogContext, LogLevel, LogEntry }
