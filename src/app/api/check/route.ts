import { NextRequest, NextResponse } from 'next/server'
import { analyzeHomework } from '@/lib/ai'
import { renderReportHTML } from '@/lib/report'
import { generateExercises } from '@/lib/exercises'
import { dbClient } from '@/lib/db'
import { verifyToken } from '@/lib/auth'
import { emitReportGenerated } from '@/lib/marketing'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { text, subject = 'math', generateExerciseSet = false, ocrText } = body

    if (!text || !text.trim()) {
      return NextResponse.json({ error: '请提供作业内容' }, { status: 400 })
    }

    // 强制鉴权
    const token = req.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 })
    }

    const payload = await verifyToken(token)
    if (!payload?.userId) {
      return NextResponse.json({ error: '登录已过期，请重新登录' }, { status: 401 })
    }

    const userId = payload.userId as string

    // Phase 2.2: 人工复核节点 — 低置信度检查
    if (text.includes('[低置信度]')) {
      const lowConfCount = (text.match(/\[低置信度\]/g) || []).length
      return NextResponse.json({
        success: false,
        code: 'NEED_REVIEW',
        error: `识别质量不足，发现 ${lowConfCount} 处低置信度内容`,
        detail: '建议重新拍照（光线充足、避免手抖）或手动输入作业内容',
        suggestion: '如需继续分析，可点击「仍要分析」忽略此警告',
        canProceed: true,
      }, { status: 422 })
    }

    // 检查使用限额
    const limitCheck = dbClient.userLimits.canGenerate(userId)
    if (!limitCheck.can) {
      return NextResponse.json(
        { error: '免费次数已用完，开通会员可无限使用', code: 'NO_QUOTA', needPurchase: true },
        { status: 403 }
      )
    }

    // 1. AI 学情分析
    const report = await analyzeHomework(text, subject)
    const html = renderReportHTML(report)

    // 2. 根据薄弱点生成个性化练习（Phase 2.1: 传入原始文本做题型锚定）
    let exercises = null
    if (generateExerciseSet || report.wrong > 0) {
      try {
        exercises = await generateExercises(
          report.weakPoints,
          report.moduleScores,
          subject,
          text // Phase 2.1: 原始文本用于题型锚定
        )
      } catch (e) {
        console.error('练习生成失败:', e)
      }
    }

    // 3. 扣减免费次数（仅限免费用户）
    if (limitCheck.type === 'free') {
      dbClient.userLimits.decrementFree(userId)
    }

    // 4. 持久化到 SQLite
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

      // 5. 触发营销事件
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
    } catch (dbErr) {
      console.error('数据库保存失败:', dbErr)
    }

    return NextResponse.json({
      success: true,
      report,
      html,
      exercises,
      reportId,
      freeCount: Math.max(0, (limitCheck.freeCount ?? 0) - (limitCheck.type === 'free' ? 1 : 0)),
    })
  } catch (error: any) {
    console.error('学情分析错误:', error)
    return NextResponse.json(
      { error: error.message || '分析失败，请稍后重试' },
      { status: 500 }
    )
  }
}
