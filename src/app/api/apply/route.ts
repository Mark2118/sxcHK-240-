import { NextRequest, NextResponse } from 'next/server'
import { dbClient } from '@/lib/db'
import { emitApplicationSubmitted } from '@/lib/marketing'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { company, contactName, phone, email, problem } = body

    // 校验
    if (!company || !company.trim()) {
      return NextResponse.json({ error: '请填写公司名称' }, { status: 400 })
    }
    if (!contactName || !contactName.trim()) {
      return NextResponse.json({ error: '请填写联系人姓名' }, { status: 400 })
    }
    if (!phone || !phone.trim()) {
      return NextResponse.json({ error: '请填写联系电话' }, { status: 400 })
    }
    // 简单手机号校验
    if (!/^1[3-9]\d{9}$/.test(phone.trim())) {
      return NextResponse.json({ error: '手机号格式不正确' }, { status: 400 })
    }

    // 写入数据库
    const app = await dbClient.applications.create({
      company: company.trim(),
      contactName: contactName.trim(),
      phone: phone.trim(),
      email: email?.trim(),
      problem: problem?.trim(),
    })

    // 触发营销事件（飞书/n8n 通知）
    emitApplicationSubmitted(app.id, app.company, app.contactName, app.phone, app.email, app.problem)

    return NextResponse.json({
      success: true,
      applicationId: app.id,
      message: '申请已提交，请扫描下方二维码支付 ¥500 押金锁定名额',
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || '提交失败，请稍后重试' },
      { status: 500 }
    )
  }
}
