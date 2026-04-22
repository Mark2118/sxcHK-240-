import { NextRequest, NextResponse } from 'next/server'
import { dbClient } from '@/lib/db'

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

  const classes = dbClient.classes.findByInstitution(institution.id)
  return NextResponse.json({ success: true, data: classes })
}

export async function POST(req: NextRequest) {
  const institution = auth(req)
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
  const institution = auth(req)
  if (!institution) return NextResponse.json({ success: false, error: 'UNAUTHORIZED' }, { status: 401 })

  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ success: false, error: 'INVALID_INPUT' }, { status: 400 })

    const cls = dbClient.classes.findById(id)
    if (!cls || cls.institutionId !== institution.id) {
      return NextResponse.json({ success: false, error: 'NOT_FOUND' }, { status: 404 })
    }

    dbClient.classes.delete(id)
    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: 'INTERNAL_ERROR', message: e.message }, { status: 500 })
  }
}
