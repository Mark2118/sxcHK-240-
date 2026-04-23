/**
 * 个性化练习推荐引擎
 */

const AI_API_KEY = process.env.AI_API_KEY || process.env.MINIMAX_API_KEY || ''
const AI_BASE_URL = process.env.AI_BASE_URL || process.env.MINIMAX_BASE_URL || 'https://api.minimaxi.com/anthropic/v1'
const AI_MODEL = process.env.AI_MODEL || 'MiniMax-M2.7-highspeed'

export interface Exercise {
  no: number
  type: string
  content: string
  answer: string
  analysis: string
  difficulty: string
  knowledgePoint: string
}

export interface ExerciseSet {
  title: string
  description: string
  exercises: Exercise[]
  summary: string
}

function buildPrompt(weakPoints: string[], moduleScores: any[], subject: string): string {
  const weak = moduleScores.filter((m) => m.status === '需关注' || m.status === '提升中').map((m) => `${m.module}(${m.scoreRate}%)`).join('、')
  return `根据学生学情数据生成5道针对性练习题。薄弱点：${weakPoints.join('、')}。需巩固模块：${weak}。学科：${subject}。只返回JSON格式，包含title、description、exercises数组（no/type/content/answer/analysis/difficulty/knowledgePoint）、summary。`
}

async function callLLM(prompt: string): Promise<string> {
  const res = await fetch(`${AI_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${AI_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: AI_MODEL, messages: [{ role: 'user', content: prompt }], temperature: 0.3, max_tokens: 4096 }),
  })
  if (!res.ok) throw new Error(`AI失败: ${await res.text()}`)
  const data = await res.json()
  return data.choices[0].message.content
}

function parseJson(text: string): any {
  try { return JSON.parse(text) } catch {}
  const m = text.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/)
  if (m) { try { return JSON.parse(m[1]) } catch {} }
  const s = text.indexOf('{'), e = text.lastIndexOf('}')
  if (s !== -1 && e > s) { try { return JSON.parse(text.slice(s, e + 1)) } catch {} }
  return null
}

function fallback(weakPoints: string[], moduleScores: any[]): Exercise[] {
  const wm = moduleScores.find((m) => m.status === '需关注')?.module || '计算模块'
  return [
    { no: 1, type: '计算题', content: `【${wm}基础巩固】完成一道${wm}基础题。`, answer: '根据知识点作答', analysis: `巩固${wm}基础概念。`, difficulty: '基础', knowledgePoint: wm },
    { no: 2, type: '应用题', content: `【${wm}应用提升】运用${wm}解决实际问题。`, answer: '根据题目作答', analysis: `加深对${wm}的理解。`, difficulty: '提高', knowledgePoint: wm },
  ]
}

export async function generateExercises(weakPoints: string[], moduleScores: any[], subject: string = 'math'): Promise<ExerciseSet> {
  const prompt = buildPrompt(weakPoints, moduleScores, subject)
  let text = ''
  try {
    text = await callLLM(prompt)
  } catch (e: any) {
    return { title: '练习生成暂不可用', description: 'AI引擎暂时无法连接', exercises: fallback(weakPoints, moduleScores), summary: '建议检查网络后刷新重试。' }
  }
  const result = parseJson(text)
  const exercises = (result?.exercises || []).map((ex: any, idx: number) => ({
    no: ex.no || idx + 1, type: ex.type || '计算题', content: ex.content || '', answer: ex.answer || '',
    analysis: ex.analysis || '', difficulty: ex.difficulty || '基础', knowledgePoint: ex.knowledgePoint || ex.knowledge || '',
  }))
  return {
    title: result?.title || '个性化巩固练习',
    description: result?.description || `针对${weakPoints.length}个薄弱点的专属练习`,
    exercises: exercises.length > 0 ? exercises : fallback(weakPoints, moduleScores),
    summary: result?.summary || '建议用时20-30分钟。',
  }
}