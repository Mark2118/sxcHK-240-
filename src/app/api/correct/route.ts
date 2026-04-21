import { NextRequest, NextResponse } from 'next/server'
import { submitCorrectTask, pollCorrectResult, correctResultToText } from '@/lib/correct'
import { cutPaper, paperCutToText } from '@/lib/paper'
import { analyzeHomework } from '@/lib/ai'
import { renderReportHTML } from '@/lib/report'
import { generateExercises } from '@/lib/exercises'
import { dbClient } from '@/lib/db'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { imageBase64, subject = 'math', generateExerciseSet = false } = body

    if (!imageBase64) {
      return NextResponse.json({ error: '缺少图片数据' }, { status: 400 })
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
      // 用切题结构化的数据
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
      // 降级：只用 correct_edu 的文本
      analysisText = correctResultToText(correctResult)
    }

    // 4. AI 深度分析（基于客观批改数据生成学情报告）
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

    // 6. 保存到数据库
    let reportId: string | null = null
    try {
      const record = await dbClient.check.create({
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
    })
  } catch (error: any) {
    console.error('智能批改错误:', error)
    return NextResponse.json(
      { error: error.message || '批改失败，请稍后重试' },
      { status: 500 }
    )
  }
}
