/**
 * WinGo OPC 运营仪表盘 API
 * 聚合 XSC 核心业务数据 + 外部服务健康状态
 * 需 MASTER_KEY 认证
 */

import { NextRequest, NextResponse } from 'next/server'
import { dbClient } from '@/lib/db'

const MASTER_KEY = process.env.MASTER_KEY || 'xsc-admin-2026'

interface HealthResult {
  status: 'online' | 'offline'
  responseTime: number
}

async function checkHealth(url: string, timeout = 5000): Promise<HealthResult> {
  const start = Date.now()
  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeout)
    const res = await fetch(url, {
      method: 'GET',
      signal: controller.signal,
      cache: 'no-store',
    })
    clearTimeout(timer)
    return {
      status: res.ok ? 'online' : 'offline',
      responseTime: Date.now() - start,
    }
  } catch {
    return { status: 'offline', responseTime: 0 }
  }
}

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  const key = authHeader?.replace('Bearer ', '') || req.nextUrl.searchParams.get('key')
  if (key !== MASTER_KEY) {
    return NextResponse.json({ success: false, error: 'UNAUTHORIZED' }, { status: 401 })
  }

  try {
    const [realtime, trends, overview, todos] = await Promise.all([
      Promise.resolve().then(() => dbClient.stats.getRealtime()),
      Promise.resolve().then(() => dbClient.stats.getTrends(7)),
      Promise.resolve().then(() => dbClient.stats.getOverview()),
      Promise.resolve().then(() => dbClient.stats.getTodos()),
    ])

    const xscUrl = 'http://localhost:3000/xsc/api/health'

    const [xscHealth, n8nHealth, openmaicHealth, difyHealth] = await Promise.all([
      checkHealth(xscUrl),
      checkHealth('http://localhost:5678/healthz'),
      checkHealth('http://localhost:3001/api/health'),
      checkHealth('http://localhost/'),
    ])

    return NextResponse.json({
      success: true,
      data: {
        realtime: {
          ...realtime,
          uploadsChange: realtime.yesterdayUploads > 0
            ? Math.round(((realtime.todayUploads - realtime.yesterdayUploads) / realtime.yesterdayUploads) * 100)
            : realtime.todayUploads > 0 ? 100 : 0,
          paymentsChange: realtime.yesterdayPayments > 0
            ? Math.round(((realtime.todayPayments - realtime.yesterdayPayments) / realtime.yesterdayPayments) * 100)
            : realtime.todayPayments > 0 ? 100 : 0,
          usersChange: realtime.yesterdayNewUsers > 0
            ? Math.round(((realtime.todayNewUsers - realtime.yesterdayNewUsers) / realtime.yesterdayNewUsers) * 100)
            : realtime.todayNewUsers > 0 ? 100 : 0,
        },
        trends,
        overview,
        todos,
        services: {
          xsc: xscHealth,
          n8n: n8nHealth,
          openmaic: openmaicHealth,
          dify: difyHealth,
        },
        updatedAt: new Date().toISOString(),
      },
    })
  } catch (e: any) {
    console.error('[OPS Dashboard] Error:', e)
    return NextResponse.json(
      { success: false, error: 'INTERNAL_ERROR', message: e.message },
      { status: 500 }
    )
  }
}
