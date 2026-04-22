import { NextRequest, NextResponse } from 'next/server'
import { dbClient } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const apiKey = req.headers.get('x-api-key')
    const apiSecret = req.headers.get('x-api-secret')

    if (!apiKey || !apiSecret) {
      return NextResponse.json({ success: false, error: 'UNAUTHORIZED', message: '缺少认证信息' }, { status: 401 })
    }

    const institution = dbClient.institutions.findByApiKey(apiKey)
    if (!institution || institution.apiSecret !== apiSecret) {
      return NextResponse.json({ success: false, error: 'UNAUTHORIZED', message: '认证失败' }, { status: 401 })
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

export async function PATCH(req: NextRequest) {
  try {
    const apiKey = req.headers.get('x-api-key')
    const apiSecret = req.headers.get('x-api-secret')

    if (!apiKey || !apiSecret) {
      return NextResponse.json({ success: false, error: 'UNAUTHORIZED', message: '缺少认证信息' }, { status: 401 })
    }

    const institution = dbClient.institutions.findByApiKey(apiKey)
    if (!institution || institution.apiSecret !== apiSecret) {
      return NextResponse.json({ success: false, error: 'UNAUTHORIZED', message: '认证失败' }, { status: 401 })
    }

    const body = await req.json()
    const updated = dbClient.institutions.update(institution.id, {
      name: body.name,
      contact: body.contact,
      phone: body.phone,
      email: body.email,
      logo: body.logo,
      primaryColor: body.primaryColor,
      reportTemplate: body.reportTemplate,
    })

    return NextResponse.json({ success: true, data: { updated } })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: 'INTERNAL_ERROR', message: e.message }, { status: 500 })
  }
}
