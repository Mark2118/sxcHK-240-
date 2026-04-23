import { NextRequest, NextResponse } from 'next/server'
import { dbClient } from '@/lib/db'
import { authB } from '@/lib/b-auth'
import { processBatch } from '@/lib/batch-analysis'

export async function GET(req: NextRequest) {
  const institution = authB(req)
  if (!institution) return NextResponse.json({ success: false, error: 'UNAUTHORIZED' }, { status: 401 })

  try {
    const batches = dbClient.batchAnalyses.findByInstitution(institution.id)
    return NextResponse.json({ success: true, data: batches })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: 'INTERNAL_ERROR', message: e.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const institution = authB(req)
  if (!institution) return NextResponse.json({ success: false, error: 'UNAUTHORIZED' }, { status: 401 })

  let batchId: string | null = null

  try {
    const body = await req.json()
    const { classId, images, subject = 'math' } = body

    if (!classId || !images || !Array.isArray(images) || images.length === 0) {
      return NextResponse.json({ success: false, error: 'INVALID_INPUT', message: '请提供班级ID和作业图片' }, { status: 400 })
    }

    if (images.length > 3) {
      return NextResponse.json({ success: false, error: 'INVALID_INPUT', message: '单次最多处理3份作业' }, { status: 400 })
    }

    // 验证 classId 属于当前机构
    const cls = dbClient.classes.findById(classId)
    if (!cls || cls.institutionId !== institution.id) {
      return NextResponse.json({ success: false, error: 'NOT_FOUND', message: '班级不存在' }, { status: 404 })
    }

    // 创建批量分析记录
    const batch = dbClient.batchAnalyses.create({
      institutionId: institution.id,
      classId,
      total: images.length,
    })
    batchId = batch.id

    // 执行批量分析
    const { students, summary } = await processBatch(images, subject)

    if (students.length === 0) {
      dbClient.batchAnalyses.updateStatus(batch.id, 'failed')
      return NextResponse.json({ success: false, error: 'ANALYSIS_FAILED', message: '所有作业分析失败，请检查图片质量或网络连接' }, { status: 500 })
    }

    // 更新记录
    const results = JSON.stringify({ students, summary })
    dbClient.batchAnalyses.updateProgress(batch.id, students.length, results)

    return NextResponse.json({
      success: true,
      data: {
        batchId: batch.id,
        total: images.length,
        completed: students.length,
        summary,
        students: students.map(s => ({
          name: s.studentName,
          score: s.score,
          totalQuestions: s.totalQuestions,
          correct: s.correct,
          wrong: s.wrong,
          weakPoints: s.weakPoints,
        })),
      },
    })
  } catch (e: any) {
    // 如果已创建 batch，标记为失败
    if (batchId) {
      try {
        dbClient.batchAnalyses.updateStatus(batchId, 'failed')
      } catch (updateErr) {
      }
    }
    return NextResponse.json({ success: false, error: 'INTERNAL_ERROR', message: e.message }, { status: 500 })
  }
}
