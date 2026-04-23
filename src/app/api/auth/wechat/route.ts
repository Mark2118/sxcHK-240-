import { NextRequest, NextResponse } from 'next/server'
import { dbClient } from '@/lib/db'
import { createToken } from '@/lib/auth'
import { emitUserRegistered } from '@/lib/marketing'

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'

/**
 * GET /api/auth/wechat
 * 香港版：匿名自动登录（无需微信授权）
 */
export async function GET(req: NextRequest) {
  try {
    // 生成匿名用户标识
    const anonymousId = 'anon_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8)
    let user = dbClient.users.findByOpenid(anonymousId)
    let isNewUser = false

    if (!user) {
      user = dbClient.users.create(anonymousId, undefined, '用户' + Math.floor(Math.random() * 10000), undefined)
      isNewUser = true
    }

    // 触发新用户注册事件
    if (isNewUser) {
      emitUserRegistered(user.id, user.openid || anonymousId, user.nickname)
    }

    // 生成 JWT
    const token = await createToken({ userId: user.id, openid: user.openid || anonymousId })

    // 重定向到 analyze 页面并带上 token
    const redirectUrl = req.nextUrl.searchParams.get('redirect') || '/analyze'
    const response = NextResponse.redirect(`${BASE_URL}${redirectUrl}?token=${token}`)
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
 * 香港版：匿名登录（保留兼容，前端直接调用）
 */
export async function POST(req: NextRequest) {
  try {
    const anonymousId = 'anon_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8)
    let user = dbClient.users.findByOpenid(anonymousId)
    let isNewUser = false

    if (!user) {
      user = dbClient.users.create(anonymousId, undefined, '用户' + Math.floor(Math.random() * 10000), undefined)
      isNewUser = true
    }

    if (isNewUser) {
      emitUserRegistered(user.id, user.openid || anonymousId, user.nickname)
    }

    const token = await createToken({ userId: user.id, openid: user.openid || anonymousId })
    return NextResponse.json({
      success: true,
      token,
      user: {
        id: user.id,
        openid: user.openid || anonymousId,
        nickname: user.nickname || '用户',
        avatar: user.avatar,
      }
    })
  } catch (error: any) {
    return NextResponse.json({ error: '登录处理失败' }, { status: 500 })
  }
}
