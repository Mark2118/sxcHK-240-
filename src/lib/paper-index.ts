/**
 * 任务 3: 最小可行题库索引（MVP）
 * 建立最简单的试卷特征库，识别结果能匹配到已知试卷时高亮，匹配不到时告警
 */

export interface PaperSignature {
  id: string
  name: string
  grade: string
  subject: string
  term: string
  questionCount: number
  keyPhrases: string[] // 试卷开头的特征短语
  typicalQuestionTypes: string[] // 典型题型
}

// 已知试卷特征库（逐步扩充）
export const knownPapers: PaperSignature[] = [
  {
    id: 'paper-001',
    name: '六年级英语期末卷（看图填词）',
    grade: '六年级',
    subject: 'english',
    term: '期末',
    questionCount: 9,
    keyPhrases: ['看图填词', '六年级英语', 'plane', 'sick', 'high', 'riding', 'singing'],
    typicalQuestionTypes: ['看图填词', '选择题', '阅读理解'],
  },
  {
    id: 'paper-002',
    name: '小升初数学模拟卷（计算+应用题）',
    grade: '六年级',
    subject: 'math',
    term: '模拟',
    questionCount: 20,
    keyPhrases: ['简便计算', '解方程', '应用题', '行程问题', '工程问题'],
    typicalQuestionTypes: ['计算题', '填空题', '应用题', '解答题'],
  },
  {
    id: 'paper-003',
    name: '六年级数学期末卷（综合）',
    grade: '六年级',
    subject: 'math',
    term: '期末',
    questionCount: 25,
    keyPhrases: ['圆面积', '圆柱体积', '比例', '百分数', '统计图'],
    typicalQuestionTypes: ['选择题', '填空题', '计算题', '应用题'],
  },
]

/**
 * 匹配试卷：根据 OCR 识别文本，查找最可能匹配的已知试卷
 */
export function matchPaper(ocrText: string): {
  matched: boolean
  paperName?: string
  confidence: number
} {
  let bestMatch: PaperSignature | null = null
  let bestScore = 0

  for (const paper of knownPapers) {
    let score = 0
    let matchedPhrases = 0

    // 关键词匹配
    for (const phrase of paper.keyPhrases) {
      if (ocrText.includes(phrase)) {
        score += 10
        matchedPhrases++
      }
    }

    // 题型匹配
    for (const qt of paper.typicalQuestionTypes) {
      if (ocrText.includes(qt)) {
        score += 5
      }
    }

    // 题目数量匹配（粗略）
    const questionCount = (ocrText.match(/第\s*\d+\s*题/g) || []).length
    if (questionCount > 0 && Math.abs(questionCount - paper.questionCount) <= 3) {
      score += 15
    }

    if (score > bestScore) {
      bestScore = score
      bestMatch = paper
    }
  }

  // 置信度计算：最高得分 / 理论满分（简化）
  const maxPossible = 50 // 假设最高 50 分
  const confidence = Math.min(bestScore / maxPossible, 1)

  return {
    matched: confidence >= 0.6,
    paperName: bestMatch?.name,
    confidence: Math.round(confidence * 100) / 100,
  }
}
