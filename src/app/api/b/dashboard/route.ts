import { NextRequest, NextResponse } from 'next/server'
import { dbClient } from '@/lib/db'
import { authB } from '@/lib/b-auth'

export async function GET(req: NextRequest) {
  const institution = authB(req)
  if (!institution) return NextResponse.json({ success: false, error: 'UNAUTHORIZED' }, { status: 401 })

  try {
    const classes = dbClient.classes.findByInstitution(institution.id)
    const students = dbClient.students.findByInstitution(institution.id)
    const batches = dbClient.batchAnalyses.findByInstitution(institution.id)

    // 按班级统计学员数
    const classStats = classes.map(cls => {
      const classStudents = students.filter(s => s.classId === cls.id)
      return {
        id: cls.id,
        name: cls.name,
        grade: cls.grade,
        subject: cls.subject,
        studentCount: classStudents.length,
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        institution: {
          id: institution.id,
          name: institution.name,
          type: institution.type,
          plan: institution.plan,
        },
        stats: {
          classCount: classes.length,
          studentCount: students.length,
          batchCount: batches.length,
          completedBatchCount: batches.filter(b => b.status === 'completed').length,
        },
        classes: classStats,
      },
    })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: 'INTERNAL_ERROR', message: e.message }, { status: 500 })
  }
}
