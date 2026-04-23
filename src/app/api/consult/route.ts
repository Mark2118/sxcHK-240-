import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { dbClient } from '@/lib/db'
import { emitConsultationCompleted } from '@/lib/marketing'

const OPENMAIC_URL = process.env.OPENMAIC_URL || 'http://localhost:3001'
const DIFY_URL = process.env.DIFY_URL || 'http://localhost:8080'

const L3_KEYWORDS = ['报班', '小升初', '学习规划', 'B端', '演示', '收费', '机构']
const L2_KEYWORDS = ['报告', '额度', '会员', '退款', '怎么用', '上传', '拍照', '次数', '价格']

function classifyLevel(question: string): 'L1' | 'L2' | 'L3' {
  const q = question.toLowerCase()
  if (L3_KEYWORDS.some(k => q.includes(k))) return 'L3'
  if (L2_KEYWORDS.some(k => q.includes(k))) return 'L2'
  return 'L1'
}

function calculateLeadScore(question: string, level: string, openmaicReply?: string): number {
  let score = level === 'L3' ? 5 : level === 'L2' ? 3 : 1
  const q = question.toLowerCase()
  if (['B端', '演示', '收费', '机构'].some(k => q.includes(k))) score += 3
  if (['报班', '小升初', '学习规划'].some(k => q.includes(k))) score += 2
  if (question.length > 20) score += 1
  if (openmaicReply && openmaicReply.length > 100) score += 1
  return Math.min(10, Math.max(1, score))
}

function generateFollowUpSuggestion(score: number): string {
  if (score >= 8) return '立即跟进：高意向线索，建议24小时内人工联系'
  if (score >= 5) return '3天后自动跟进：发送案例或优惠信息'
  return '7天后自动跟进：保持轻度触达'
}

export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '') || req.cookies.get('auth-token')?.value
    if (!token) return NextResponse.json({ error: '未登录' }, { status: 401 })
    const payload = await verifyToken(token)
    if (!payload?.userId) return NextResponse.json({ error: '登录已过期' }, { status: 401 })

    const body = await req.json()
    const { question, context } = body
    // 优先使用 body 中的 userId，否则从 token 获取
    const userId = body.userId || payload.userId
    if (!question || !userId) {
      return NextResponse.json({ error: '参数错误：缺少 question 或 userId' }, { status: 400 })
    }

    const level = classifyLevel(question)
    let answer = ''
    let leadScore = 1

    if (level === 'L1') {
      answer = `您的问题已收到。常见疑问可通过 WinGo 智能客服自助解决：${DIFY_URL}/chat。如需人工帮助，请继续留言。`
      leadScore = 1
    } else if (level === 'L2') {
      answer = `您的问题属于进阶咨询，建议查看 WinGo 帮助中心相关文章。如果未能解决，我们的学情顾问将在工作时间内为您回复。当前问题已记录，会尽快处理。`
      leadScore = calculateLeadScore(question, level)
    } else {
      // L3: 调用 OpenMAIC
      let openmaicReply = ''
      try {
        const res = await fetch(`${OPENMAIC_URL}/api/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            question,
            context: context || '',
            userId,
            source: 'xsc-consult',
          }),
          signal: AbortSignal.timeout(15000),
        })
        if (res.ok) {
          const data = await res.json()
          openmaicReply = data.reply || data.answer || data.content || ''
        }
      } catch {
        // OpenMAIC 不可用，使用本地回复
      }

      if (!openmaicReply) {
        openmaicReply = `感谢您咨询 WinGo 学情引擎。根据您的描述，这是一个需要深度分析的学情问题。\n\n【WinGo 建议】\n1. 使用学情分析功能上传近期作业，获取薄弱点诊断\n2. 基于诊断结果，系统会自动生成针对性的学习建议\n3. 如需一对一学情规划，可预约专业顾问\n\n您现在就可以上传作业开始分析。`
      }

      answer = openmaicReply
      leadScore = calculateLeadScore(question, level, openmaicReply)
    }

    const followUpSuggestion = generateFollowUpSuggestion(leadScore)

    // 保存到数据库
    const record = dbClient.consultations.create({
      userId,
      question,
      answer,
      level,
      leadScore,
      status: 'open',
      followUpAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    })

    // 获取用户信息用于推送
    const user = dbClient.users.findById(userId)
    if (user) {
      emitConsultationCompleted(userId, user.openid, record.id, level, leadScore, question)
    }

    return NextResponse.json({
      success: true,
      data: {
        id: record.id,
        level,
        answer,
        leadScore,
        followUpSuggestion,
        status: record.status,
        createdAt: record.createdAt,
      },
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || '处理失败' }, { status: 500 })
  }
}
