/**
 * AI 学情分析引擎
 * 基于教育数据模型，提供客观的学情分析报告
 * 定位：家庭学情分析工具，非教育培训
 */

import { ENGLISH_PROMPT_TEMPLATE } from './english-skill'

const AI_PROVIDER = (process.env.AI_PROVIDER || 'minimax').toLowerCase()
const AI_API_KEY = process.env.AI_API_KEY || ''
const AI_BASE_URL = process.env.AI_BASE_URL || ''
const AI_MODEL = process.env.AI_MODEL || 'MiniMax-M2.7-highspeed'
const AI_TIMEOUT = parseInt(process.env.AI_TIMEOUT || '120', 10)

export interface QuestionResult {
  no: number
  content: string
  studentAnswer: string
  correctAnswer: string
  isCorrect: boolean
  knowledgePoint: string
  examModule: string
  difficulty: string
  processScore: string
  juniorLink: string
  analysis: string
}

export interface CheckReport {
  score: number
  totalQuestions: number
  correct: number
  wrong: number
  questions: QuestionResult[]
  moduleScores: Array<{
    module: string
    scoreRate: number
    weight: string
    status: string
  }>
  weakPoints: string[]
  suggestions: string[]
  recommendedExercises: Array<{
    module: string
    type: string
    desc: string
    difficulty: string
  }>
  examStrategy: string
}

const SUBJECT_PROMPTS: Record<string, string> = {
  math: `你是一位教育数据分析模型，基于小升初数学知识体系，对以下学生作业进行客观分析。

请输出专业级的学情分析报告，帮助家长了解孩子的知识掌握情况。

【小升初数学知识体系 · 五大模块】
1. 计算模块（25%-30%）：四则混合运算、简便运算、解方程、定义新运算
2. 几何模块（18%-25%）：平面/立体图形、阴影面积、图形变换
3. 应用题模块（30%-40%）：行程、工程、浓度、利润、比和比例、经典思维题
4. 数论模块（5%-12%）：因数倍数、质数合数、GCD/LCM、整除
5. 统计与逻辑（5%-10%）：统计图、平均数、概率、逻辑推理

【输出格式 · 严格 JSON】
{
  "score": 75,
  "totalQuestions": 5,
  "correct": 4,
  "wrong": 1,
  "questions": [
    {
      "no": 1,
      "content": "题目原文",
      "studentAnswer": "学生答案",
      "correctAnswer": "正确答案",
      "isCorrect": true,
      "knowledgePoint": "精确知识点",
      "examModule": "计算模块",
      "difficulty": "基础",
      "processScore": "完整",
      "juniorLink": "初中衔接内容",
      "analysis": "客观分析，包含知识点说明和常见误区"
    }
  ],
  "moduleScores": [
    {"module": "计算模块", "scoreRate": 100, "weight": "25%", "status": "扎实"}
  ],
  "weakPoints": ["提升方向1"],
  "suggestions": ["家庭学习建议1"],
  "recommendedExercises": [
    {"module": "计算模块", "type": "简便运算", "desc": "提取公因数练习", "difficulty": "基础"}
  ],
  "examStrategy": "基于本次分析的阶段性学习建议"
}

【分析原则】
1. 必须逐题分析，不遗漏任何题目
2. 知识点标注要精确到知识体系子概念
3. 过程分析：有步骤缺失需指出
4. 初中衔接：说明该知识点与初中内容的关联
5. 只返回 JSON，不要任何解释文字
6. 确保 JSON 完整、格式正确`,

  chinese: `你是一位教育数据分析模型，基于小升初语文知识体系，对以下学生作业进行客观分析。

请按以下 JSON 格式返回，不要输出其他内容：
{
  "score": <总分>,
  "totalQuestions": <总题数>,
  "correct": <对题数>,
  "wrong": <错题数>,
  "questions": [{"no":1,"content":"题目","studentAnswer":"学生答案","correctAnswer":"正确答案","isCorrect":true,"knowledgePoint":"知识点","analysis":"解析"}],
  "weakPoints": ["提升方向"],
  "suggestions": ["家庭学习建议"],
  "recommendedExercises": [{"type":"题型","desc":"描述","difficulty":"基础"}],
  "examStrategy": "阶段性学习建议"
}`,

  english: ENGLISH_PROMPT_TEMPLATE,
}

async function callLLM(prompt: string): Promise<string> {
  const url = `${AI_BASE_URL}/chat/completions`
  const payload = {
    model: AI_MODEL,
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.3,
    max_tokens: 4096,
  }

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), AI_TIMEOUT * 1000)

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${AI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    })
    clearTimeout(timeoutId)

    if (!res.ok) {
      const text = await res.text()
      throw new Error(`AI 调用失败: ${text}`)
    }

    const data = await res.json()
    if (data.error) {
      throw new Error(`AI 服务错误: ${data.error.message || JSON.stringify(data.error)}`)
    }
    const content = data.choices?.[0]?.message?.content
    if (!content) {
      throw new Error(`AI 返回格式异常: ${JSON.stringify(data).slice(0, 200)}`)
    }
    // 去除 MiniMax 思考标签
    return content.replace(/<think>[\s\S]*?<\/think>\s*/, '')
  } catch (e: any) {
    if (e.name === 'AbortError') throw new Error('AI 分析超时，请稍后重试')
    throw e
  }
}

function extractJson(text: string): any {
  try {
    return JSON.parse(text)
  } catch {}

  const mdMatch = text.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/)
  if (mdMatch) {
    try {
      return JSON.parse(mdMatch[1])
    } catch {}
  }

  const start = text.indexOf('{')
  if (start !== -1) {
    let depth = 0
    for (let i = start; i < text.length; i++) {
      if (text[i] === '{') depth++
      else if (text[i] === '}') depth--
      if (depth === 0) {
        try {
          return JSON.parse(text.slice(start, i + 1))
        } catch {}
        break
      }
    }
  }

  throw new Error('无法解析 AI 返回的数据')
}

function enrichReport(report: CheckReport, subject: string): CheckReport {
  if (subject !== 'math') return report

  const moduleMap: Record<string, string[]> = {
    '计算模块': ['四则', '混合运算', '简便', '凑整', '提取公因数', '分配律', '解方程', '解比例', '定义新运算', '估算', '速算', '巧算'],
    '几何模块': ['周长', '面积', '体积', '表面积', '圆', '长方形', '正方形', '三角形', '平行四边形', '梯形', '圆柱', '圆锥', '角度', '阴影', '组合图形'],
    '应用题模块': ['行程', '相遇', '追及', '平均速度', '流水', '行船', '工程', '浓度', '利润', '折扣', '利率', '经济', '比', '比例', '鸡兔同笼', '年龄', '盈亏', '植树', '方阵', '牛吃草'],
    '数论模块': ['公因数', '公倍数', 'GCD', 'LCM', '质数', '合数', '因数', '倍数', '整除', '奇偶', '余数', '同余', '完全平方', '分解质因数', '短除'],
    '统计与逻辑': ['统计图', '条形', '折线', '扇形', '平均数', '中位数', '众数', '概率', '逻辑', '推理', '抽屉', '容斥', '排列', '组合'],
  }

  const juniorLinkMap: Record<string, string> = {
    '整数乘法': '有理数乘法',
    '整数除法': '有理数除法',
    '分数': '有理数运算',
    '小数': '有理数运算',
    '负数': '有理数概念',
    '方程': '一元一次方程',
    '解方程': '一元一次方程',
    '比例': '比例与相似',
    '几何': '平面几何证明入门',
    '周长': '线段与角的度量',
    '面积': '多边形面积公式推导',
    '体积': '立体几何初步',
    '统计': '数据统计与概率',
    '代数': '整式与代数式',
  }

  const questions = report.questions || []
  const moduleCounts: Record<string, { total: number; correct: number }> = {
    '计算模块': { total: 0, correct: 0 },
    '几何模块': { total: 0, correct: 0 },
    '应用题模块': { total: 0, correct: 0 },
    '数论模块': { total: 0, correct: 0 },
    '统计与逻辑': { total: 0, correct: 0 },
  }

  for (const q of questions) {
    const kp = q.knowledgePoint || ''
    const content = q.content || ''
    const text = (kp + content).toLowerCase()

    if (!q.examModule) {
      for (const [mod, kws] of Object.entries(moduleMap)) {
        if (kws.some((kw) => text.includes(kw.toLowerCase()))) {
          q.examModule = mod
          break
        }
      }
      if (!q.examModule) q.examModule = '计算模块'
    }

    if (!q.difficulty) {
      if (['负数', '有理数', '绝对值', '代数式', '整式'].some((w) => text.includes(w))) q.difficulty = '初中衔接'
      else if (['奥数', '竞赛', '抽屉', '容斥', '排列组合', '同余', '牛吃草', '多次相遇'].some((w) => text.includes(w))) q.difficulty = '思维拓展'
      else if (['组合图形', '阴影', '中途离开', '效率变化', '比例法', '假设法', '方程组'].some((w) => text.includes(w))) q.difficulty = '提高'
      else q.difficulty = '基础'
    }

    if (!q.processScore) q.processScore = q.isCorrect ? '完整' : '需规范'

    if (!q.juniorLink || q.juniorLink === '无') {
      for (const [key, value] of Object.entries(juniorLinkMap)) {
        if (kp.includes(key)) {
          q.juniorLink = value
          break
        }
      }
      if (!q.juniorLink) q.juniorLink = '无'
    }

    const mod = q.examModule
    if (moduleCounts[mod]) {
      moduleCounts[mod].total++
      if (q.isCorrect) moduleCounts[mod].correct++
    }
  }

  const weights: Record<string, string> = {
    '计算模块': '25%',
    '几何模块': '20%',
    '应用题模块': '35%',
    '数论模块': '10%',
    '统计与逻辑': '10%',
  }

  report.moduleScores = Object.keys(moduleCounts).map((mod) => {
    const total = moduleCounts[mod].total
    const correct = moduleCounts[mod].correct
    const rate = total > 0 ? Math.round((correct / total) * 100) : 100
    return {
      module: mod,
      scoreRate: rate,
      weight: weights[mod] || '10%',
      status: rate >= 80 ? '扎实' : rate >= 60 ? '提升中' : '需关注',
    }
  })

  if (!report.examStrategy) {
    const weakModules = report.moduleScores.filter((m) => m.status === '需关注').map((m) => m.module)
    if (weakModules.length > 0) {
      report.examStrategy = `当前建议优先关注：${weakModules.join('、')}。应用题模块占比最高（35%），建议家庭练习时重点投入。计算模块（25%）属于基础能力，建议保持每日练习。`
    } else {
      report.examStrategy = '整体知识掌握扎实，建议保持现有学习节奏，适当增加思维拓展内容，为初中学习做好衔接准备。'
    }
  }

  report.totalQuestions = questions.length
  report.correct = questions.filter((q) => q.isCorrect).length
  report.wrong = report.totalQuestions - report.correct
  report.score = report.totalQuestions > 0 ? Math.round((report.correct / report.totalQuestions) * 100) : 0

  return report
}

export async function analyzeHomework(
  text: string,
  subject: string = 'math'
): Promise<CheckReport> {
  // Phase 1: 输入异常检查
  if (text.includes('[低置信度]')) {
    throw new Error('识别质量不足，包含低置信度内容，建议重新拍照或人工确认')
  }
  if (!text || text.trim().length < 10) {
    throw new Error('作业内容过短，无法进行分析')
  }
  if (text.split('\n').length < 2 && text.length < 30) {
    throw new Error('作业内容不完整，请检查识别结果')
  }

  // 任务 1: 题目数量一致性检查
  function extractQuestionCount(t: string): number {
    const patterns = [
      /[一二三四五六七八九十百]+[、\.\s]/g,               // 中文数字：一、二、三...
      /第\s*\d+\s*题/g,                                    // 第1题、第2题
      /^\s*\d+[\.\、\)\]\}]/gm,                           // 1. / 2. / 1）/ 1]
      /[（\(]\s*\d+\s*[）\)]/g,                            // （1）（2）
      /Question\s+\d+/gi,                                  // Question 1
      /Q\s*\d+/gi,                                         // Q1
      /\d+\s*\./g,                                         // 1. (行首或空格后)
    ]
    const seen = new Set<string>()
    for (const p of patterns) {
      const matches = t.match(p)
      if (matches) {
        matches.forEach((m) => seen.add(m.trim()))
      }
    }
    return seen.size
  }

  const questionCount = extractQuestionCount(text)
  if (questionCount < 1 || questionCount > 30) {
    throw new Error(`识别结果异常，检测到 ${questionCount} 道题目，请检查图片是否完整`)
  }

  const promptTemplate = SUBJECT_PROMPTS[subject] || SUBJECT_PROMPTS.math
  const fullPrompt = `${promptTemplate}\n\n【作业内容】\n${text}\n\n要求：\n1. 必须严格按上述 JSON 格式返回\n2. 只返回 JSON，不要任何解释\n3. 确保 JSON 完整、格式正确\n4. 如果题目很多，优先分析前10题`

  const aiText = await callLLM(fullPrompt)
  const rawReport = extractJson(aiText)
  const report: CheckReport = {
    score: rawReport.score || 0,
    totalQuestions: rawReport.totalQuestions || 0,
    correct: rawReport.correct || 0,
    wrong: rawReport.wrong || 0,
    questions: (rawReport.questions || []).map((q: any) => ({
      no: q.no || 0,
      content: q.content || '',
      studentAnswer: q.studentAnswer || q.student_answer || '',
      correctAnswer: q.correctAnswer || q.correct_answer || '',
      isCorrect: q.isCorrect || q.is_correct || false,
      knowledgePoint: q.knowledgePoint || q.knowledge_point || '',
      examModule: q.examModule || q.exam_module || '',
      difficulty: q.difficulty || '',
      processScore: q.processScore || q.process_score || '',
      juniorLink: q.juniorLink || q.junior_link || '',
      analysis: q.analysis || '',
    })),
    moduleScores: rawReport.moduleScores || rawReport.module_scores || [],
    weakPoints: rawReport.weakPoints || rawReport.weak_points || [],
    suggestions: rawReport.suggestions || [],
    recommendedExercises: rawReport.recommendedExercises || rawReport.recommended_exercises || [],
    examStrategy: rawReport.examStrategy || rawReport.exam_strategy || '',
  }

  return enrichReport(report, subject)
}
