import { NextRequest, NextResponse } from 'next/server'
import { dbClient } from '@/lib/db'
import { verifyToken } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 })
    }

    const payload = await verifyToken(token)
    if (!payload?.userId) {
      return NextResponse.json({ error: '登录已过期' }, { status: 401 })
    }

    const userId = payload.userId as string
    const { searchParams } = new URL(req.url)
    const subject = searchParams.get('subject') || undefined

    const records = await dbClient.check.findByUserIdForTrends(userId, subject, 50)

    if (records.length === 0) {
      return NextResponse.json({
        success: true,
        trends: {
          totalReports: 0,
          scoreHistory: [],
          weakPointStats: [],
          moduleTrends: {},
          knowledgeTimeline: [],
        },
      })
    }

    const scoreHistory = records.map((r) => ({
      date: r.createdAt.slice(0, 10),
      score: r.score,
      totalQuestions: r.totalQuestions,
      correct: r.correct,
      wrong: r.wrong,
      reportId: r.id,
    }))

    const weakPointMap: Record<string, { count: number; firstSeen: string; lastSeen: string }> = {}
    for (const r of records) {
      try {
        const report = JSON.parse(r.reportJson)
        const wps: string[] = report.weakPoints || []
        for (const wp of wps) {
          if (!weakPointMap[wp]) {
            weakPointMap[wp] = { count: 0, firstSeen: r.createdAt, lastSeen: r.createdAt }
          }
          weakPointMap[wp].count++
          weakPointMap[wp].lastSeen = r.createdAt
        }
      } catch {}
    }

    const weakPointStats = Object.entries(weakPointMap)
      .map(([name, data]) => ({
        name,
        count: data.count,
        firstSeen: data.firstSeen.slice(0, 10),
        lastSeen: data.lastSeen.slice(0, 10),
        frequency: Math.round((data.count / records.length) * 100),
      }))
      .sort((a, b) => b.count - a.count)

    const moduleTrends: Record<string, Array<{ date: string; scoreRate: number }>> = {}
    for (const r of records) {
      try {
        const report = JSON.parse(r.reportJson)
        const modules = report.moduleScores || []
        for (const m of modules) {
          if (!moduleTrends[m.module]) moduleTrends[m.module] = []
          moduleTrends[m.module].push({ date: r.createdAt.slice(0, 10), scoreRate: m.scoreRate })
        }
      } catch {}
    }

    const knowledgeTimeline: Array<{
      date: string
      reportId: string
      knowledgePoint: string
      module: string
    }> = []
    for (const r of records) {
      try {
        const report = JSON.parse(r.reportJson)
        const questions = report.questions || []
        for (const q of questions) {
          if (!q.isCorrect && q.knowledgePoint) {
            knowledgeTimeline.push({
              date: r.createdAt.slice(0, 10),
              reportId: r.id,
              knowledgePoint: q.knowledgePoint,
              module: q.examModule || '未分类',
            })
          }
        }
      } catch {}
    }

    return NextResponse.json({
      success: true,
      trends: {
        totalReports: records.length,
        scoreHistory,
        weakPointStats,
        moduleTrends,
        knowledgeTimeline: knowledgeTimeline.slice(0, 100),
      },
    })
  } catch (error: any) {
    console.error('趋势查询错误:', error)
    return NextResponse.json({ error: error.message || '查询失败' }, { status: 500 })
  }
}
