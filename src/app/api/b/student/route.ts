import { NextRequest, NextResponse } from 'next/server'
import { dbClient } from '@/lib/db'
import { authB } from '@/lib/b-auth'

export async function GET(req: NextRequest) {
  const institution = authB(req)
  if (!institution) return NextResponse.json({ success: false, error: 'UNAUTHORIZED' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const classId = searchParams.get('classId')

  if (classId) {
    const students = dbClient.students.findByClass(classId)
    return NextResponse.json({ success: true, data: students })
  }

  const students = dbClient.students.findByInstitution(institution.id)
  return NextResponse.json({ success: true, data: students })
}

export async function POST(req: NextRequest) {
  const institution = authB(req)
  if (!institution) return NextResponse.json({ success: false, error: 'UNAUTHORIZED' }, { status: 401 })

  try {
    const body = await req.json()
    if (!body.name || !body.classId) {
      return NextResponse.json({ success: false, error: 'INVALID_INPUT', message: '请填写姓名和班级' }, { status: 400 })
    }

    const cls = dbClient.classes.findById(body.classId)
    if (!cls || cls.institutionId !== institution.id) {
      return NextResponse.json({ success: false, error: 'NOT_FOUND', message: '班级不存在' }, { status: 404 })
    }

    const student = dbClient.students.create({
      institutionId: institution.id,
      classId: body.classId,
      name: body.name,
      parentUserId: body.parentUserId,
    })
    return NextResponse.json({ success: true, data: student })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: 'INTERNAL_ERROR', message: e.message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  const institution = auth(req)
  if (!institution) return NextResponse.json({ success: false, error: 'UNAUTHORIZED' }, { status: 401 })

  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ success: false, error: 'INVALID_INPUT' }, { status: 400 })

    const student = dbClient.students.findByInstitution(institution.id).find(s => s.id === id)
    if (!student) return NextResponse.json({ success: false, error: 'NOT_FOUND' }, { status: 404 })

    dbClient.students.delete(id)
    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: 'INTERNAL_ERROR', message: e.message }, { status: 500 })
  }
}
