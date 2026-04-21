import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    service: 'wingo-xsc',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  })
}
