import { NextRequest, NextResponse } from 'next/server'
import { authB } from '@/lib/b-auth'
import { dbClient } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const institution = authB(req)
  if (!institution) return NextResponse.json({ success: false, error: 'UNAUTHORIZED' }, { status: 401 })

  try {
    const { id } = params
    const cls = dbClient.classes.findById(id)
    if (!cls || cls.institutionId !== institution.id) {
      return NextResponse.json({ success: false, error: 'NOT_FOUND' }, { status: 404 })
    }

    const students = dbClient.students.findByClass(id)

    // 聚合所有学生的报告
    let totalScore = 0
    let scoreCount = 0
    const allWeakPoints: Record<string, number> = {}
    const scoreTrend: Array<{ date: string; score: number }> = []

    for (const s of students) {
      if (!s.parentUserId) continue
      const reports = await dbClient.check.findByUserId(s.parentUserId, 20)
      for (const r of reports) {
        totalScore += r.score
        scoreCount++
        scoreTrend.push({ date: r.createdAt.slice(0, 10), score: r.score })
        try {
          const report = JSON.parse(r.reportJson)
          const wps: string[] = report.weakPoints || []
          for (const wp of wps) {
            allWeakPoints[wp] = (allWeakPoints[wp] || 0) + 1
          }
        } catch {}
      }
    }

    const avgScore = scoreCount > 0 ? Math.round(totalScore / scoreCount) : 0

    // 按日期聚合平均分（最近30天）
    const trendMap: Record<string, { total: number; count: number }> = {}
    for (const t of scoreTrend) {
      if (!trendMap[t.date]) trendMap[t.date] = { total: 0, count: 0 }
      trendMap[t.date].total += t.score
      trendMap[t.date].count++
    }
    const trend = Object.entries(trendMap)
      .map(([date, d]) => ({ date, avgScore: Math.round(d.total / d.count) }))
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-30)

    const weakPointTop5 = Object.entries(allWeakPoints)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)

    return NextResponse.json({
      success: true,
      data: {
        classId: id,
        className: cls.name,
        grade: cls.grade,
        subject: cls.subject,
        studentCount: students.length,
        avgScore,
        analysisCount: scoreCount,
        trend,
        weakPointTop5,
      },
    })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: 'INTERNAL_ERROR', message: e.message }, { status: 500 })
  }
}
