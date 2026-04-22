import { NextRequest, NextResponse } from 'next/server'
import { dbClient } from '@/lib/db'
import { processBatch } from '@/lib/batch-analysis'

function auth(req: NextRequest) {
  const apiKey = req.headers.get('x-api-key')
  const apiSecret = req.headers.get('x-api-secret')
  if (!apiKey || !apiSecret) return null
  const inst = dbClient.institutions.findByApiKey(apiKey)
  if (!inst || inst.apiSecret !== apiSecret) return null
  return inst
}

export async function GET(req: NextRequest) {
  const institution = auth(req)
  if (!institution) return NextResponse.json({ success: false, error: 'UNAUTHORIZED' }, { status: 401 })

  const batches = dbClient.batchAnalyses.findByInstitution(institution.id)
  return NextResponse.json({ success: true, data: batches })
}

export async function POST(req: NextRequest) {
  const institution = auth(req)
  if (!institution) return NextResponse.json({ success: false, error: 'UNAUTHORIZED' }, { status: 401 })

  try {
    const body = await req.json()
    const { classId, images, subject = 'math' } = body

    if (!classId || !images || !Array.isArray(images) || images.length === 0) {
      return NextResponse.json({ success: false, error: 'INVALID_INPUT', message: '请提供班级ID和作业图片' }, { status: 400 })
    }

    if (images.length > 5) {
      return NextResponse.json({ success: false, error: 'INVALID_INPUT', message: '单次最多处理5份作业' }, { status: 400 })
    }

    // 创建批量分析记录
    const batch = dbClient.batchAnalyses.create({
      institutionId: institution.id,
      classId,
      total: images.length,
    })

    // 执行批量分析
    const { students, summary } = await processBatch(images, subject)

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
    console.error('批量分析错误:', e)
    return NextResponse.json({ success: false, error: 'INTERNAL_ERROR', message: e.message }, { status: 500 })
  }
}
