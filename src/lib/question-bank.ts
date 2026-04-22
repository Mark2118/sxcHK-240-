/**
 * Phase 3.1: 题库索引
 * 常见小升初试卷题目，用于 OCR 识别后的模糊匹配
 * 长期建设，逐步扩充
 */

export interface BankQuestion {
  id: string
  subject: 'math' | 'english' | 'chinese'
  grade: string
  source: string // 试卷来源，如"六年级期末"、"小升初模拟"
  type: 'choice' | 'fill' | 'judge' | 'qa' | 'calc'
  content: string // 题目原文
  keywords: string[] // 关键词，用于模糊匹配
  knowledgePoint: string
  difficulty: '基础' | '提高' | '拓展'
}

// 初始题库（逐步扩充）
export const QUESTION_BANK: BankQuestion[] = [
  // 数学 - 计算模块
  {
    id: 'math-001',
    subject: 'math',
    grade: '六年级',
    source: '小升初数学基础',
    type: 'calc',
    content: '1 + 1 =',
    keywords: ['加法', '基础计算'],
    knowledgePoint: '整数加法',
    difficulty: '基础',
  },
  {
    id: 'math-002',
    subject: 'math',
    grade: '六年级',
    source: '小升初数学基础',
    type: 'calc',
    content: '简便计算：25 × 4 × 8',
    keywords: ['简便计算', '乘法结合律'],
    knowledgePoint: '乘法结合律',
    difficulty: '提高',
  },
  // 数学 - 几何模块
  {
    id: 'math-003',
    subject: 'math',
    grade: '六年级',
    source: '小升初数学几何',
    type: 'qa',
    content: '求阴影部分面积（单位：厘米）',
    keywords: ['阴影面积', '几何'],
    knowledgePoint: '圆与扇形面积',
    difficulty: '拓展',
  },
  // 英语 - 词汇模块
  {
    id: 'eng-001',
    subject: 'english',
    grade: '六年级',
    source: '小升初英语期末',
    type: 'fill',
    content: 'Look at the p___. It can fly.',
    keywords: ['plane', '看图填词', '词汇'],
    knowledgePoint: '名词辨析',
    difficulty: '基础',
  },
  {
    id: 'eng-002',
    subject: 'english',
    grade: '六年级',
    source: '小升初英语期末',
    type: 'fill',
    content: 'He is ___. He should see a doctor.',
    keywords: ['sick', '看图填词', '词汇'],
    knowledgePoint: '形容词辨析',
    difficulty: '基础',
  },
  {
    id: 'eng-003',
    subject: 'english',
    grade: '六年级',
    source: '小升初英语期末',
    type: 'fill',
    content: 'The kite is flying ___.',
    keywords: ['high', '看图填词', '词汇'],
    knowledgePoint: '副词辨析',
    difficulty: '基础',
  },
  // 英语 - 语法模块
  {
    id: 'eng-004',
    subject: 'english',
    grade: '六年级',
    source: '小升初英语语法',
    type: 'choice',
    content: 'She ___ to school every day. A. go B. goes C. going',
    keywords: ['一般现在时', '三单'],
    knowledgePoint: '一般现在时第三人称单数',
    difficulty: '基础',
  },
]

/**
 * 模糊匹配：根据 OCR 识别文本，查找最可能匹配的题库题目
 * 返回匹配度最高的前 N 个结果
 */
export function fuzzyMatch(text: string, subject?: string, topN: number = 3): BankQuestion[] {
  const candidates = subject
    ? QUESTION_BANK.filter((q) => q.subject === subject)
    : QUESTION_BANK

  const results = candidates.map((q) => {
    let score = 0
    // 关键词匹配
    for (const kw of q.keywords) {
      if (text.includes(kw)) score += 10
    }
    // 内容相似度（简单包含）
    if (text.includes(q.content.substring(0, 15))) score += 5
    // 题目类型匹配
    const typeMap: Record<string, string> = {
      choice: '选择',
      fill: '填空',
      judge: '判断',
      qa: '问答',
      calc: '计算',
    }
    if (typeMap[q.type] && text.includes(typeMap[q.type])) score += 3

    return { question: q, score }
  })

  return results
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, topN)
    .map((r) => r.question)
}

/**
 * 添加新题目到题库（运行时扩展）
 */
export function addToBank(question: BankQuestion): void {
  QUESTION_BANK.push(question)
}
