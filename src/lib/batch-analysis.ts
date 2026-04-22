/**
 * B端批量分析引擎
 * 接收全班作业，逐个 OCR+AI 分析，汇总班级学情
 */

import { submitCorrectTask, pollCorrectResult, correctResultToText } from './correct'
import { cutPaper, paperCutToText } from './paper'
import { analyzeHomework } from './ai'

export interface StudentAnalysis {
  studentName: string
  imageIndex: number
  score: number
  totalQuestions: number
  correct: number
  wrong: number
  weakPoints: string[]
  moduleScores: Array<{ module: string; scoreRate: number }>
  rawText: string
}

export interface BatchSummary {
  totalStudents: number
  avgScore: number
  classWeakPoints: Array<{ name: string; count: number; affectedStudents: number }>
  moduleAvg: Array<{ module: string; avgRate: number }>
  studentRank: Array<{ name: string; score: number; rank: number }>
}

/**
 * 处理单张作业图片
 */
export async function analyzeSingleImage(
  imageBase64: string,
  subject: string = 'math'
): Promise<StudentAnalysis | null> {
  try {
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '')

    // 1. 试卷切题
    const paperCut = await cutPaper(base64Data).catch(() => null)

    // 2. 提交批改任务
    const taskId = await submitCorrectTask(base64Data)
    if (!taskId) {
      throw new Error('批改服务未返回任务ID')
    }

    // 3. 轮询批改结果（8次×2秒=16秒，3张=48秒，安全）
    const correctResult = await pollCorrectResult(taskId, 8, 2000)

    // 4. 合并文本
    let analysisText = ''
    if (paperCut && paperCut.questions.length > 0) {
      const lines: string[] = []
      lines.push(`学科: ${correctResult.subject || subject}`)
      lines.push(`共识别 ${paperCut.questions.length} 道题`)
      lines.push('')
      for (let i = 0; i < paperCut.questions.length; i++) {
        const q = paperCut.questions[i]
        const cr = correctResult.questions[i]
        lines.push(`第${i + 1}题`)
        if (q.stem) lines.push(`  题干: ${q.stem}`)
        if (q.answer) lines.push(`  学生答案: ${q.answer}`)
        if (cr) {
          const resultMap: Record<number, string> = { 0: '未批', 1: '正确', 2: '错误', 3: '未作答' }
          lines.push(`  批改结果: ${resultMap[cr.correctResult] || '未知'}`)
          if (cr.slots?.[0]?.reason) lines.push(`  原因: ${cr.slots[0].reason}`)
        }
        lines.push('')
      }
      analysisText = lines.join('\n')
    } else {
      analysisText = correctResultToText(correctResult)
    }

    // 5. AI 分析
    const fullText = `【客观批改数据】\n${analysisText}\n\n请基于以上客观数据，生成专业学情分析报告。注意：以上对错判断来自 WinGo 智能批改系统，是客观事实。你的任务是分析薄弱点、给出学习建议。`
    const report = await analyzeHomework(fullText, subject)

    return {
      studentName: `学生${Math.floor(Math.random() * 100)}`, // 占位，后续关联 student 表
      imageIndex: 0,
      score: report.score,
      totalQuestions: report.totalQuestions,
      correct: report.correct,
      wrong: report.wrong,
      weakPoints: report.weakPoints || [],
      moduleScores: report.moduleScores || [],
      rawText: analysisText,
    }
  } catch (e: any) {
    console.error('单张分析失败:', e.message)
    return null
  }
}

/**
 * 批量处理并汇总
 * 限制最多 3 张，避免超时（单张最多16秒轮询）
 */
export async function processBatch(
  images: string[],
  subject: string = 'math'
): Promise<{ students: StudentAnalysis[]; summary: BatchSummary }> {
  const limit = Math.min(images.length, 3)
  const results: StudentAnalysis[] = []

  for (let i = 0; i < limit; i++) {
    const result = await analyzeSingleImage(images[i], subject)
    if (result) {
      result.studentName = `学生${i + 1}`
      result.imageIndex = i
      results.push(result)
    }
  }

  // 汇总
  const summary = summarizeBatch(results)
  return { students: results, summary }
}

function summarizeBatch(students: StudentAnalysis[]): BatchSummary {
  if (students.length === 0) {
    return { totalStudents: 0, avgScore: 0, classWeakPoints: [], moduleAvg: [], studentRank: [] }
  }

  const totalStudents = students.length
  const avgScore = Math.round(students.reduce((s, st) => s + st.score, 0) / totalStudents)

  // 薄弱点统计
  const wpMap: Record<string, { count: number; students: Set<string> }> = {}
  for (const st of students) {
    for (const wp of st.weakPoints) {
      if (!wpMap[wp]) wpMap[wp] = { count: 0, students: new Set() }
      wpMap[wp].count++
      wpMap[wp].students.add(st.studentName)
    }
  }
  const classWeakPoints = Object.entries(wpMap)
    .map(([name, data]) => ({ name, count: data.count, affectedStudents: data.students.size }))
    .sort((a, b) => b.count - a.count)

  // 模块平均分
  const modMap: Record<string, number[]> = {}
  for (const st of students) {
    for (const m of st.moduleScores) {
      if (!modMap[m.module]) modMap[m.module] = []
      modMap[m.module].push(m.scoreRate)
    }
  }
  const moduleAvg = Object.entries(modMap)
    .map(([module, rates]) => ({
      module,
      avgRate: Math.round(rates.reduce((a, b) => a + b, 0) / rates.length),
    }))
    .sort((a, b) => b.avgRate - a.avgRate)

  // 学生排名
  const studentRank = students
    .map(s => ({ name: s.studentName, score: s.score, rank: 0 }))
    .sort((a, b) => b.score - a.score)
    .map((s, i) => ({ ...s, rank: i + 1 }))

  return { totalStudents, avgScore, classWeakPoints, moduleAvg, studentRank }
}
