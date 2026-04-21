import { NextRequest, NextResponse } from 'next/server'
import { submitCorrectTask, pollCorrectResult, correctResultToText } from '@/lib/correct'
import { cutPaper, paperCutToText } from '@/lib/paper'
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
    const { imageBase64, subject = 'math', generateExerciseSet = false } = body

    if (!imageBase64) {
      return NextResponse.json({ error: '缺少图片数据' }, { status: 400 })
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

    // 检查使用限额
    const limitCheck = dbClient.userLimits.canGenerate(userId)
    if (!limitCheck.can) {
      return NextResponse.json(
        { error: '免费次数已用完，开通会员可无限使用', code: 'NO_QUOTA', needPurchase: true },
        { status: 403 }
      )
    }

    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '')

    // 1. 并行：试卷切题（同步）+ 提交批改任务（异步）
    const [paperCut, taskId] = await Promise.all([
      cutPaper(base64Data).catch((e) => {
        console.warn('切题识别失败，降级:', e.message)
        return null
      }),
      submitCorrectTask(base64Data),
    ])

    // 2. 轮询批改结果
    const correctResult = await pollCorrectResult(taskId, 15, 2000)

    // 3. 合并结构化数据
    let analysisText = ''

    if (paperCut && paperCut.questions.length > 0) {
      const lines: string[] = []
      lines.push(`学科: ${correctResult.subject || subject}`)
      lines.push(`共识别 ${paperCut.questions.length} 道题`)
      lines.push('')

      for (let i = 0; i < paperCut.questions.length; i++) {
        const q = paperCut.questions[i]
        const cr = correctResult.questions[i]

        lines.push(`第${i + 1}题 [${q.type === 'choice' ? '选择题' : q.type === 'judge' ? '判断题' : q.type === 'fill' ? '填空题' : q.type === 'qa' ? '问答题' : '其他'}]`)
        if (q.stem) lines.push(`  题干: ${q.stem}`)
        if (q.options) lines.push(`  选项: ${q.options}`)
        if (q.answer) lines.push(`  学生答案: ${q.answer}`)

        if (cr) {
          const resultMap: Record<number, string> = { 0: '未批', 1: '正确', 2: '错误', 3: '未作答' }
          lines.push(`  批改结果: ${resultMap[cr.correctResult] || '未知'}`)
          if (cr.slots && cr.slots[0]?.reason) {
            lines.push(`  原因: ${cr.slots[0].reason}`)
          }
        }
        lines.push('')
      }
      analysisText = lines.join('\n')
    } else {
      analysisText = correctResultToText(correctResult)
    }

    // 4. AI 深度分析
    const fullText = `【客观批改数据】\n${analysisText}\n\n请基于以上客观数据，生成专业学情分析报告。注意：以上对错判断来自 WinGo 智能批改系统，是客观事实。你的任务是分析薄弱点、给出学习建议、推荐练习方向。`
    const report = await analyzeHomework(fullText, subject)
    const html = renderReportHTML(report)

    // 5. 生成练习题
    let exercises = null
    if (generateExerciseSet || report.wrong > 0) {
      try {
        exercises = await generateExercises(report.weakPoints, report.moduleScores, subject)
      } catch (e) {
        console.error('练习生成失败:', e)
      }
    }

    // 6. 扣减免费次数
    if (limitCheck.type === 'free') {
      dbClient.userLimits.decrementFree(userId)
    }

    // 7. 保存到数据库
    let reportId: string | null = null
    try {
      const record = await dbClient.check.create({
        userId,
        subject,
        score: report.score,
        totalQuestions: report.totalQuestions,
        correct: report.correct,
        wrong: report.wrong,
        ocrText: analysisText,
        reportJson: JSON.stringify(report),
        html,
        exercisesJson: exercises ? JSON.stringify(exercises) : undefined,
      })
      reportId = record.id

      // 触发营销事件
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
      paperCut,
      correctResult,
      report,
      html,
      exercises,
      reportId,
      freeCount: Math.max(0, (limitCheck.freeCount ?? 0) - (limitCheck.type === 'free' ? 1 : 0)),
    })
  } catch (error: any) {
    console.error('智能批改错误:', error)
    return NextResponse.json(
      { error: error.message || '批改失败，请稍后重试' },
      { status: 500 }
    )
  }
}
