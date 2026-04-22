/**
 * WinGo OCR 服务 — 试卷分析与识别（doc_analysis）
 * 支持：手写/印刷混排、公式识别(LaTeX)、版面分析、竖式识别、涂改检测
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
  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in - 300) * 1000,
  }
  return data.access_token
}

export interface OcrLine {
  text: string
  type: 'handwriting' | 'print'
  top: number
  left: number
  confidence?: { average: number; min: number }
}

export interface OcrFormula {
  latex: string
  top: number
  left: number
}

export interface OcrUnderline {
  startX: number
  startY: number
  endX: number
  endY: number
  prob: number
}

export interface OcrLongDivision {
  words: string
  top: number
  left: number
}

export interface OcrLayout {
  type: 'table' | 'figure' | 'text' | 'title' | 'contents'
  location: Array<{ x: number; y: number }>
  lineIds: number[]
}

export interface OcrResult {
  text: string
  lines: OcrLine[]
  formulas: OcrFormula[]
  underlines: OcrUnderline[]
  longDivisions: OcrLongDivision[]
  layouts: OcrLayout[]
  alteredRegions: string[] // 涂改区域文本
  imageDirection: number
  lowConfidenceCount: number // 低置信度行数
}

export async function ocrRecognize(imageBase64: string): Promise<string> {
  const result = await ocrRecognizeAdvanced(imageBase64)
  return result.text
}

export async function ocrRecognizeAdvanced(imageBase64: string): Promise<OcrResult> {
  const token = await getAccessToken()
  const url = `https://aip.baidubce.com/rest/2.0/ocr/v1/doc_analysis?access_token=${token}`

  const params = new URLSearchParams()
  params.append('image', imageBase64)
  params.append('language_type', 'CHN_ENG')
  params.append('result_type', 'big')
  params.append('detect_direction', 'true')
  params.append('line_probability', 'true')
  params.append('words_type', 'handprint_mix')
  params.append('layout_analysis', 'true')
  params.append('recg_formula', 'true')
  params.append('recg_long_division', 'true')
  params.append('disp_underline_analysis', 'true')
  params.append('recg_alter', 'true')

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`试卷分析识别失败: ${text}`)
  }

  const data = await res.json()

  // 图像方向
  const imageDirection = data.img_direction ?? 0

  // 按位置(top)排序的文字行
  const rawResults = (data.results || []).sort(
    (a: any, b: any) => (a.words?.words_location?.top ?? 0) - (b.words?.words_location?.top ?? 0)
  )

  const lines: OcrLine[] = rawResults.map((r: any) => {
    const loc = r.words?.words_location || {}
    const prob = r.words?.line_probability
    return {
      text: r.words?.word || '',
      type: r.words_type === 'handwriting' ? 'handwriting' : 'print',
      top: loc.top ?? 0,
      left: loc.left ?? 0,
      confidence: prob
        ? { average: prob.average ?? 0, min: prob.min ?? 0 }
        : undefined,
    }
  })

  // 公式
  const formulas: OcrFormula[] = (data.formula_result || []).map((f: any) => ({
    latex: f.form_words || '',
    top: f.form_location?.top ?? 0,
    left: f.form_location?.left ?? 0,
  }))

  // 下划线（填空题）
  const underlines: OcrUnderline[] = (data.underline || []).map((u: any) => ({
    startX: u.points?.start_x ?? 0,
    startY: u.points?.start_y ?? 0,
    endX: u.points?.end_x ?? 0,
    endY: u.points?.end_y ?? 0,
    prob: u.prob ?? 0,
  }))

  // 手写竖式
  const longDivisions: OcrLongDivision[] = (data.results || [])
    .flatMap((r: any) => r.long_division || [])
    .map((d: any) => ({
      words: d.words?.word || '',
      top: d.location?.top ?? 0,
      left: d.location?.left ?? 0,
    }))

  // 版面分析
  const layouts: OcrLayout[] = (data.layouts || []).map((l: any) => ({
    type: l.layout,
    location: (l.layout_location || []).map((p: any) => ({ x: p.x, y: p.y })),
    lineIds: l.layout_idx || [],
  }))

  // 涂改区域（☰ 标记）
  const alteredRegions = lines
    .filter((l) => l.text.includes('☰'))
    .map((l) => l.text)

  // 置信度统计
  let lowConfidenceCount = 0
  lines.forEach((l) => {
    if (l.confidence && l.confidence.average < 0.8) {
      lowConfidenceCount++
    }
  })

  // 拼接文本
  const textParts: string[] = []

  // 按版面模块分组输出
  lines.forEach((l) => {
    const prefix = l.type === 'handwriting' ? '[手写] ' : ''
    const lowConf = l.confidence && l.confidence.average < 0.8 ? '[低置信度] ' : ''
    textParts.push(prefix + lowConf + l.text)
  })

  if (formulas.length > 0) {
    textParts.push('')
    textParts.push('[公式]')
    formulas.forEach((f) => textParts.push(f.latex))
  }

  if (longDivisions.length > 0) {
    textParts.push('')
    textParts.push('[竖式]')
    longDivisions.forEach((d) => textParts.push(d.words))
  }

  if (alteredRegions.length > 0) {
    textParts.push('')
    textParts.push('[涂改区域]')
    alteredRegions.forEach((a) => textParts.push(a))
  }

  if (underlines.length > 0) {
    textParts.push('')
    textParts.push(`[下划线/填空] ${underlines.length}处`)
  }

  const text = textParts.join('\n')

  return {
    text,
    lines,
    formulas,
    underlines,
    longDivisions,
    layouts,
    alteredRegions,
    imageDirection,
    lowConfidenceCount,
  }
}
