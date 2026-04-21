import { NextRequest, NextResponse } from 'next/server'
import { dbClient } from '@/lib/db'
import { verifyToken } from '@/lib/auth'

export const dynamic = 'force-dynamic'

/**
 * 构建预览版报告（隐藏详细分析和练习）
 */
function buildPreview(record: any) {
  return {
    id: record.id,
    subject: record.subject,
    score: record.score,
    totalQuestions: record.totalQuestions,
    correct: record.correct,
    wrong: record.wrong,
    createdAt: record.createdAt,
    isPreview: true,
    previewMessage: '登录并解锁后可查看完整学情分析、薄弱点诊断和专项练习',
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    const list = searchParams.get('list')

    // 列表模式：返回用户的历史报告
    if (list === '1') {
      const token = req.headers.get('authorization')?.replace('Bearer ', '')
      if (!token) {
        return NextResponse.json({ error: '请先登录' }, { status: 401 })
      }
      const payload = await verifyToken(token)
      if (!payload?.userId) {
        return NextResponse.json({ error: '登录已过期' }, { status: 401 })
      }
      const reports = await dbClient.check.findByUserId(payload.userId as string)
      return NextResponse.json({ success: true, reports })
    }

    if (!id) {
      return NextResponse.json({ error: '缺少报告ID' }, { status: 400 })
    }

    const record = await dbClient.check.findById(id)

    if (!record) {
      return NextResponse.json({ error: '报告不存在' }, { status: 404 })
    }

    // 解析报告数据
    let report = null
    let exercises = null
    try {
      report = JSON.parse(record.reportJson)
    } catch {
      report = null
    }
    try {
      if (record.exercisesJson) {
        exercises = JSON.parse(record.exercisesJson)
      }
    } catch {
      exercises = null
    }

    // 获取当前用户
    const token = req.headers.get('authorization')?.replace('Bearer ', '')
    let userId: string | null = null
    if (token) {
      const payload = await verifyToken(token)
      if (payload?.userId) {
        userId = payload.userId as string
      }
    }

    // 未登录用户 → 只能看预览
    if (!userId) {
      return NextResponse.json({
        success: true,
        ...buildPreview(record),
      })
    }

    // 检查该用户是否有权限查看完整报告
    // 条件1：报告是自己的（userId 匹配）或报告是未关联的历史报告
    const isOwner = !record.userId || record.userId === userId

    if (!isOwner) {
      // 不是自己的报告，只能看预览
      return NextResponse.json({
        success: true,
        ...buildPreview(record),
      })
    }

    // 条件2：是否已经解锁过
    const hasAccess = dbClient.userReportAccess.hasAccess(userId, id)

    if (hasAccess) {
      // 已解锁，返回完整报告
      return NextResponse.json({
        success: true,
        id: record.id,
        subject: record.subject,
        score: record.score,
        totalQuestions: record.totalQuestions,
        correct: record.correct,
        wrong: record.wrong,
        ocrText: record.ocrText,
        createdAt: record.createdAt,
        report,
        html: record.html,
        exercises,
        isPreview: false,
      })
    }

    // 未解锁，检查是否有额度
    const permission = dbClient.userLimits.canViewFullReport(userId)

    if (!permission.can) {
      // 无权限，返回预览版
      return NextResponse.json({
        success: true,
        ...buildPreview(record),
        needPurchase: true,
        freeCount: permission.freeCount,
        memberType: permission.type,
      })
    }

    // 有权限，解锁并扣减次数（仅限免费额度，会员不扣）
    if (permission.type === 'free') {
      dbClient.userLimits.useFreeQuota(userId)
    }
    dbClient.userReportAccess.grantAccess(userId, id)

    return NextResponse.json({
      success: true,
      id: record.id,
      subject: record.subject,
      score: record.score,
      totalQuestions: record.totalQuestions,
      correct: record.correct,
      wrong: record.wrong,
      ocrText: record.ocrText,
      createdAt: record.createdAt,
      report,
      html: record.html,
      exercises,
      isPreview: false,
      unlockedWith: permission.type,
      freeCount: permission.type === 'free' ? permission.freeCount - 1 : permission.freeCount,
    })
  } catch (error: any) {
    console.error('报告查询错误:', error)
    return NextResponse.json(
      { error: error.message || '查询失败' },
      { status: 500 }
    )
  }
}
