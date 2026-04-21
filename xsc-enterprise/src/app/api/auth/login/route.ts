import { NextRequest, NextResponse } from 'next/server'
import { createToken } from '@/lib/auth'

const MASTER_KEY = process.env.MASTER_KEY || 'xsc-admin-2026'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { masterKey } = body

    if (masterKey !== MASTER_KEY) {
      return NextResponse.json({ error: '密钥错误' }, { status: 403 })
    }

    const token = await createToken({ role: 'admin', iat: Date.now() })
    return NextResponse.json({ success: true, token })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
