import { NextRequest, NextResponse } from 'next/server'
import { dbClient } from '@/lib/db'
import { createToken } from '@/lib/auth'
import { emitUserRegistered } from '@/lib/marketing'

const APP_ID = process.env.WECHAT_APP_ID
const APP_SECRET = process.env.WECHAT_APP_SECRET
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://100.106.90.55:3002'

// 开发模式：无微信配置时启用 mock 登录
const isMock = !APP_ID || !APP_SECRET

/**
 * GET /api/auth/wechat
 * 处理微信授权回调（带 code 参数）
 * 或跳转到微信授权（无 code 参数）
 */
export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams
  const code = searchParams.get('code')

  // 无 code：直接跳转到微信授权页面
  if (!code) {
    if (isMock) {
      return handleMockLogin()
    }
    const redirectUri = encodeURIComponent(`${BASE_URL}/api/auth/wechat`)
    const scope = 'snsapi_userinfo'
    const authUrl = `https://open.weixin.qq.com/connect/oauth2/authorize?appid=${APP_ID}&redirect_uri=${redirectUri}&response_type=code&scope=${scope}&state=winGo#wechat_redirect`
    return NextResponse.redirect(authUrl)
  }

  // 有 code：处理微信回调
  if (isMock) {
    return handleMockLogin()
  }

  try {
    // 1. 用 code 换 access_token + openid
    const tokenRes = await fetch(
      `https://api.weixin.qq.com/sns/oauth2/access_token?appid=${APP_ID}&secret=${APP_SECRET}&code=${code}&grant_type=authorization_code`
    )
    const tokenData = await tokenRes.json()

    if (tokenData.errcode) {
      return NextResponse.json({ error: '微信授权失败', detail: tokenData.errmsg }, { status: 400 })
    }

    const { openid, access_token } = tokenData

    // 2. 获取用户信息
    const userInfoRes = await fetch(
      `https://api.weixin.qq.com/sns/userinfo?access_token=${access_token}&openid=${openid}&lang=zh_CN`
    )
    const userInfo = await userInfoRes.json()

    if (userInfo.errcode) {
      return NextResponse.json({ error: '获取用户信息失败', detail: userInfo.errmsg }, { status: 400 })
    }

    // 3. 查找或创建用户
    let user = dbClient.users.findByOpenid(openid)
    let isNewUser = false
    if (!user) {
      user = dbClient.users.create(openid, userInfo.unionid, userInfo.nickname, userInfo.headimgurl)
      isNewUser = true
    } else {
      dbClient.users.update(user.id, {
        nickname: userInfo.nickname,
        avatar: userInfo.headimgurl,
      })
    }

    // 触发新用户注册事件
    if (isNewUser) {
      emitUserRegistered(user.id, user.openid, userInfo.nickname)
    }

    // 4. 生成 JWT
    const token = await createToken({ userId: user.id, openid: user.openid })

    // 5. 写入 cookie 并重定向到 analyze 页面
    const response = NextResponse.redirect(`${BASE_URL}/analyze`)
    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
    })
    return response

  } catch (error) {
    return NextResponse.json({ error: '登录处理失败' }, { status: 500 })
  }
}

/**
 * POST /api/auth/wechat
 * Mock 登录（开发测试用，保留兼容）
 */
export async function POST(req: NextRequest) {
  try {
    const mockOpenid = 'mock_' + Date.now()
    let user = dbClient.users.findByOpenid(mockOpenid)
    if (!user) {
      user = dbClient.users.create(mockOpenid, undefined, '测试用户', 'https://via.placeholder.com/100')
    }

    const token = await createToken({ userId: user.id, openid: user.openid })
    return NextResponse.json({
      success: true,
      token,
      user: { id: user.id, openid: user.openid, nickname: '测试用户', avatar: 'https://via.placeholder.com/100' }
    })
  } catch (error: any) {
    return NextResponse.json({ error: '登录处理失败' }, { status: 500 })
  }
}

async function handleMockLogin() {
  const mockOpenid = 'mock_' + Date.now()
  let user = dbClient.users.findByOpenid(mockOpenid)
  if (!user) {
    user = dbClient.users.create(mockOpenid, undefined, '测试用户', 'https://via.placeholder.com/100')
  }

  const token = await createToken({ userId: user.id, openid: user.openid })
  const response = NextResponse.redirect(`${BASE_URL}/analyze`)
  response.cookies.set('auth-token', token, {
    httpOnly: true,
    secure: false,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7,
  })
  return response
}
