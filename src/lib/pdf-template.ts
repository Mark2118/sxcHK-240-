/**
 * WinGo 学情引擎 — PDF HTML 模板
 * 精美排版，支持中文，适配 puppeteer-core 转 PDF
 */

// ============================================
// 通用样式 & 工具
// ============================================

const commonStyles = `
  <style>
    @page {
      size: A4;
      margin: 0;
    }
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: "Microsoft YaHei", "SimHei", "PingFang SC", "Noto Sans SC", sans-serif;
      color: #1f2937;
      line-height: 1.6;
      background: #fff;
    }
    .page {
      width: 210mm;
      min-height: 297mm;
      padding: 24mm 20mm;
      page-break-after: always;
      position: relative;
    }
    .page:last-child {
      page-break-after: auto;
    }
    .brand-bar {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 6px;
      background: linear-gradient(90deg, #1e3a5f 0%, #2563eb 50%, #1e3a5f 100%);
    }
    .footer-bar {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      height: 4px;
      background: linear-gradient(90deg, #1e3a5f 0%, #2563eb 50%, #1e3a5f 100%);
    }
    .page-footer {
      position: absolute;
      bottom: 10mm;
      left: 20mm;
      right: 20mm;
      font-size: 9px;
      color: #9ca3af;
      text-align: center;
      border-top: 1px solid #e5e7eb;
      padding-top: 4mm;
    }
    h1 { font-size: 24px; font-weight: 700; color: #1e3a5f; }
    h2 { font-size: 18px; font-weight: 700; color: #1e3a5f; margin-bottom: 12px; }
    h3 { font-size: 14px; font-weight: 600; color: #374151; margin-bottom: 8px; }
    .subtitle { font-size: 12px; color: #6b7280; }
    .card {
      background: #f9fafb;
      border-radius: 12px;
      padding: 16px;
      margin-bottom: 16px;
      border: 1px solid #e5e7eb;
    }
    .card-highlight {
      background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
      border: 1px solid #bfdbfe;
    }
    .badge {
      display: inline-block;
      padding: 4px 10px;
      border-radius: 999px;
      font-size: 11px;
      font-weight: 600;
    }
    .badge-green { background: #dcfce7; color: #166534; }
    .badge-amber { background: #fef3c7; color: #92400e; }
    .badge-red { background: #fee2e2; color: #991b1b; }
    .badge-blue { background: #dbeafe; color: #1e40af; }
    .score-big {
      font-size: 56px;
      font-weight: 800;
      line-height: 1;
    }
    .score-label {
      font-size: 12px;
      color: #6b7280;
      margin-top: 4px;
    }
    .grid-3 {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 12px;
    }
    .grid-5 {
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      gap: 8px;
    }
    .text-center { text-align: center; }
    .text-green { color: #16a34a; }
    .text-amber { color: #d97706; }
    .text-red { color: #dc2626; }
    .text-blue { color: #2563eb; }
    .bg-green { background: #f0fdf4; }
    .bg-amber { background: #fffbeb; }
    .bg-red { background: #fef2f2; }
    .mb-2 { margin-bottom: 8px; }
    .mb-3 { margin-bottom: 12px; }
    .mb-4 { margin-bottom: 16px; }
    .mt-2 { margin-top: 8px; }
    .mt-3 { margin-top: 12px; }
    .flex { display: flex; }
    .items-center { align-items: center; }
    .justify-between { justify-content: space-between; }
    .gap-2 { gap: 8px; }
    .gap-3 { gap: 12px; }
    .rounded-xl { border-radius: 12px; }
    .p-3 { padding: 12px; }
    .p-4 { padding: 16px; }
    .text-sm { font-size: 12px; }
    .text-xs { font-size: 10px; }
    .font-bold { font-weight: 700; }
    .font-semibold { font-weight: 600; }
    .border-l-4 { border-left: 4px solid; }
    .border-green { border-color: #22c55e; }
    .border-red { border-color: #ef4444; }
    .list-number {
      display: flex;
      align-items: flex-start;
      gap: 8px;
      margin-bottom: 8px;
    }
    .list-number > span {
      width: 20px;
      height: 20px;
      background: #dbeafe;
      color: #1e40af;
      border-radius: 50%;
      font-size: 11px;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .question-card {
      background: #fff;
      border-radius: 10px;
      padding: 14px;
      margin-bottom: 12px;
      border: 1px solid #e5e7eb;
    }
    .exercise-card {
      background: #fff;
      border-radius: 10px;
      padding: 14px;
      margin-bottom: 12px;
      border: 1px solid #e5e7eb;
    }
    .cover-logo {
      width: 72px;
      height: 72px;
      background: linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%);
      border-radius: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #fff;
      font-size: 36px;
      font-weight: 800;
      margin-bottom: 24px;
    }
    .cover-title {
      font-size: 32px;
      font-weight: 800;
      color: #1e3a5f;
      margin-bottom: 8px;
    }
    .cover-subtitle {
      font-size: 16px;
      color: #6b7280;
      margin-bottom: 48px;
    }
    .cover-meta {
      font-size: 13px;
      color: #9ca3af;
    }
    .cover-meta strong {
      color: #4b5563;
    }
    .disclaimer {
      background: #fffbeb;
      border: 1px solid #fcd34d;
      border-radius: 10px;
      padding: 12px;
      font-size: 10px;
      color: #92400e;
      text-align: center;
      margin-top: 24px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 11px;
    }
    th, td {
      padding: 8px 10px;
      text-align: left;
      border-bottom: 1px solid #e5e7eb;
    }
    th {
      background: #f3f4f6;
      font-weight: 600;
      color: #374151;
    }
  </style>
`

// ============================================
// 报告 PDF 模板
// ============================================

export interface ReportPDFData {
  id: string
  subject: string
  score: number
  totalQuestions: number
  correct: number
  wrong: number
  createdAt: string
  report?: {
    score: number
    totalQuestions: number
    correct: number
    wrong: number
    moduleScores: Array<{
      module: string
      scoreRate: number
      weight: string
      status: string
    }>
    weakPoints: string[]
    suggestions: string[]
    examStrategy: string
    questions: Array<{
      no: number
      content: string
      studentAnswer: string
      correctAnswer: string
      isCorrect: boolean
      analysis: string
      knowledgePoint: string
    }>
  }
  exercises?: {
    title: string
    description: string
    summary: string
    exercises: Array<{
      no: number
      type: string
      content: string
      answer: string
      analysis: string
      difficulty: string
      knowledgePoint: string
    }>
  }
  userName?: string
}

export function generateReportPDFHtml(data: ReportPDFData): string {
  const report = data.report
  const score = data.score
  const scoreColor = score >= 85 ? 'text-green' : score >= 70 ? 'text-amber' : 'text-red'
  const scoreBg = score >= 85 ? 'bg-green' : score >= 70 ? 'bg-amber' : 'bg-red'

  const dateStr = data.createdAt
    ? new Date(data.createdAt).toLocaleString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })
    : new Date().toLocaleString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })

  // 封面页
  const coverPage = `
    <div class="page" style="display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;">
      <div class="brand-bar"></div>
      <div class="cover-logo">W</div>
      <div class="cover-title">WinGo 学情分析报告</div>
      <div class="cover-subtitle">${data.userName || '孩子'} 的 ${data.subject || '数学'} 学情诊断</div>
      <div class="cover-meta">
        <p><strong>报告编号：</strong>${data.id}</p>
        <p><strong>生成时间：</strong>${dateStr}</p>
        <p><strong>总题数：</strong>${data.totalQuestions} 题 &nbsp;|&nbsp; <strong>掌握度：</strong>${data.score}%</p>
      </div>
      <div class="footer-bar"></div>
    </div>
  `

  // 总览页
  const overviewPage = `
    <div class="page">
      <div class="brand-bar"></div>
      <h2 style="margin-bottom:20px;">📊 学情总览</h2>

      <div class="flex gap-3 mb-4" style="align-items:stretch;">
        <div class="card ${scoreBg} text-center" style="flex:0 0 140px;display:flex;flex-direction:column;justify-content:center;align-items:center;">
          <div class="score-big ${scoreColor}">${score}</div>
          <div class="score-label">掌握度 %</div>
        </div>
        <div class="grid-3" style="flex:1;">
          <div class="card text-center">
            <div style="font-size:28px;font-weight:800;color:#1f2937;">${data.totalQuestions}</div>
            <div class="score-label">总题数</div>
          </div>
          <div class="card text-center bg-green">
            <div style="font-size:28px;font-weight:800;color:#16a34a;">${data.correct}</div>
            <div class="score-label">已掌握</div>
          </div>
          <div class="card text-center bg-red">
            <div style="font-size:28px;font-weight:800;color:#dc2626;">${data.wrong}</div>
            <div class="score-label">待巩固</div>
          </div>
        </div>
      </div>

      ${report?.moduleScores?.length ? `
        <h3 style="margin-top:20px;">五大模块掌握情况</h3>
        <div class="grid-5 mb-4">
          ${report.moduleScores.map(m => {
            const color = m.status === '扎实' ? 'text-green' : m.status === '提升中' ? 'text-amber' : 'text-red'
            const bg = m.status === '扎实' ? 'bg-green' : m.status === '提升中' ? 'bg-amber' : 'bg-red'
            return `
              <div class="card ${bg} text-center" style="padding:12px 8px;">
                <div style="font-size:22px;font-weight:800;${color.replace('text-', 'color:#') === 'color:#text-green' ? 'color:#16a34a;' : color === 'text-amber' ? 'color:#d97706;' : 'color:#dc2626;'}">${m.scoreRate}%</div>
                <div class="text-xs" style="margin-top:4px;font-weight:600;">${m.module}</div>
                <div class="text-xs" style="color:#9ca3af;">${m.status}</div>
              </div>
            `
          }).join('')}
        </div>
      ` : ''}

      ${report?.weakPoints?.length ? `
        <h3 style="margin-top:16px;">重点提升方向</h3>
        <div class="flex gap-2" style="flex-wrap:wrap;margin-bottom:16px;">
          ${report.weakPoints.map(wp => `<span class="badge badge-amber">${wp}</span>`).join('')}
        </div>
      ` : ''}

      ${report?.examStrategy ? `
        <div class="card card-highlight">
          <h3>🎯 阶段性学习建议</h3>
          <p class="text-sm" style="color:#1e40af;line-height:1.8;">${report.examStrategy}</p>
        </div>
      ` : ''}

      <div class="page-footer">WinGo 学情引擎 · 家庭学情分析工具 · 报告仅供参考</div>
      <div class="footer-bar"></div>
    </div>
  `

  // 逐题解析页
  let questionsPages = ''
  if (report?.questions?.length) {
    const chunks: typeof report.questions[] = []
    for (let i = 0; i < report.questions.length; i += 4) {
      chunks.push(report.questions.slice(i, i + 4))
    }

    questionsPages = chunks.map((chunk, idx) => `
      <div class="page">
        <div class="brand-bar"></div>
        <h2 style="margin-bottom:20px;">📝 逐题解析（${idx * 4 + 1} - ${Math.min((idx + 1) * 4, report.questions.length)} / ${report.questions.length}）</h2>
        ${chunk.map(q => `
          <div class="question-card border-l-4 ${q.isCorrect ? 'border-green' : 'border-red'}">
            <div class="flex items-center justify-between mb-2">
              <div class="flex items-center gap-2">
                <span class="badge ${q.isCorrect ? 'badge-green' : 'badge-red'}">第${q.no}题</span>
                <span class="badge badge-blue">${q.knowledgePoint || '知识点'}</span>
              </div>
              <span class="badge ${q.isCorrect ? 'badge-green' : 'badge-red'}">${q.isCorrect ? '✅ 已掌握' : '❌ 待巩固'}</span>
            </div>
            <p class="text-sm mb-2"><strong>题目：</strong>${q.content}</p>
            <p class="text-sm mb-2"><strong>孩子答案：</strong><span style="color:${q.isCorrect ? '#16a34a' : '#dc2626'};">${q.studentAnswer}</span></p>
            <p class="text-sm mb-2"><strong>参考解析：</strong>${q.correctAnswer}</p>
            <div class="card" style="background:#f8fafc;margin-bottom:0;">
              <p class="text-sm"><strong>知识分析：</strong>${q.analysis}</p>
            </div>
          </div>
        `).join('')}
        <div class="page-footer">WinGo 学情引擎 · 家庭学情分析工具 · 报告仅供参考</div>
        <div class="footer-bar"></div>
      </div>
    `).join('')
  }

  // 专项练习页
  let exercisesPage = ''
  if (data.exercises?.exercises?.length) {
    const ex = data.exercises
    const exChunks: typeof ex.exercises[] = []
    for (let i = 0; i < ex.exercises.length; i += 3) {
      exChunks.push(ex.exercises.slice(i, i + 3))
    }

    exercisesPage = exChunks.map((chunk, idx) => `
      <div class="page">
        <div class="brand-bar"></div>
        <h2 style="margin-bottom:16px;">✏️ 专项练习（${idx * 3 + 1} - ${Math.min((idx + 1) * 3, ex.exercises.length)} / ${ex.exercises.length}）</h2>
        <div class="card card-highlight mb-4">
          <h3>${ex.title}</h3>
          <p class="text-sm" style="color:#1e40af;">${ex.description}</p>
        </div>
        ${chunk.map(e => {
          const diffColor = e.difficulty === '基础' ? 'badge-green' : e.difficulty === '提高' ? 'badge-amber' : 'badge-red'
          return `
            <div class="exercise-card">
              <div class="flex items-center justify-between mb-2">
                <div class="flex items-center gap-2">
                  <span class="badge badge-blue">${e.no}</span>
                  <span class="text-xs text-gray-500">${e.type}</span>
                </div>
                <span class="badge ${diffColor}">${e.difficulty}</span>
              </div>
              <p class="text-sm font-semibold mb-3" style="line-height:1.7;">${e.content}</p>
              <div class="card bg-green" style="margin-bottom:8px;">
                <p class="text-sm"><strong>答案：</strong>${e.answer}</p>
              </div>
              <div class="card card-highlight" style="margin-bottom:0;">
                <p class="text-sm"><strong>解析：</strong>${e.analysis}</p>
              </div>
            </div>
          `
        }).join('')}
        <div class="page-footer">WinGo 学情引擎 · 家庭学情分析工具 · 报告仅供参考</div>
        <div class="footer-bar"></div>
      </div>
    `).join('')
  }

  // 行动清单页
  let actionPage = ''
  if (report?.weakPoints?.length || report?.suggestions?.length) {
    const actions: string[] = []
    report.weakPoints.forEach(wp => actions.push(`重点巩固：${wp}`))
    const wrongQs = (report.questions || []).filter(q => !q.isCorrect)
    wrongQs.slice(0, 3).forEach(q => actions.push(`重做第${q.no}题：${q.knowledgePoint || '相关知识点'}`))
    report.suggestions.slice(0, 2).forEach(sg => actions.push(sg))
    actions.push('建议 2 周后再次分析，对比本次数据观察进步情况')

    actionPage = `
      <div class="page">
        <div class="brand-bar"></div>
        <h2 style="margin-bottom:20px;">🎯 今晚行动清单</h2>
        <div class="card card-highlight mb-4">
          <p class="text-sm" style="color:#1e40af;">基于本次学情分析，今晚就可以开始的针对性行动</p>
        </div>
        ${actions.map((a, i) => `
          <div class="list-number">
            <span>${i + 1}</span>
            <div class="text-sm" style="padding-top:1px;">${a}</div>
          </div>
        `).join('')}
        <div class="disclaimer">
          💡 完成以上行动后，建议 2 周后再次分析，观察薄弱点改善情况
        </div>
        <div class="page-footer">WinGo 学情引擎 · 家庭学情分析工具 · 报告仅供参考</div>
        <div class="footer-bar"></div>
      </div>
    `
  }

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <title>WinGo 学情分析报告 - ${data.id}</title>
  ${commonStyles}
</head>
<body>
  ${coverPage}
  ${overviewPage}
  ${questionsPages}
  ${exercisesPage}
  ${actionPage}
</body>
</html>`
}

// ============================================
// 月度总结 PDF 模板
// ============================================

export interface MonthlyPDFData {
  period: { start: string; end: string }
  totalReports: number
  avgScore: number
  weakPointsTop3: Array<{ name: string; count: number }>
  bestImprovementModule: {
    module: string
    currentAvg: number
    prevAvg: number
    improvement: number
  } | null
  monthOverMonth: {
    reportCountChange: number
    avgScoreChange: number
    prevMonthReports: number
    prevMonthAvgScore: number
  }
  userName?: string
}

export function generateMonthlyPDFHtml(data: MonthlyPDFData): string {
  const periodLabel = `${data.period.start.slice(0, 7).replace('-', '年')}月`
  const scoreColor = data.avgScore >= 85 ? 'text-green' : data.avgScore >= 70 ? 'text-amber' : 'text-red'
  const scoreBg = data.avgScore >= 85 ? 'bg-green' : data.avgScore >= 70 ? 'bg-amber' : 'bg-red'

  const dateStr = new Date().toLocaleString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })

  // 封面页
  const coverPage = `
    <div class="page" style="display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;">
      <div class="brand-bar"></div>
      <div class="cover-logo">W</div>
      <div class="cover-title">WinGo 月度学情总结</div>
      <div class="cover-subtitle">${data.userName || '孩子'} 的 ${periodLabel}学情总结</div>
      <div class="cover-meta">
        <p><strong>统计周期：</strong>${data.period.start} ~ ${data.period.end}</p>
        <p><strong>报告生成时间：</strong>${dateStr}</p>
        <p><strong>本月分析次数：</strong>${data.totalReports} 次</p>
      </div>
      <div class="footer-bar"></div>
    </div>
  `

  // 核心指标页
  const metricsPage = `
    <div class="page">
      <div class="brand-bar"></div>
      <h2 style="margin-bottom:20px;">📊 核心指标</h2>

      <div class="grid-3 mb-4">
        <div class="card ${scoreBg} text-center">
          <div class="score-big ${scoreColor}">${data.avgScore}</div>
          <div class="score-label">平均掌握度 %</div>
          <div class="text-xs mt-2" style="color:${data.monthOverMonth.avgScoreChange >= 0 ? '#16a34a' : '#dc2626'};">
            ${data.monthOverMonth.avgScoreChange >= 0 ? '↑' : '↓'} ${Math.abs(data.monthOverMonth.avgScoreChange)}% 环比
          </div>
        </div>
        <div class="card text-center">
          <div class="score-big text-blue">${data.totalReports}</div>
          <div class="score-label">分析次数</div>
          <div class="text-xs mt-2" style="color:${data.monthOverMonth.reportCountChange >= 0 ? '#16a34a' : '#dc2626'};">
            ${data.monthOverMonth.reportCountChange >= 0 ? '↑' : '↓'} ${Math.abs(data.monthOverMonth.reportCountChange)} 次 环比
          </div>
        </div>
        <div class="card text-center">
          ${data.bestImprovementModule ? `
            <div style="font-size:20px;font-weight:800;color:#1f2937;margin-bottom:4px;">${data.bestImprovementModule.module}</div>
            <div class="score-label">进步最大模块</div>
            <div class="text-xs mt-2" style="color:#16a34a;">
              ${data.bestImprovementModule.prevAvg}% → ${data.bestImprovementModule.currentAvg}%（+${data.bestImprovementModule.improvement}%）
            </div>
          ` : `
            <div style="font-size:14px;color:#9ca3af;padding-top:16px;">数据不足</div>
            <div class="score-label">继续分析以获取趋势</div>
          `}
        </div>
      </div>

      ${data.weakPointsTop3.length > 0 ? `
        <h3 style="margin-top:20px;margin-bottom:12px;">🔴 本月重点薄弱点 TOP3</h3>
        <table style="margin-bottom:16px;">
          <thead>
            <tr>
              <th style="width:60px;">排名</th>
              <th>薄弱点</th>
              <th style="width:100px;">出现次数</th>
            </tr>
          </thead>
          <tbody>
            ${data.weakPointsTop3.map((wp, i) => `
              <tr>
                <td><span class="badge badge-red">${i + 1}</span></td>
                <td class="font-semibold">${wp.name}</td>
                <td>${wp.count} 次</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      ` : `
        <div class="card text-center" style="padding:32px;">
          <div style="font-size:28px;margin-bottom:8px;">⭐</div>
          <p class="text-sm text-gray-500">本月暂无薄弱点记录，继续上传作业获取分析</p>
        </div>
      `}

      <div class="page-footer">WinGo 学情引擎 · 家庭学情分析工具 · 报告仅供参考</div>
      <div class="footer-bar"></div>
    </div>
  `

  // 建议页
  const advicePage = `
    <div class="page">
      <div class="brand-bar"></div>
      <h2 style="margin-bottom:20px;">📋 下月学习建议</h2>

      <div class="card card-highlight mb-4">
        <p class="text-sm" style="color:#1e40af;">基于本月学情数据，为您生成的个性化学习建议</p>
      </div>

      ${data.weakPointsTop3.length > 0 ? `
        <div class="list-number">
          <span>1</span>
          <div>
            <p class="font-semibold text-sm">重点攻克</p>
            <p class="text-sm">${data.weakPointsTop3[0]?.name || '薄弱点'}，建议每周专项练习 3 次</p>
          </div>
        </div>
      ` : ''}

      ${data.bestImprovementModule ? `
        <div class="list-number">
          <span>2</span>
          <div>
            <p class="font-semibold text-sm">保持优势</p>
            <p class="text-sm">${data.bestImprovementModule.module} 已有进步，继续保持当前学习方法</p>
          </div>
        </div>
      ` : ''}

      <div class="list-number">
        <span>${data.bestImprovementModule && data.weakPointsTop3.length > 0 ? 3 : data.bestImprovementModule || data.weakPointsTop3.length > 0 ? 2 : 1}</span>
        <div>
          <p class="font-semibold text-sm">定期分析</p>
          <p class="text-sm">建议每 2 周使用 WinGo 分析一次，持续追踪薄弱点改善情况</p>
        </div>
      </div>

      <div class="list-number">
        <span>${data.bestImprovementModule && data.weakPointsTop3.length > 0 ? 4 : data.bestImprovementModule || data.weakPointsTop3.length > 0 ? 3 : 2}</span>
        <div>
          <p class="font-semibold text-sm">错题回顾</p>
          <p class="text-sm">每周回顾一次错题，重点关注重复出错的薄弱点</p>
        </div>
      </div>

      <div class="disclaimer" style="margin-top:32px;">
        WinGo 学情洞察是一款家庭学情分析软件工具，报告仅供家长参考，不涉及任何教育培训服务
      </div>

      <div class="page-footer">WinGo 学情引擎 · 家庭学情分析工具 · 报告仅供参考</div>
      <div class="footer-bar"></div>
    </div>
  `

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <title>WinGo 月度学情总结 - ${periodLabel}</title>
  ${commonStyles}
</head>
<body>
  ${coverPage}
  ${metricsPage}
  ${advicePage}
</body>
</html>`
}
