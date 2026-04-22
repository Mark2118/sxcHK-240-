/**
 * WinGo 智能作业批改
 * 端到端批改：异步接口，提交→轮询获取结果
 * 支持：全学科作业/试卷自动批改，输出每道题对错、坐标、原因
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

export interface CorrectSlot {
  slotId: string
  sequence: number
  handwritingArea: { left_x: number; left_y: number; right_x: number; right_y: number }
  correctResult: number // 0:未批 1:正确 2:错误 3:未作答
  reason: string
}

export interface CorrectQuestion {
  questionId: string
  question: string
  sequence: number
  questionArea: Array<{ left_x: number; left_y: number; right_x: number; right_y: number }>
  correctResult: number
  isFinish: boolean
  type: number
  typeName: string
  cropUrl: string
  slots: CorrectSlot[]
}

export interface CorrectResult {
  taskId: string
  isAllFinished: boolean
  subject: string
  questions: CorrectQuestion[]
  stat: { all: number; corrected: number; correcting: number }
}

const TYPE_MAP: Record<number, string> = {
  0: '默认', 1: '口算题', 2: '选择题', 3: '判断题', 4: '填空题',
  5: '应用题', 6: '连线题', 7: '画画题', 8: '题干', 9: '其他',
  10: '材料', 11: '圈选题', 17: '计算题', 18: '证明题', 19: '解答题',
  401: '描述题', 402: '排序题', 801: '图表题', 902: '带过程填空',
}

const RESULT_MAP: Record<number, string> = {
  0: '未批', 1: '正确', 2: '错误', 3: '未作答',
}

/** 提交批改任务 */
export async function submitCorrectTask(imageBase64: string): Promise<string> {
  const token = await getAccessToken()
  const url = `https://aip.baidubce.com/rest/2.0/ocr/v1/correct_edu/create_task?access_token=${token}`

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image: imageBase64, only_split: false }),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`提交批改任务失败: ${text}`)
  }

  const data = await res.json()
  if (data.error_code && data.error_code !== '0') {
    throw new Error(`批改错误: ${data.error_msg} (${data.error_code})`)
  }

  const taskId = data.result?.task_id
  if (!taskId) {
    throw new Error(`批改服务未返回任务ID: ${JSON.stringify(data)}`)
  }
  return taskId
}

/** 获取批改结果 */
export async function getCorrectResult(taskId: string): Promise<CorrectResult | null> {
  const token = await getAccessToken()
  const url = `https://aip.baidubce.com/rest/2.0/ocr/v1/correct_edu/get_result?access_token=${token}`

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ task_id: taskId }),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`获取批改结果失败: ${text}`)
  }

  const data = await res.json()
  // Pending 状态继续轮询，不抛错
  if (data.error_code === 1 || data.error_msg === 'Pending') {
    return null
  }
  if (data.error_code && data.error_code !== '0') {
    throw new Error(`批改错误: ${data.error_msg} (${data.error_code})`)
  }

  const imageResult = (data.imageResults || [])[0]
  if (!imageResult) return null

  const questions: CorrectQuestion[] = (imageResult.result || []).map((r: any) => ({
    questionId: r.questionId || '',
    question: r.question || '',
    sequence: r.sequence ?? r.seqence ?? 0,
    questionArea: r.questionArea || [],
    correctResult: r.correctResult ?? 0,
    isFinish: r.isFinish ?? false,
    type: r.type ?? 0,
    typeName: TYPE_MAP[r.type] || '其他',
    cropUrl: r.cropUrl || '',
    slots: (r.slot || []).map((s: any) => ({
      slotId: s.slotId || '',
      sequence: s.seqence ?? 0,
      handwritingArea: s.handwritingArea || {},
      correctResult: s.correctResult ?? 0,
      reason: s.reason || '',
    })),
  }))

  return {
    taskId: data.task_id,
    isAllFinished: data.isAllFinished ?? false,
    subject: imageResult.paperSubject || 'unknown',
    questions,
    stat: data.stat_result || { all: 0, corrected: 0, correcting: 0 },
  }
}

/** 轮询等待批改完成 */
export async function pollCorrectResult(
  taskId: string,
  maxAttempts: number = 15,
  intervalMs: number = 2000
): Promise<CorrectResult> {
  for (let i = 0; i < maxAttempts; i++) {
    const result = await getCorrectResult(taskId)
    if (result && result.isAllFinished) {
      return result
    }
    await new Promise((r) => setTimeout(r, intervalMs))
  }
  throw new Error('批改超时，请稍后通过报告ID查询结果')
}

/** 将批改结果转换为文本格式（用于AI进一步分析） */
export function correctResultToText(result: CorrectResult): string {
  const lines: string[] = []
  lines.push(`学科: ${result.subject}`)
  lines.push(`总题数: ${result.stat.all}  已批改: ${result.stat.corrected}`)
  lines.push('')

  for (const q of result.questions) {
    lines.push(`第${q.sequence + 1}题 [${q.typeName}] ${RESULT_MAP[q.correctResult]}`)
    if (q.question) lines.push(`  题目: ${q.question}`)
    for (const slot of q.slots) {
      lines.push(`  作答区${slot.sequence}: ${RESULT_MAP[slot.correctResult]}`)
      if (slot.reason) lines.push(`  原因: ${slot.reason}`)
    }
    lines.push('')
  }

  return lines.join('\n')
}
