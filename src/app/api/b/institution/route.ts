import { NextRequest, NextResponse } from 'next/server'
import { dbClient } from '@/lib/db'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, type, contact, phone, email } = body

    if (!name || !type || !contact || !phone) {
      return NextResponse.json({ success: false, error: 'INVALID_INPUT', message: '请填写完整信息' }, { status: 400 })
    }

    const institution = dbClient.institutions.create({ name, type, contact, phone, email })
    return NextResponse.json({
      success: true,
      data: {
        id: institution.id,
        name: institution.name,
        type: institution.type,
        apiKey: institution.apiKey,
        apiSecret: institution.apiSecret,
      },
    })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: 'INTERNAL_ERROR', message: e.message }, { status: 500 })
  }
}
