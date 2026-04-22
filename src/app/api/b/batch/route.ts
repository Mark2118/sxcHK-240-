import { NextRequest, NextResponse } from 'next/server'
import { dbClient } from '@/lib/db'
import { authB } from '@/lib/b-auth'

export async function GET(req: NextRequest) {
  const institution = authB(req)
  if (!institution) return NextResponse.json({ success: false, error: 'UNAUTHORIZED' }, { status: 401 })

  const batches = dbClient.batchAnalyses.findByInstitution(institution.id)
  return NextResponse.json({ success: true, data: batches })
}

export async function POST(req: NextRequest) {
  const institution = auth(req)
  if (!institution) return NextResponse.json({ success: false, error: 'UNAUTHORIZED' }, { status: 401 })

  try {
    const body = await req.json()
    if (!body.classId || !body.total) {
      return NextResponse.json({ success: false, error: 'INVALID_INPUT', message: '请提供班级和作业数量' }, { status: 400 })
    }

    const batch = dbClient.batchAnalyses.create({
      institutionId: institution.id,
      classId: body.classId,
      total: body.total,
    })
    return NextResponse.json({ success: true, data: batch })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: 'INTERNAL_ERROR', message: e.message }, { status: 500 })
  }
}
