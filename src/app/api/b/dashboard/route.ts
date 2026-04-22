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

    // 按班级统计
    const classStats = classes.map(cls => {
      const classStudents = students.filter(s => s.classId === cls.id)
      const classBatches = batches.filter(b => b.classId === cls.id)

      // 解析批量分析结果
      let avgScore = 0
      let weakPointList: Array<{ name: string; count: number }> = []
      let moduleList: Array<{ module: string; avgRate: number }> = []

      for (const batch of classBatches) {
        if (batch.results) {
          try {
            const data = JSON.parse(batch.results)
            if (data.summary) {
              avgScore = data.summary.avgScore || 0
              if (data.summary.classWeakPoints) {
                weakPointList = data.summary.classWeakPoints
              }
              if (data.summary.moduleAvg) {
                moduleList = data.summary.moduleAvg
              }
            }
          } catch {}
        }
      }

      return {
        id: cls.id,
        name: cls.name,
        grade: cls.grade,
        subject: cls.subject,
        studentCount: classStudents.length,
        batchCount: classBatches.length,
        avgScore,
        weakPoints: weakPointList.slice(0, 5),
        moduleScores: moduleList,
      }
    })

    // 全局薄弱点 TOP10
    const globalWeakMap: Record<string, { count: number; classes: Set<string> }> = {}
    for (const batch of batches) {
      if (!batch.results) continue
      try {
        const data = JSON.parse(batch.results)
        for (const wp of data.summary?.classWeakPoints || []) {
          if (!globalWeakMap[wp.name]) globalWeakMap[wp.name] = { count: 0, classes: new Set() }
          globalWeakMap[wp.name].count += wp.count
          globalWeakMap[wp.name].classes.add(batch.classId)
        }
      } catch {}
    }
    const globalWeakPoints = Object.entries(globalWeakMap)
      .map(([name, data]) => ({ name, count: data.count, classCount: data.classes.size }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

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
        globalWeakPoints,
      },
    })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: 'INTERNAL_ERROR', message: e.message }, { status: 500 })
  }
}
