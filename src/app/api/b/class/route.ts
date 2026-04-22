import { NextRequest, NextResponse } from 'next/server'
import { dbClient } from '@/lib/db'
import { authB } from '@/lib/b-auth'

export async function GET(req: NextRequest) {
  const institution = authB(req)
  if (!institution) return NextResponse.json({ success: false, error: 'UNAUTHORIZED' }, { status: 401 })

  try {
    const classes = dbClient.classes.findByInstitution(institution.id)
    return NextResponse.json({ success: true, data: classes })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: 'INTERNAL_ERROR', message: e.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const institution = authB(req)
  if (!institution) return NextResponse.json({ success: false, error: 'UNAUTHORIZED' }, { status: 401 })

  try {
    const body = await req.json()
    if (!body.name || !body.grade || !body.subject) {
      return NextResponse.json({ success: false, error: 'INVALID_INPUT', message: '请填写完整信息' }, { status: 400 })
    }
    const cls = dbClient.classes.create({
      institutionId: institution.id,
      name: body.name,
      grade: body.grade,
      subject: body.subject,
    })
    return NextResponse.json({ success: true, data: cls })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: 'INTERNAL_ERROR', message: e.message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  const institution = authB(req)
  if (!institution) return NextResponse.json({ success: false, error: 'UNAUTHORIZED' }, { status: 401 })

  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ success: false, error: 'INVALID_INPUT' }, { status: 400 })

    const cls = dbClient.classes.findById(id)
    if (!cls || cls.institutionId !== institution.id) {
      return NextResponse.json({ success: false, error: 'NOT_FOUND' }, { status: 404 })
    }

    // 级联删除：先删该班级下的学员
    const students = dbClient.students.findByClass(id)
    for (const s of students) {
      dbClient.students.delete(s.id)
    }
    dbClient.classes.delete(id)
    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: 'INTERNAL_ERROR', message: e.message }, { status: 500 })
  }
}
