import { NextRequest, NextResponse } from 'next/server'
import { dbClient } from '@/lib/db'
import { createToken } from '@/lib/auth'
import { emitUserRegistered } from '@/lib/marketing'

const WXAPP_APP_ID = process.env.WXAPP_APP_ID || process.env.WECHAT_APP_ID || ''
const WXAPP_APP_SECRET = process.env.WXAPP_APP_SECRET || process.env.WECHAT_APP_SECRET || ''

export async function POST(req: NextRequest) {
  try {
    const { code } = await req.json()
    if (!code) {
      return NextResponse.json({ error: '缺少 code 参数' }, { status: 400 })
    }

    let openid = ''
    let unionid = ''

    if (!WXAPP_APP_ID || !WXAPP_APP_SECRET) {
      // 开发模式：mock 登录
      openid = 'wxapp_mock_' + code.slice(0, 8)
    } else {
      const url = `https://api.weixin.qq.com/sns/jscode2session?appid=${WXAPP_APP_ID}&secret=${WXAPP_APP_SECRET}&js_code=${code}&grant_type=authorization_code`
      const res = await fetch(url)
      const data = await res.json()
      if (data.errcode) {
        return NextResponse.json({ error: '微信登录失败', detail: data.errmsg }, { status: 400 })
      }
      openid = data.openid
      unionid = data.unionid || ''
    }

    // 查找或创建用户
    let user = dbClient.users.findByOpenid(openid)
    let isNewUser = false
    if (!user) {
      user = dbClient.users.create(openid, unionid || undefined, '微信用户', '')
      isNewUser = true
    }

    if (isNewUser) {
      emitUserRegistered(user.id, user.openid, user.nickname)
    }

    const token = await createToken({ userId: user.id, openid: user.openid })

    return NextResponse.json({
      success: true,
      token,
      user: {
        id: user.id,
        openid: user.openid,
        nickname: user.nickname || '微信用户',
        avatar: user.avatar || '',
      },
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || '登录失败' }, { status: 500 })
  }
}
