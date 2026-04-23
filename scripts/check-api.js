/**
 * API连通性检查 — 百度OCR + MiniMax AI
 * 用法: node scripts/check-api.js
 */

async function checkBaidu() {
  const key = process.env.BAIDU_API_KEY
  const secret = process.env.BAIDU_SECRET_KEY
  if (!key || !secret) {
    console.log('[✗] 百度API: 环境变量未配置 (BAIDU_API_KEY / BAIDU_SECRET_KEY)')
    return false
  }
  try {
    const res = await fetch(`https://aip.baidubce.com/oauth/2.0/token?grant_type=client_credentials&client_id=${key}&client_secret=${secret}`, { method: 'POST' })
    const data = await res.json()
    if (data.access_token) {
      console.log('[✓] 百度API: 连通正常 (Token获取成功)')
      return true
    }
    console.log('[✗] 百度API: ' + (data.error_description || '未知错误'))
    return false
  } catch (e) {
    console.log('[✗] 百度API: 网络错误 (' + e.message + ')')
    return false
  }
}

async function checkMiniMax() {
  const key = process.env.AI_API_KEY
  const base = process.env.AI_BASE_URL
  if (!key || !base) {
    console.log('[✗] MiniMax: 环境变量未配置 (AI_API_KEY / AI_BASE_URL)')
    return false
  }
  try {
    const res = await fetch(`${base}/chat/completions`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: process.env.AI_MODEL || 'MiniMax-M2.7-highspeed', messages: [{ role: 'user', content: '你好' }], max_tokens: 10 }),
    })
    if (res.ok) {
      console.log('[✓] MiniMax: 连通正常 (API响应200)')
      return true
    }
    const text = await res.text()
    console.log('[✗] MiniMax: HTTP ' + res.status + ' ' + text.slice(0, 100))
    return false
  } catch (e) {
    console.log('[✗] MiniMax: 网络错误 (' + e.message + ')')
    return false
  }
}

async function main() {
  console.log('═══════════════════════════════════════')
  console.log('  API连通性检查')
  console.log('═══════════════════════════════════════')
  const baidu = await checkBaidu()
  const minimax = await checkMiniMax()
  console.log('')
  if (baidu && minimax) {
    console.log('[✓] 全部API连通正常，批量分析可用')
  } else {
    console.log('[!] 部分API异常，检查 .env.local 配置')
  }
}

main()
