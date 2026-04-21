/**
 * WinGo 试卷切题识别（paper_cut_edu）
 * 自动切分试卷题目，输出题干、选项、答案、参考答案的结构化数据
 */

const BAIDU_API_KEY = process.env.BAIDU_API_KEY || ''
const BAIDU_SECRET_KEY = process.env.BAIDU_SECRET_KEY || ''

interface BaiduTokenResponse {
  access_token: string
  expires_in: number
}

let cachedToken: { token: string; expiresAt: number } | null = null

async function getAccessToken(): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expiresAt) {
    return cachedToken.token
  }
  const url = `https://aip.baidubce.com/oauth/2.0/token?grant_type=client_credentials&client_id=${BAIDU_API_KEY}&client_secret=${BAIDU_SECRET_KEY}`
  const res = await fetch(url, { method: 'POST' })
  if (!res.ok) throw new Error('获取系统 access_token 失败')
  const data: BaiduTokenResponse = await res.json()
  cachedToken = { token: data.access_token, expiresAt: Date.now() + (data.expires_in - 300) * 1000 }
  return data.access_token
}

export interface PaperQuestion {
  type: 'choice' | 'judge' | 'fill' | 'qa' | 'other'
  typeCode: number
  confidence: number
  stem: string
  options: string
  answer: string
  interpretation: string
  subQuestions: string
  location: Array<{ x: number; y: number }>
  elements: Array<{
    type: 'stem' | 'subqus' | 'answer' | 'option' | 'figure' | 'interpretation'
    text: string
    handwriting: boolean
    location: Array<{ x: number; y: number }>
  }>
}

export interface PaperCutResult {
  direction: number
  questions: PaperQuestion[]
  questionImages: Array<{
    location: Array<{ x: number; y: number }>
  }>
}

const TYPE_MAP: Record<number, PaperQuestion['type']> = {
  0: 'choice',
  1: 'judge',
  2: 'fill',
  3: 'qa',
  4: 'other',
}

const ELEM_TYPE_MAP: Record<number, PaperQuestion['elements'][0]['type']> = {
  0: 'stem',
  1: 'subqus',
  2: 'answer',
  3: 'option',
  4: 'figure',
  5: 'interpretation',
}

export async function cutPaper(imageBase64: string): Promise<PaperCutResult> {
  const token = await getAccessToken()
  const url = `https://aip.baidubce.com/rest/2.0/ocr/v1/paper_cut_edu?access_token=${token}`

  const params = new URLSearchParams()
  params.append('image', imageBase64)
  params.append('language_type', 'CHN_ENG')
  params.append('detect_direction', 'true')
  params.append('words_type', 'handprint_mix')
  params.append('splice_text', 'true')
  params.append('enhance', 'true')

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`试卷切题失败: ${text}`)
  }

  const data = await res.json()

  const questions: PaperQuestion[] = (data.qus_result || []).map((q: any) => {
    const elemText = q.elem_text || {}
    const elements = Array.isArray(q.qus_element) ? q.qus_element.map((e: any) => {
      const elemWords = Array.isArray(e.elem_word) ? e.elem_word : []
      const words = elemWords.map((w: any) => w.word).join(' ')
      const isHandwriting = elemWords.some((w: any) => w.word_type === 'handwriting')
      return {
        type: ELEM_TYPE_MAP[e.elem_type] || 'other',
        text: words,
        handwriting: isHandwriting,
        location: Array.isArray(e.elem_location) ? e.elem_location.map((p: any) => ({ x: p.x, y: p.y })) : [],
      }
    }) : []

    return {
      type: TYPE_MAP[q.qus_type] || 'other',
      typeCode: q.qus_type ?? 4,
      confidence: q.qus_probability ?? 0,
      stem: elemText.stem_text || elements.find((e: any) => e.type === 'stem')?.text || '',
      options: elemText.option_text || elements.filter((e: any) => e.type === 'option').map((e: any) => e.text).join('\n'),
      answer: elemText.answer_text || elements.filter((e: any) => e.type === 'answer').map((e: any) => e.text).join('\n'),
      interpretation: elemText.interpretation_text || '',
      subQuestions: elemText.subqus_text || '',
      location: Array.isArray(q.qus_location) ? q.qus_location.map((p: any) => ({ x: p.x, y: p.y })) : [],
      elements,
    }
  })

  return {
    direction: data.direction ?? 0,
    questions,
    questionImages: Array.isArray(data.qus_figure) ? data.qus_figure.map((f: any) => ({
      location: Array.isArray(f.fig_location) ? f.fig_location.map((p: any) => ({ x: p.x, y: p.y })) : [],
    })) : [],
  }
}

/** 将切题结果转换为文本 */
export function paperCutToText(result: PaperCutResult): string {
  const lines: string[] = []
  for (let i = 0; i < result.questions.length; i++) {
    const q = result.questions[i]
    lines.push(`第${i + 1}题 [${q.type === 'choice' ? '选择题' : q.type === 'judge' ? '判断题' : q.type === 'fill' ? '填空题' : q.type === 'qa' ? '问答题' : '其他'}]`)
    if (q.stem) lines.push(`题干: ${q.stem}`)
    if (q.options) lines.push(`选项: ${q.options}`)
    if (q.answer) lines.push(`学生答案: ${q.answer}`)
    if (q.interpretation) lines.push(`参考答案: ${q.interpretation}`)
    lines.push('')
  }
  return lines.join('\n')
}
