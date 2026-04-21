/**
 * 个性化练习推荐引擎 —— OpenMAIC 版
 * 基于学情分析结果，调用 OpenMAIC 生成针对性练习
 * 定位：软件功能，非教育培训
 */

const OPENMAIC_URL = process.env.OPENMAIC_URL || 'http://host.docker.internal:3001'

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

function buildPrompt(
  weakPoints: string[],
  moduleScores: Array<{ module: string; scoreRate: number; status: string }>,
  subject: string
): string {
  const weakModules = moduleScores
    .filter((m) => m.status === '需关注' || m.status === '提升中')
    .map((m) => `${m.module}(${m.scoreRate}%)`)

  const solidModules = moduleScores
    .filter((m) => m.status === '扎实')
    .map((m) => m.module)

  // 根据得分率动态调整难度分布
  const avgScore = moduleScores.length > 0
    ? Math.round(moduleScores.reduce((s, m) => s + m.scoreRate, 0) / moduleScores.length)
    : 60

  let difficultyDistribution: string
  if (avgScore >= 85) {
    difficultyDistribution = '基础题2道 + 提高题2道 + 思维拓展题1道（整体扎实，重点突破）'
  } else if (avgScore >= 60) {
    difficultyDistribution = '基础题3道 + 提高题2道 + 思维拓展题1道（巩固基础，适度提升）'
  } else {
    difficultyDistribution = '基础题4道 + 提高题1道（薄弱较多，夯实基础为主）'
  }

  return `你是一位资深教育数据分析师，请根据以下学生的真实学情诊断数据，生成高度个性化的巩固练习。
【学科】${subject === 'math' ? '小升初数学' : subject}

【薄弱点】${weakPoints.length > 0 ? weakPoints.map((p) => `• ${p}`).join('\n') : '暂无明确薄弱点，建议综合巩固'}

【需巩固模块及得分率】${weakModules.length > 0 ? weakModules.join('、') : '各模块均衡'}

【已扎实模块】${solidModules.length > 0 ? solidModules.join('、') : '暂无'}

【学生综合得分率】${avgScore}%

【出题要求】
1. 生成 5 道练习题，必须紧扣上述薄弱点和需巩固模块
2. 难度分布：${difficultyDistribution}
3. 题目要符合小升初考试风格，语言简洁明确
4. 每道题目必须包含：题号、题型、题目内容、参考答案、详细解析、难度标签、对应知识点
5. 解析要包含：解题思路、常见错误分析、与初中知识的衔接提示
6. LaTeX公式用 $...$ 包裹

【输出格式】严格 JSON：
{
  "title": "专项巩固练习",
  "description": "基于本次学情分析生成的个性化练习",
  "exercises": [
    {
      "no": 1,
      "type": "填空题/计算题/应用题/解答题",
      "content": "题目内容（LaTeX公式用 $...$ 包裹）",
      "answer": "参考答案",
      "analysis": "详细解析，包含：知识点说明、解题思路、常见错误、初高中衔接提示",
      "difficulty": "基础/提高/思维拓展",
      "knowledgePoint": "对应知识点（精确到子概念）"
    }
  ],
  "summary": "练习说明，包含：建议用时、家长辅导要点、完成后的自检标准"
}

【重要】只返回 JSON，不要任何解释文字。确保 JSON 格式完整、正确。`
}

// 降级：直接调用 AI API（MiniMax 等）
const AI_API_KEY = process.env.AI_API_KEY || ''
const AI_BASE_URL = process.env.AI_BASE_URL || ''
const AI_MODEL = process.env.AI_MODEL || 'MiniMax-M2.7-highspeed'

async function callLLM(prompt: string): Promise<string> {
  const res = await fetch(`${AI_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${AI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: AI_MODEL,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 4096,
    }),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`AI 调用失败: ${text}`)
  }

  const data = await res.json()
  return data.choices[0].message.content
}

function parseExercisesJson(text: string): any {
  try {
    return JSON.parse(text)
  } catch {}

  const match = text.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/)
  if (match) {
    try { return JSON.parse(match[1]) } catch {}
  }

  const start = text.indexOf('{')
  const end = text.lastIndexOf('}')
  if (start !== -1 && end !== -1 && end > start) {
    try { return JSON.parse(text.slice(start, end + 1)) } catch {}
  }

  return null
}

export async function generateExercises(
  weakPoints: string[],
  moduleScores: Array<{ module: string; scoreRate: number; status: string }>,
  subject: string = 'math'
): Promise<ExerciseSet> {
  const prompt = buildPrompt(weakPoints, moduleScores, subject)
  let text = ''

  // 第一优先级：OpenMAIC
  try {
    const res = await fetch(`${OPENMAIC_URL}/api/generate/scene-content`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, model: 'minimax:MiniMax-M2.7-highspeed' }),
    })

    if (res.ok) {
      const data = await res.json()
      text = data.content || data.result || data.text || ''
      console.log('OpenMAIC 练习生成成功')
    } else {
      throw new Error(`OpenMAIC HTTP ${res.status}`)
    }
  } catch (e: any) {
    console.warn('OpenMAIC 不可用，降级到直连 AI:', e.message)

    // 第二优先级：直连 MiniMax
    try {
      text = await callLLM(prompt)
      console.log('直连 AI 练习生成成功')
    } catch (e2: any) {
      console.error('直连 AI 也失败:', e2.message)
      return {
        title: '练习生成暂不可用',
        description: 'AI 引擎暂时无法连接，已生成基础巩固题',
        exercises: fallbackExercises(weakPoints, moduleScores),
        summary: '建议检查网络后刷新重试，或稍后手动生成练习。',
      }
    }
  }

  const result = parseExercisesJson(text)

  // 数据校验与兜底
  const exercises = (result?.exercises || []).map((ex: any, idx: number) => ({
    no: ex.no || idx + 1,
    type: ex.type || '计算题',
    content: ex.content || ex.question || ex.title || '',
    answer: ex.answer || ex.ans || ex.correctAnswer || '',
    analysis: ex.analysis || ex.explanation || ex.parse || '',
    difficulty: ex.difficulty || ex.level || '基础',
    knowledgePoint: ex.knowledgePoint || ex.knowledge || ex.knowledge_point || ex.tag || '',
  }))

  return {
    title: result?.title || '个性化巩固练习',
    description: result?.description || `基于本次学情分析，针对${weakPoints.length}个薄弱点生成的专属练习`,
    exercises: exercises.length > 0 ? exercises : fallbackExercises(weakPoints, moduleScores),
    summary: result?.summary || `建议用时 20-30 分钟。完成练习后，建议家长引导孩子对照解析自主订正，培养反思习惯。`,
  }
}

// 兜底练习题（OpenMAIC 不可用时）
function fallbackExercises(
  weakPoints: string[],
  moduleScores: Array<{ module: string; scoreRate: number; status: string }>
): Exercise[] {
  const weakModule = moduleScores.find((m) => m.status === '需关注')?.module || '计算模块'
  return [
    {
      no: 1,
      type: '计算题',
      content: `【${weakModule}基础巩固】请完成一道${weakModule}的基础练习题，检验基本概念掌握情况。`,
      answer: '请根据具体知识点作答',
      analysis: `本题针对${weakModule}的基础概念进行巩固。建议回顾课本相关章节，确保定义、公式记忆准确。`,
      difficulty: '基础',
      knowledgePoint: weakModule,
    },
    {
      no: 2,
      type: '应用题',
      content: `【${weakModule}应用提升】结合生活场景，运用${weakModule}知识解决实际问题。`,
      answer: '请根据具体题目作答',
      analysis: `通过实际应用场景，加深对${weakModule}的理解。注意审题，明确已知条件和求解目标。`,
      difficulty: '提高',
      knowledgePoint: weakModule,
    },
  ]
}
