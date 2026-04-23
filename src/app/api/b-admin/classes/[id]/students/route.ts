import { NextRequest, NextResponse } from 'next/server'
import { authB } from '@/lib/b-auth'
import { dbClient } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const institution = authB(req)
  if (!institution) return NextResponse.json({ success: false, error: 'UNAUTHORIZED' }, { status: 401 })

  try {
    const { id } = params
    const cls = dbClient.classes.findById(id)
    if (!cls || cls.institutionId !== institution.id) {
      return NextResponse.json({ success: false, error: 'NOT_FOUND' }, { status: 404 })
    }

    const students = dbClient.students.findByClass(id)
    const enriched = await Promise.all(
      students.map(async (s) => {
        let latestScore: number | null = null
        let weakPoints: string[] = []
        let analysisCount = 0

        if (s.parentUserId) {
          const reports = await dbClient.check.findByUserId(s.parentUserId, 10)
          analysisCount = reports.length
          if (reports.length > 0) {
            latestScore = reports[0].score
            try {
              const report = JSON.parse(reports[0].reportJson)
              weakPoints = (report.weakPoints || []).slice(0, 3)
            } catch {}
          }
        }

        return {
          id: s.id,
          name: s.name,
          latestScore,
          weakPoints,
          analysisCount,
          createdAt: s.createdAt,
        }
      })
    )

    return NextResponse.json({ success: true, data: enriched })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: 'INTERNAL_ERROR', message: e.message }, { status: 500 })
  }
}
