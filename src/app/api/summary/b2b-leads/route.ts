import { NextRequest, NextResponse } from 'next/server'
import Database from 'better-sqlite3'
import path from 'path'

export const dynamic = 'force-dynamic'

const MASTER_KEY = 'xsc-admin-2026'

interface ApplicationRow {
  id: string
  company: string
  contactName: string
  phone: string
  email: string | null
  problem: string | null
  status: string
  createdAt: string
  updatedAt: string
}

interface InstitutionRow {
  id: string
  name: string
  type: string
  contact: string
  phone: string
  email: string | null
  plan: string
  expiresAt: string | null
  createdAt: string
}

export async function GET(req: NextRequest) {
  try {
    const apiKey = req.headers.get('x-master-key')
    if (apiKey !== MASTER_KEY) {
      return NextResponse.json({ success: false, error: '未授权访问' }, { status: 403 })
    }

    const dbPath = process.env.DATABASE_URL?.replace('file:', '') || path.join(process.cwd(), 'data', 'wingo-xsc.db')
    const db = new Database(dbPath)

    // 待处理试用申请
    const applications = db.prepare(`
      SELECT
        id,
        company,
        contact_name as contactName,
        phone,
        email,
        problem,
        status,
        created_at as createdAt,
        updated_at as updatedAt
      FROM applications
      WHERE status = 'pending'
      ORDER BY created_at DESC
    `).all() as ApplicationRow[]

    // 试用即将到期/已到期的机构
    const expiringInstitutions = db.prepare(`
      SELECT
        id,
        name,
        type,
        contact,
        phone,
        email,
        plan,
        expires_at as expiresAt,
        created_at as createdAt
      FROM institutions
      WHERE plan = 'trial'
        AND (expires_at IS NULL OR expires_at <= datetime('now', '+7 days'))
      ORDER BY expires_at ASC
    `).all() as InstitutionRow[]

    db.close()

    return NextResponse.json({
      success: true,
      data: {
        pendingApplications: {
          count: applications.length,
          items: applications.map((r) => ({
            id: r.id,
            company: r.company,
            contactName: r.contactName,
            phone: r.phone,
            email: r.email,
            problem: r.problem,
            status: r.status,
            createdAt: r.createdAt,
          })),
        },
        expiringInstitutions: {
          count: expiringInstitutions.length,
          items: expiringInstitutions.map((r) => ({
            id: r.id,
            name: r.name,
            type: r.type,
            contact: r.contact,
            phone: r.phone,
            email: r.email,
            plan: r.plan,
            expiresAt: r.expiresAt,
          })),
        },
      },
    })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || '查询失败' }, { status: 500 })
  }
}
