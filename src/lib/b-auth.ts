/**
 * B端机构认证工具
 * 统一提取 auth() 函数，消除路由文件中的重复定义
 */

import { NextRequest } from 'next/server'
import { dbClient } from './db'

/**
 * 验证 B端请求的机构身份
 * @returns 认证通过的机构对象，或 null（认证失败）
 */
export function authB(req: NextRequest) {
  const apiKey = req.headers.get('x-api-key')
  const apiSecret = req.headers.get('x-api-secret')
  if (!apiKey || !apiSecret) return null

  const inst = dbClient.institutions.findByApiKey(apiKey)
  if (!inst || inst.apiSecret !== apiSecret) return null
  return inst
}

/**
 * 验证 B端请求的机构身份（严格模式，认证失败时自动返回 401）
 */
export function authBStrict(req: NextRequest) {
  const institution = authB(req)
  if (!institution) {
    return { error: true, institution: null }
  }
  return { error: false, institution }
}
