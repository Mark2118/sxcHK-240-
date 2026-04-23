import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { generateReportPDFHtml, generateMonthlyPDFHtml } from '@/lib/pdf-template'
import puppeteer from 'puppeteer-core'
import Database from 'better-sqlite3'
import path from 'path'

export const dynamic = 'force-dynamic'

const CHROME_PATH = process.env.CHROME_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'

interface ReportRow {
  id: string
  user_id: string | null
  subject: string
  score: number
  total_questions: number
  correct: number
  wrong: number
  report_json: string
  html: string | null
  exercises_json: string | null
  created_at: string
}

/**
 * 获取月度总结数据（复用 /api/summary/monthly 逻辑）
 */
function getMonthlyData(userId: string) {
  const dbPath = process.env.DATABASE_URL?.replace('file:', '') || path.join(process.cwd(), 'data', 'wingo-xsc.db')
  const db = new Database(dbPath)

  try {
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

    return {
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
    }
  } finally {
    db.close()
  }
}

/**
 * 获取报告数据
 */
function getReportData(reportId: string, userId: string) {
  const dbPath = process.env.DATABASE_URL?.replace('file:', '') || path.join(process.cwd(), 'data', 'wingo-xsc.db')
  const db = new Database(dbPath)

  try {
    const row = db.prepare(`
      SELECT id, user_id, subject, score, total_questions, correct, wrong,
             report_json, html, exercises_json, created_at
      FROM reports WHERE id = ?
    `).get(reportId) as ReportRow | undefined

    if (!row) return null

    // 权限检查：只能导出自己的报告
    if (row.user_id && row.user_id !== userId) {
      return null
    }

    let report = null
    let exercises = null
    try {
      report = JSON.parse(row.report_json)
    } catch {
      report = null
    }
    try {
      if (row.exercises_json) {
        exercises = JSON.parse(row.exercises_json)
      }
    } catch {
      exercises = null
    }

    return {
      id: row.id,
      subject: row.subject,
      score: row.score,
      totalQuestions: row.total_questions,
      correct: row.correct,
      wrong: row.wrong,
      createdAt: row.created_at,
      report,
      exercises,
    }
  } finally {
    db.close()
  }
}

/**
 * 使用 puppeteer 将 HTML 转为 PDF
 */
async function htmlToPdf(html: string): Promise<Uint8Array> {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--font-render-hinting=none',
    ],
  })

  try {
    const page = await browser.newPage()
    await page.setContent(html, { waitUntil: 'networkidle0', timeout: 30000 })

    // 等待字体渲染
    await page.evaluate(() => document.fonts.ready)

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      preferCSSPageSize: true,
      margin: { top: 0, right: 0, bottom: 0, left: 0 },
    })

    return new Uint8Array(pdfBuffer)
  } finally {
    await browser.close()
  }
}

export async function POST(req: NextRequest) {
  try {
    // JWT 认证
    const token = req.headers.get('authorization')?.replace('Bearer ', '') || req.cookies.get('auth-token')?.value
    if (!token) {
      return NextResponse.json({ success: false, error: '未登录' }, { status: 401 })
    }

    const payload = await verifyToken(token)
    if (!payload?.userId) {
      return NextResponse.json({ success: false, error: '登录已过期' }, { status: 401 })
    }

    const userId = payload.userId as string
    const body = await req.json().catch(() => ({}))
    const { reportId, type = 'report' } = body

    let html = ''
    let filename = ''

    if (type === 'report') {
      if (!reportId || typeof reportId !== 'string') {
        return NextResponse.json({ success: false, error: '缺少报告ID' }, { status: 400 })
      }

      const reportData = getReportData(reportId, userId)
      if (!reportData) {
        return NextResponse.json({ success: false, error: '报告不存在或无权限' }, { status: 404 })
      }

      // 获取用户昵称
      const dbPath = process.env.DATABASE_URL?.replace('file:', '') || path.join(process.cwd(), 'data', 'wingo-xsc.db')
      const db = new Database(dbPath)
      const userRow = db.prepare('SELECT nickname FROM users WHERE id = ?').get(userId) as { nickname: string | null } | undefined
      db.close()

      html = generateReportPDFHtml({
        ...reportData,
        userName: userRow?.nickname || undefined,
      })
      filename = `WinGo学情分析报告_${reportData.subject}_${reportData.id}.pdf`
    } else if (type === 'monthly') {
      const monthlyData = getMonthlyData(userId)

      // 获取用户昵称
      const dbPath = process.env.DATABASE_URL?.replace('file:', '') || path.join(process.cwd(), 'data', 'wingo-xsc.db')
      const db = new Database(dbPath)
      const userRow = db.prepare('SELECT nickname FROM users WHERE id = ?').get(userId) as { nickname: string | null } | undefined
      db.close()

      const periodLabel = `${monthlyData.period.start.slice(0, 7).replace('-', '年')}月`

      html = generateMonthlyPDFHtml({
        ...monthlyData,
        userName: userRow?.nickname || undefined,
      })
      filename = `WinGo月度学情总结_${periodLabel}.pdf`
    } else {
      return NextResponse.json({ success: false, error: '无效的 type 参数' }, { status: 400 })
    }

    // 生成 PDF
    const pdfBuffer = await htmlToPdf(html)

    // 返回 PDF
    const blob = new Blob([pdfBuffer as any], { type: 'application/pdf' })
    return new NextResponse(blob, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(filename)}"`,
        'Content-Length': pdfBuffer.byteLength.toString(),
      },
    })
  } catch (error: any) {
    console.error('[PDF] 生成失败:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'PDF 生成失败' },
      { status: 500 }
    )
  }
}
