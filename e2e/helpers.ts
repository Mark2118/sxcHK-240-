/**
 * E2E 测试辅助函数
 */

export const BASE_URL = 'http://localhost:3000'
export const MASTER_KEY = 'xsc-admin-2026'

export async function getAuthToken(): Promise<string> {
  const res = await fetch(`${BASE_URL}/xsc/api/auth/wechat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code: 'test_debug_token' }),
  })
  const data = await res.json()
  if (!data.token) throw new Error(`Login failed: ${JSON.stringify(data)}`)
  return data.token
}

export async function apiGet(path: string, token?: string, masterKey?: string) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`
  if (masterKey) headers['x-master-key'] = masterKey
  const res = await fetch(`${BASE_URL}${path}`, { headers })
  return { status: res.status, body: await res.json().catch(() => null) }
}

export async function apiPost(path: string, body: unknown, token?: string, masterKey?: string) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`
  if (masterKey) headers['x-master-key'] = masterKey
  const res = await fetch(`${BASE_URL}${path}`, { method: 'POST', headers, body: JSON.stringify(body) })
  return { status: res.status, body: await res.json().catch(() => null) }
}
