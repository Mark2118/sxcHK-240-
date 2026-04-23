/**
 * MiniMax 准确率/速度测试
 * 用法: node scripts/test-accuracy.js
 */

const AI_API_KEY = process.env.AI_API_KEY || ''
const AI_BASE_URL = process.env.AI_BASE_URL || 'https://api.minimaxi.com/v1'
const AI_MODEL = process.env.AI_MODEL || 'MiniMax-M2.7-highspeed'

const prompt = `你是一位教育数据分析模型，基于小升初数学知识体系，对以下学生作业进行客观分析。

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
      "analysis": "客观分析"
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
  "examStrategy": "阶段性学习建议"
}

【分析原则】
1. 必须逐题分析，不遗漏任何题目
2. 知识点标注要精确到知识体系子概念
3. 过程分析：有步骤缺失需指出
4. 初中衔接：说明该知识点与初中内容的关联
5. 只返回 JSON，不要任何解释文字
6. 确保 JSON 完整、格式正确

【作业内容】
1. 计算：125 x 32 x 25 = ?
学生答案：100000

2. 解方程：3x + 5 = 20
学生答案：x = 5

3. 长方形长8cm，宽5cm，求面积。
学生答案：40cm²

4. 甲乙相距360km，A车60km/h，B车40km/h，相向而行，几小时相遇？
学生答案：3.6小时

5. 正方形边长4cm，内有直径4cm的圆，求阴影面积。(π=3.14)
学生答案：3.44cm²

要求：
1. 必须严格按上述 JSON 格式返回
2. 只返回 JSON，不要任何解释
3. 确保 JSON 完整、格式正确`

async function test() {
  console.log('═══════════════════════════════════════')
  console.log('  MiniMax 准确率/速度测试')
  console.log('  模型:', AI_MODEL)
  console.log('═══════════════════════════════════════')

  if (!AI_API_KEY) {
    console.log('[✗] AI_API_KEY 未配置')
    process.exit(1)
  }

  const start = Date.now()
  try {
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

    const elapsed = Date.now() - start
    console.log('[✓] HTTP 状态:', res.status)
    console.log('[✓] 响应时间:', elapsed, 'ms')

    const data = await res.json()
    if (data.error) {
      console.log('[✗] API 错误:', data.error.message)
      process.exit(1)
    }

    const content = data.choices?.[0]?.message?.content
    if (!content) {
      console.log('[✗] 返回内容为空')
      console.log(JSON.stringify(data, null, 2).slice(0, 500))
      process.exit(1)
    }

    // 解析 JSON
    let report
    try {
      report = JSON.parse(content)
    } catch {
      const match = content.match(/\{[\s\S]*\}/)
      if (match) {
        try {
          report = JSON.parse(match[0])
        } catch {
          console.log('[✗] JSON 解析失败')
          console.log('原始内容前500字:', content.slice(0, 500))
          process.exit(1)
        }
      } else {
        console.log('[✗] 内容中无 JSON')
        console.log('原始内容前500字:', content.slice(0, 500))
        process.exit(1)
      }
    }

    // 评估准确率
    console.log('')
    console.log('【结构检查】')
    const requiredFields = ['score', 'totalQuestions', 'correct', 'wrong', 'questions', 'moduleScores', 'weakPoints', 'suggestions', 'examStrategy']
    const missing = requiredFields.filter(f => report[f] === undefined)
    if (missing.length > 0) {
      console.log('[✗] 缺失字段:', missing.join(', '))
    } else {
      console.log('[✓] 全部字段完整')
    }

    console.log('')
    console.log('【结果评估】')
    console.log('  分数:', report.score)
    console.log('  总题数:', report.totalQuestions, '(预期: 5)')
    console.log('  正确:', report.correct, '(预期: 5, 全对)')
    console.log('  错误:', report.wrong, '(预期: 0)')
    console.log('  薄弱点:', report.weakPoints?.join(', ') || '无')
    console.log('  建议数:', report.suggestions?.length || 0)
    console.log('  模块数:', report.moduleScores?.length || 0)

    // 题目数量检查
    const qCount = report.questions?.length || 0
    console.log('')
    console.log('【题目解析】')
    console.log('  解析题数:', qCount, '(预期: 5)')
    if (qCount === 5) {
      console.log('[✓] 题目数量正确')
    } else {
      console.log('[✗] 题目数量错误, 缺少', 5 - qCount, '题')
    }

    // 逐题检查
    if (report.questions) {
      const allCorrect = report.questions.every(q => q.isCorrect === true)
      if (allCorrect) {
        console.log('[✓] 全部判定为正确')
      } else {
        const wrongQs = report.questions.filter(q => !q.isCorrect)
        console.log('[!] 判定为错误的题:', wrongQs.map(q => q.no).join(', '))
      }
    }

    console.log('')
    console.log('【速度评估】')
    if (elapsed < 5000) {
      console.log('[✓] 极速 (' + elapsed + 'ms)')
    } else if (elapsed < 15000) {
      console.log('[✓] 正常 (' + elapsed + 'ms)')
    } else {
      console.log('[!] 偏慢 (' + elapsed + 'ms)')
    }

    // 内容质量抽查
    console.log('')
    console.log('【内容质量抽查】')
    const q1 = report.questions?.[0]
    if (q1) {
      console.log('  第1题知识点:', q1.knowledgePoint || '缺失')
      console.log('  第1题模块:', q1.examModule || '缺失')
      console.log('  第1题分析:', q1.analysis ? q1.analysis.slice(0, 50) + '...' : '缺失')
    }

    console.log('')
    console.log('═══════════════════════════════════════')
    console.log('  测试完成')
    console.log('═══════════════════════════════════════')

  } catch (e) {
    console.log('[✗] 请求失败:', e.message)
    process.exit(1)
  }
}

test()
