import { NextRequest, NextResponse } from 'next/server'
import { dbClient } from '@/lib/db'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { apiKey, apiSecret } = body

    if (!apiKey || !apiSecret) {
      return NextResponse.json({ success: false, error: 'INVALID_INPUT', message: '请输入 API Key 和 Secret' }, { status: 400 })
    }

    const institution = dbClient.institutions.findByApiKey(apiKey)
    if (!institution || institution.apiSecret !== apiSecret) {
      return NextResponse.json({ success: false, error: 'UNAUTHORIZED', message: 'API Key 或 Secret 错误' }, { status: 401 })
    }

    return NextResponse.json({
      success: true,
      data: {
        id: institution.id,
        name: institution.name,
        type: institution.type,
        contact: institution.contact,
        phone: institution.phone,
        email: institution.email,
        logo: institution.logo,
        primaryColor: institution.primaryColor,
        reportTemplate: institution.reportTemplate,
        plan: institution.plan,
        expiresAt: institution.expiresAt,
      },
    })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: 'INTERNAL_ERROR', message: e.message }, { status: 500 })
  }
}
