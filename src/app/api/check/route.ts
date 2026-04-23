import { NextRequest, NextResponse } from 'next/server'
import { analyzeHomework } from '@/lib/ai'
import { renderReportHTML } from '@/lib/report'
import { generateExercises } from '@/lib/exercises'
import { dbClient } from '@/lib/db'
import { verifyToken } from '@/lib/auth'
import { emitReportGenerated, emitFreeQuotaExhausted } from '@/lib/marketing'
import { matchPaper } from '@/lib/paper-index'

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

    // 记录低置信度内容数量（仅日志，不拦截）
    const lowConfCount = (text.match(/\[低置信度\]/g) || []).length
    if (lowConfCount > 0) {
      console.log(`[check] 用户 ${userId} 提交的内容包含 ${lowConfCount} 处低置信度标记，继续分析`)
    }

    // 检查使用限额
    const limitCheck = dbClient.userLimits.canGenerate(userId)
    if (!limitCheck.can) {
      return NextResponse.json(
        { error: '免费次数已用完，开通会员可无限使用', code: 'NO_QUOTA', needPurchase: true },
        { status: 403 }
      )
    }

    // 任务 3: 题库匹配
    const paperMatch = matchPaper(text)
    if (!paperMatch.matched) {
    } else {
    }

    // 1. AI 学情分析
    const report = await analyzeHomework(text, subject)
    const html = renderReportHTML(report)

    // 2. 根据薄弱点生成个性化练习（Phase 2.1: 传入原始文本做题型锚定；任务2: 难度锚定）
    let exercises = null
    if (generateExerciseSet || report.wrong > 0) {
      try {
        const sourceDifficulty = report.questions[0]?.difficulty || '基础'
        exercises = await generateExercises(report.weakPoints, report.moduleScores, subject)
      } catch (e) {
      }
    }

    // 3. 扣减免费次数（仅限免费用户）
    if (limitCheck.type === 'free') {
      dbClient.userLimits.decrementFree(userId)
      // 检查额度是否已用完
      const updatedLimit = dbClient.userLimits.findByUserId(userId)
      if (updatedLimit && updatedLimit.freeCount <= 0) {
        const user = dbClient.users.findById(userId)
        if (user) {
          emitFreeQuotaExhausted(userId, user.openid)
        }
      }
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
      // 授予用户访问权限
      dbClient.userReportAccess.grantAccess(userId, record.id)

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
    }

    return NextResponse.json({
      success: true,
      report,
      html,
      exercises,
      reportId,
      paperMatch,
      freeCount: Math.max(0, (limitCheck.freeCount ?? 0) - (limitCheck.type === 'free' ? 1 : 0)),
    })
  } catch (error: any) {
    const msg = error.message || '分析失败，请稍后重试'
    // 业务校验错误返回 400，系统错误返回 500
    const status = msg.includes('识别结果异常') || msg.includes('作业内容') ? 400 : 500
    return NextResponse.json({ error: msg }, { status })
  }
}
