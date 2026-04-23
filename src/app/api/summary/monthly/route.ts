import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import Database from 'better-sqlite3'
import path from 'path'

export const dynamic = 'force-dynamic'

interface ReportRow {
  id: string
  score: number
  total_questions: number
  correct: number
  wrong: number
  report_json: string
  created_at: string
}

export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '') || req.cookies.get('auth-token')?.value
    if (!token) {
      return NextResponse.json({ success: false, error: '未登录' }, { status: 401 })
    }

    const payload = await verifyToken(token)
    if (!payload?.userId) {
      return NextResponse.json({ success: false, error: '登录已过期' }, { status: 401 })
    }

    const userId = payload.userId as string
    const dbPath = process.env.DATABASE_URL?.replace('file:', '') || path.join(process.cwd(), 'data', 'wingo-xsc.db')
    const db = new Database(dbPath)

    // 上月时间范围
    const lastMonthStartRow = db.prepare("SELECT datetime('now', 'start of month', '-1 month') as d").get() as { d: string }
    const lastMonthEndRow = db.prepare("SELECT datetime('now', 'start of month') as d").get() as { d: string }
    // 上上月时间范围
    const prevMonthStartRow = db.prepare("SELECT datetime('now', 'start of month', '-2 months') as d").get() as { d: string }

    const lastMonthStart = lastMonthStartRow.d
    const lastMonthEnd = lastMonthEndRow.d
    const prevMonthStart = prevMonthStartRow.d
    const prevMonthEnd = lastMonthStart

    const reports = db.prepare(`
      SELECT id, score, total_questions, correct, wrong, report_json, created_at
      FROM reports
      WHERE user_id = ? AND created_at >= ? AND created_at < ?
      ORDER BY created_at ASC
    `).all(userId, lastMonthStart, lastMonthEnd) as ReportRow[]

    const prevReports = db.prepare(`
      SELECT id, score, total_questions, correct, wrong, report_json, created_at
      FROM reports
      WHERE user_id = ? AND created_at >= ? AND created_at < ?
      ORDER BY created_at ASC
    `).all(userId, prevMonthStart, prevMonthEnd) as ReportRow[]

    // 基础统计
    const totalReports = reports.length
    const prevTotalReports = prevReports.length
    const avgScore = totalReports > 0
      ? Math.round(reports.reduce((sum, r) => sum + r.score, 0) / totalReports)
      : 0
    const prevAvgScore = prevTotalReports > 0
      ? Math.round(prevReports.reduce((sum, r) => sum + r.score, 0) / prevTotalReports)
      : 0

    // 薄弱点统计
    const weakPointCounts: Record<string, number> = {}
    for (const r of reports) {
      try {
        const parsed = JSON.parse(r.report_json)
        const wps: string[] = parsed.weakPoints || []
        for (const wp of wps) {
          weakPointCounts[wp] = (weakPointCounts[wp] || 0) + 1
        }
      } catch {
        // ignore malformed json
      }
    }
    const weakPointsTop3 = Object.entries(weakPointCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3)

    // 模块得分统计（上月）
    const moduleScoresCurrent: Record<string, { total: number; count: number }> = {}
    for (const r of reports) {
      try {
        const parsed = JSON.parse(r.report_json)
        const modules: Array<{ module: string; scoreRate: number }> = parsed.moduleScores || []
        for (const m of modules) {
          if (!moduleScoresCurrent[m.module]) {
            moduleScoresCurrent[m.module] = { total: 0, count: 0 }
          }
          moduleScoresCurrent[m.module].total += m.scoreRate
          moduleScoresCurrent[m.module].count += 1
        }
      } catch {
        // ignore
      }
    }

    // 模块得分统计（上上月）
    const moduleScoresPrev: Record<string, { total: number; count: number }> = {}
    for (const r of prevReports) {
      try {
        const parsed = JSON.parse(r.report_json)
        const modules: Array<{ module: string; scoreRate: number }> = parsed.moduleScores || []
        for (const m of modules) {
          if (!moduleScoresPrev[m.module]) {
            moduleScoresPrev[m.module] = { total: 0, count: 0 }
          }
          moduleScoresPrev[m.module].total += m.scoreRate
          moduleScoresPrev[m.module].count += 1
        }
      } catch {
        // ignore
      }
    }

    // 进步最大模块
    let bestImprovementModule: { module: string; currentAvg: number; prevAvg: number; improvement: number } | null = null
    for (const [module, current] of Object.entries(moduleScoresCurrent)) {
      const currentAvg = current.total / current.count
      const prev = moduleScoresPrev[module]
      if (prev && prev.count > 0) {
        const prevAvg = prev.total / prev.count
        const improvement = currentAvg - prevAvg
        if (!bestImprovementModule || improvement > bestImprovementModule.improvement) {
          bestImprovementModule = { module, currentAvg: Math.round(currentAvg), prevAvg: Math.round(prevAvg), improvement: Math.round(improvement * 10) / 10 }
        }
      }
    }

    // 环比变化
    const reportCountChange = totalReports - prevTotalReports
    const avgScoreChange = avgScore - prevAvgScore

    db.close()

    return NextResponse.json({
      success: true,
      data: {
        period: {
          start: lastMonthStart.slice(0, 10),
          end: lastMonthEnd.slice(0, 10),
        },
        totalReports,
        avgScore,
        weakPointsTop3,
        bestImprovementModule: bestImprovementModule
          ? {
              module: bestImprovementModule.module,
              currentAvg: bestImprovementModule.currentAvg,
              prevAvg: bestImprovementModule.prevAvg,
              improvement: bestImprovementModule.improvement,
            }
          : null,
        monthOverMonth: {
          reportCountChange,
          avgScoreChange,
          prevMonthReports: prevTotalReports,
          prevMonthAvgScore: prevAvgScore,
        },
      },
    })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || '查询失败' }, { status: 500 })
  }
}
