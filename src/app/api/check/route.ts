import { NextRequest, NextResponse } from 'next/server'
import { analyzeHomework } from '@/lib/ai'
import { renderReportHTML } from '@/lib/report'
import { generateExercises } from '@/lib/exercises'
import { dbClient } from '@/lib/db'
import { verifyToken } from '@/lib/auth'
import { emitReportGenerated } from '@/lib/marketing'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { text, subject = 'math', generateExerciseSet = false, ocrText } = body

    if (!text || !text.trim()) {
      return NextResponse.json({ error: '请提供作业内容' }, { status: 400 })
    }

    // 获取当前用户（可选，未登录也能生成报告但不关联）
    let userId: string | undefined
    const token = req.headers.get('authorization')?.replace('Bearer ', '')
    if (token) {
      const payload = await verifyToken(token)
      if (payload?.userId) {
        userId = payload.userId as string
      }
    }

    // 1. AI 学情分析
    const report = await analyzeHomework(text, subject)
    const html = renderReportHTML(report)

    // 2. 根据薄弱点生成个性化练习
    let exercises = null
    if (generateExerciseSet || report.wrong > 0) {
      try {
        exercises = await generateExercises(
          report.weakPoints,
          report.moduleScores,
          subject
        )
      } catch (e) {
        console.error('练习生成失败:', e)
      }
    }

    // 3. 持久化到 SQLite，关联用户
    let reportId: string | null = null
    try {
      const record = await dbClient.check.create({
        userId,
        subject,
        score: report.score,
        totalQuestions: report.totalQuestions,
        correct: report.correct,
        wrong: report.wrong,
        ocrText,
        reportJson: JSON.stringify(report),
        html,
        exercisesJson: exercises ? JSON.stringify(exercises) : undefined,
      })
      reportId = record.id

      // 4. 触发营销事件：报告生成
      if (userId) {
        const user = dbClient.users.findById(userId)
        const limit = dbClient.userLimits.findByUserId(userId)
        if (user) {
          emitReportGenerated(
            userId,
            user.openid,
            record.id,
            subject,
            report.score,
            report.correct,
            report.totalQuestions,
            limit?.freeCount ?? 0,
            limit?.memberType
          )
        }
      }
    } catch (dbErr) {
      console.error('数据库保存失败:', dbErr)
    }

    return NextResponse.json({
      success: true,
      report,
      html,
      exercises,
      reportId,
    })
  } catch (error: any) {
    console.error('学情分析错误:', error)
    return NextResponse.json(
      { error: error.message || '分析失败，请稍后重试' },
      { status: 500 }
    )
  }
}
