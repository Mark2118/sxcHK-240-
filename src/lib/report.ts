import { CheckReport } from './ai'

/**
 * WinGo 学情洞察 — 专业级学情报告渲染器
 * 风格：教育大厂级专业报告，WinGo 品牌标识
 * 红线：不出现 K12 培训相关词汇，定位家庭学情分析工具
 */

export function renderReportHTML(
  report: CheckReport,
  studentName: string = '您的孩子',
  reportId: string = 'WGXQ-' + Date.now().toString(36).toUpperCase()
): string {
  const score = report.score
  const scoreColor = score >= 85 ? '#10b981' : score >= 70 ? '#f59e0b' : '#ef4444'
  const scoreLevel = score >= 90 ? 'A+' : score >= 85 ? 'A' : score >= 80 ? 'B+' : score >= 70 ? 'B' : score >= 60 ? 'C' : 'D'
  const scoreLabel = score >= 85 ? '扎实' : score >= 70 ? '良好' : '需关注'
  const comfortTitle = score >= 85
    ? '知识掌握扎实，继续保持'
    : score >= 70
    ? '整体良好，有明确的提升空间'
    : '正在成长中，方向清晰可提升'

  // 模块数据
  const modules = report.moduleScores
  const moduleBars = modules.map(m => {
    const color = m.status === '扎实' ? '#10b981' : m.status === '提升中' ? '#f59e0b' : '#ef4444'
    return `
    <div style="margin-bottom:16px;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
        <span style="font-size:14px;font-weight:500;color:#1f2937;">${m.module}</span>
        <span style="font-size:14px;font-weight:600;color:${color};">${m.scoreRate}%</span>
      </div>
      <div style="height:10px;background:#f3f4f6;border-radius:5px;overflow:hidden;">
        <div style="height:100%;width:${m.scoreRate}%;background:${color};border-radius:5px;"></div>
      </div>
      <div style="font-size:12px;color:#9ca3af;margin-top:4px;">占比 ${m.weight} · ${m.status}</div>
    </div>`
  }).join('')

  // 知识图谱
  const knowledgeMap = report.questions.map(q => {
    const color = q.isCorrect ? '#10b981' : '#ef4444'
    const bg = q.isCorrect ? '#ecfdf5' : '#fef2f2'
    return `
    <div style="display:inline-block;margin:4px;padding:8px 14px;border-radius:20px;font-size:12px;background:${bg};color:${color};border:1px solid ${color}30;">
      ${q.knowledgePoint || '知识点'}
    </div>`
  }).join('')

  // 逐题诊断
  const questionsHtml = report.questions.map((q) => {
    const isCorrect = q.isCorrect
    const borderColor = isCorrect ? '#10b981' : '#ef4444'
    const bgColor = isCorrect ? '#f0fdf4' : '#fef2f2'
    const badge = isCorrect ? '已掌握' : '待巩固'
    const badgeBg = isCorrect ? '#dcfce7' : '#fee2e2'
    const badgeColor = isCorrect ? '#166534' : '#991b1b'

    return `
    <tr>
      <td style="padding:16px;border-bottom:1px solid #f3f4f6;vertical-align:top;width:60px;">
        <div style="width:36px;height:36px;border-radius:50%;background:${bgColor};color:${borderColor};display:flex;align-items:center;justify-content:center;font-weight:bold;font-size:14px;">${q.no}</div>
      </td>
      <td style="padding:16px;border-bottom:1px solid #f3f4f6;vertical-align:top;">
        <div style="font-weight:600;color:#1f2937;margin-bottom:6px;font-size:14px;">${q.content}</div>
        <div style="display:flex;gap:12px;font-size:12px;color:#6b7280;margin-bottom:8px;flex-wrap:wrap;">
          <span style="background:#f3f4f6;padding:2px 8px;border-radius:4px;">${q.examModule || '计算模块'}</span>
          <span style="background:#f3f4f6;padding:2px 8px;border-radius:4px;">${q.difficulty || '基础'}</span>
          ${q.juniorLink && q.juniorLink !== '无' ? `<span style="background:#eff6ff;padding:2px 8px;border-radius:4px;color:#1e40af;">初中衔接: ${q.juniorLink}</span>` : ''}
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:13px;margin-bottom:8px;">
          <div style="background:#fff7ed;padding:8px;border-radius:6px;"><span style="color:#9ca3af;">孩子答案：</span><span style="color:#92400e;font-weight:500;">${q.studentAnswer}</span></div>
          <div style="background:#f0fdf4;padding:8px;border-radius:6px;"><span style="color:#9ca3af;">参考解析：</span><span style="color:#166534;font-weight:500;">${q.correctAnswer}</span></div>
        </div>
        <div style="background:#f9fafb;padding:10px;border-radius:8px;font-size:13px;color:#374151;line-height:1.6;">
          <strong style="color:#1e3a5f;">💡 知识分析：</strong>${q.analysis}
        </div>
      </td>
      <td style="padding:16px;border-bottom:1px solid #f3f4f6;vertical-align:top;width:80px;text-align:center;">
        <span style="display:inline-block;padding:4px 12px;border-radius:12px;font-size:12px;font-weight:500;background:${badgeBg};color:${badgeColor};">${badge}</span>
        <div style="font-size:11px;color:#9ca3af;margin-top:4px;">${q.processScore || (isCorrect ? '完整' : '需规范')}</div>
      </td>
    </tr>`
  }).join('')

  // 提升建议
  const suggestionsHtml = report.suggestions.map((sg, idx) => `
    <div style="display:flex;gap:12px;padding:14px;background:#f9fafb;border-radius:10px;margin-bottom:10px;">
      <div style="width:28px;height:28px;border-radius:50%;background:#1e3a5f;color:white;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:bold;flex-shrink:0;">${idx + 1}</div>
      <div style="font-size:14px;color:#374151;line-height:1.6;">${sg}</div>
    </div>
  `).join('')

  // 推荐练习
  const exercisesHtml = report.recommendedExercises.map(ex => {
    const diffColors: Record<string, string> = { '基础': '#10b981', '提高': '#f59e0b', '思维拓展': '#8b5cf6', '初中衔接': '#3b82f6' }
    const color = diffColors[ex.difficulty] || '#6b7280'
    return `
    <div style="padding:14px;border:1px solid #e5e7eb;border-radius:10px;margin-bottom:8px;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
        <span style="font-weight:500;color:#1f2937;font-size:14px;">${ex.module} · ${ex.type}</span>
        <span style="padding:3px 10px;border-radius:10px;font-size:11px;background:${color}15;color:${color};font-weight:500;">${ex.difficulty}</span>
      </div>
      <div style="font-size:13px;color:#6b7280;">${ex.desc}</div>
    </div>
    `
  }).join('')

  // 家长行动清单（非培训导向）
  const parentActions = score >= 85
    ? [
        '保持现有学习节奏，关注孩子学习兴趣的维护',
        '适当增加思维拓展内容，为初中学习做好衔接',
        '定期使用 WinGo 学情洞察进行阶段性分析',
      ]
    : score >= 70
    ? [
        '重点关注应用题模块（占比35%，影响整体掌握度）',
        '每天安排20分钟专项练习，建议使用 WinGo 生成的个性化练习',
        '建立家庭错题本，周末回顾本周分析结果',
      ]
    : [
        '从计算模块开始系统巩固（基础能力，影响后续学习）',
        '每天固定时间段进行数学练习，养成良好习惯',
        '使用 WinGo 学情洞察定期跟踪进步情况',
      ]

  const parentActionsHtml = parentActions.map(a => `
    <div style="padding:12px 16px;background:#fff;border:1px solid #e5e7eb;border-radius:8px;margin-bottom:8px;font-size:14px;color:#374151;">${a}</div>
  `).join('')

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${studentName} 的学情分析报告 - WinGo 学情洞察</title>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family:-apple-system,BlinkMacSystemFont,'Segoe UI','PingFang SC','Microsoft YaHei',sans-serif; background:#f5f7fa; color:#1f2937; line-height:1.6; }
  .container { max-width:900px; margin:0 auto; background:white; }
  .page { padding:40px; page-break-after:always; }
  .page:last-child { page-break-after:auto; }
  @media print { .page { padding:30px; } body { background:white; } }

  /* WinGo Header */
  .report-header { background:linear-gradient(135deg,#1e3a5f 0%,#2d5a87 50%,#3b82f6 100%); color:white; padding:40px; text-align:center; position:relative; overflow:hidden; }
  .report-header::before { content:''; position:absolute; top:-50%; right:-20%; width:400px; height:400px; background:rgba(255,255,255,0.05); border-radius:50%; }
  .report-header::after { content:''; position:absolute; bottom:-30%; left:-10%; width:300px; height:300px; background:rgba(255,255,255,0.03); border-radius:50%; }
  .wingo-brand { display:flex; align-items:center; justify-content:center; gap:10px; margin-bottom:20px; position:relative; }
  .wingo-logo { width:36px; height:36px; background:rgba(255,255,255,0.2); border-radius:10px; display:flex; align-items:center; justify-content:center; font-weight:800; font-size:16px; backdrop-filter:blur(4px); }
  .wingo-name { font-size:16px; font-weight:600; letter-spacing:1px; }
  .report-badge { display:inline-block; padding:6px 16px; background:rgba(255,255,255,0.15); border-radius:20px; font-size:12px; letter-spacing:1px; margin-bottom:16px; backdrop-filter:blur(4px); }
  .report-header h1 { font-size:28px; font-weight:700; margin-bottom:8px; position:relative; }
  .report-header .subtitle { font-size:14px; opacity:0.85; position:relative; }
  .report-id { font-size:12px; opacity:0.6; margin-top:12px; position:relative; }

  /* Score Ring */
  .score-section { text-align:center; padding:40px 0; }
  .score-ring { width:180px; height:180px; margin:0 auto 24px; position:relative; }
  .score-ring svg { transform:rotate(-90deg); }
  .score-ring-bg { fill:none; stroke:#f3f4f6; stroke-width:12; }
  .score-ring-fill { fill:none; stroke-width:12; stroke-linecap:round; }
  .score-text { position:absolute; top:50%; left:50%; transform:translate(-50%,-50%); text-align:center; }
  .score-number { font-size:48px; font-weight:800; line-height:1; }
  .score-label { font-size:14px; color:#6b7280; margin-top:4px; }
  .score-level { display:inline-block; padding:6px 20px; border-radius:20px; font-size:14px; font-weight:600; margin-top:16px; }

  /* Summary Cards */
  .summary-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:16px; margin:32px 0; }
  .summary-card { background:#f9fafb; border-radius:12px; padding:20px; text-align:center; border:1px solid #f3f4f6; }
  .summary-card .num { font-size:28px; font-weight:700; color:#1e3a5f; }
  .summary-card .label { font-size:12px; color:#6b7280; margin-top:4px; }

  /* Section */
  .section { margin-bottom:32px; }
  .section-title { font-size:18px; font-weight:700; color:#1e3a5f; margin-bottom:20px; padding-bottom:10px; border-bottom:2px solid #e5e7eb; display:flex; align-items:center; gap:8px; }
  .section-title .icon { width:32px; height:32px; background:#eff6ff; border-radius:8px; display:flex; align-items:center; justify-content:center; font-size:16px; }

  /* Comfort Box */
  .comfort-box { background:linear-gradient(135deg,#eff6ff 0%,#f0fdf4 100%); border-radius:16px; padding:24px; border:1px solid #dbeafe; margin-bottom:32px; }
  .comfort-box h3 { color:#1e40af; font-size:16px; margin-bottom:8px; }
  .comfort-box p { color:#4b5563; font-size:14px; line-height:1.8; }

  /* Table */
  .data-table { width:100%; border-collapse:collapse; }
  .data-table th { background:#f9fafb; padding:12px 16px; text-align:left; font-size:12px; font-weight:600; color:#6b7280; text-transform:uppercase; letter-spacing:0.5px; border-bottom:2px solid #e5e7eb; }

  /* Action Box */
  .action-box { background:#fefce8; border-radius:12px; padding:20px; border-left:4px solid #eab308; }
  .action-box h4 { color:#854d0e; font-size:15px; margin-bottom:12px; }

  /* Strategy Box */
  .strategy-box { background:linear-gradient(135deg,#eff6ff 0%,#eef2ff 100%); border-radius:12px; padding:24px; border:1px solid #dbeafe; }
  .strategy-box h4 { color:#1e40af; font-size:16px; margin-bottom:12px; }
  .strategy-box p { color:#374151; font-size:14px; line-height:1.8; }

  /* Footer */
  .report-footer { background:#f9fafb; padding:24px 40px; text-align:center; border-top:1px solid #e5e7eb; }
  .report-footer p { font-size:12px; color:#9ca3af; margin-bottom:4px; }
  .brand { font-weight:600; color:#1e3a5f; }
  .disclaimer { font-size:11px; color:#9ca3af; margin-top:8px; padding:12px; background:#f3f4f6; border-radius:8px; }

  @media (max-width:640px) {
    .page { padding:20px; }
    .summary-grid { grid-template-columns:repeat(2,1fr); }
    .report-header h1 { font-size:22px; }
  }
</style>
</head>
<body>
<div class="container">

  <!-- 封面 -->
  <div class="page">
    <div class="report-header">
      <div class="wingo-brand">
        <div class="wingo-logo">W</div>
        <div class="wingo-name">WinGo 学情洞察</div>
      </div>
      <div class="report-badge">LEARNING INSIGHT REPORT</div>
      <h1>学情分析报告</h1>
      <p class="subtitle">AI 驱动的家庭学情分析工具 · 客观数据 · 科学建议</p>
      <p class="report-id">报告编号：${reportId} · 生成时间：${new Date().toLocaleString('zh-CN')}</p>
    </div>

    <div class="score-section">
      <div class="score-ring">
        <svg width="180" height="180" viewBox="0 0 180 180">
          <circle class="score-ring-bg" cx="90" cy="90" r="78"/>
          <circle class="score-ring-fill" cx="90" cy="90" r="78" stroke="${scoreColor}"
            stroke-dasharray="${Math.round(score * 4.9)} 490" stroke-dashoffset="0"/>
        </svg>
        <div class="score-text">
          <div class="score-number" style="color:${scoreColor};">${score}</div>
          <div class="score-label">掌握度指数</div>
        </div>
      </div>
      <div class="score-level" style="background:${scoreColor}15;color:${scoreColor};">
        等级 ${scoreLevel} · ${scoreLabel}
      </div>
    </div>

    <div class="summary-grid">
      <div class="summary-card">
        <div class="num">${report.totalQuestions}</div>
        <div class="label">分析题数</div>
      </div>
      <div class="summary-card">
        <div class="num" style="color:#10b981;">${report.correct}</div>
        <div class="label">已掌握</div>
      </div>
      <div class="summary-card">
        <div class="num" style="color:#ef4444;">${report.wrong}</div>
        <div class="label">待巩固</div>
      </div>
      <div class="summary-card">
        <div class="num" style="color:#f59e0b;">${Math.round(report.correct / report.totalQuestions * 100)}%</div>
        <div class="label">掌握率</div>
      </div>
    </div>

    <div class="comfort-box">
      <h3>📋 分析结论：${comfortTitle}</h3>
      <p>
        ${score >= 85
          ? `${studentName}的知识体系构建较为完善，五大模块中大部分已掌握扎实。建议保持现有学习节奏，适当增加思维拓展内容，为下一阶段学习做好衔接准备。`
          : score >= 70
          ? `${studentName}的基础知识框架已经搭建完成，大部分常规内容能够正确理解。当前主要提升空间集中在应用题模块（占比35%）和部分几何综合内容。建议制定为期4-6周的专项提升计划，配合 WinGo 学情洞察定期跟踪。`
          : `${studentName}目前处于基础积累阶段，计算模块等基础内容需要首先确保扎实。建议从基础概念入手，采用循序渐进的方式，配合 WinGo 学情洞察定期分析，可以看到稳步进步。`
        }
      </p>
    </div>

    <div class="disclaimer">
      <strong>声明：</strong> WinGo 学情洞察是一款家庭学情分析软件工具，提供的分析报告仅供家长参考，帮助了解孩子的学习情况。本工具不涉及任何教育培训、授课或辅导服务。具体学习规划建议咨询学校教师或教育专业人士。
    </div>
  </div>

  <!-- 第二页：模块分析 -->
  <div class="page">
    <div class="section">
      <div class="section-title"><span class="icon">📊</span>五大模块掌握情况</div>
      ${moduleBars}
    </div>

    <div class="section">
      <div class="section-title"><span class="icon">🧠</span>知识点掌握图谱</div>
      <p style="font-size:13px;color:#6b7280;margin-bottom:12px;">绿色 = 已掌握 · 红色 = 待巩固</p>
      <div style="padding:16px;background:#f9fafb;border-radius:12px;">
        ${knowledgeMap}
      </div>
    </div>

    <div class="section">
      <div class="section-title"><span class="icon">🎯</span>家庭行动建议</div>
      <div class="action-box">
        <h4>根据本次分析，建议您本周关注以下事项：</h4>
        ${parentActionsHtml}
      </div>
    </div>
  </div>

  <!-- 第三页：逐题分析 -->
  <div class="page">
    <div class="section">
      <div class="section-title"><span class="icon">📝</span>逐题分析详情</div>
      <table class="data-table" style="width:100%;">
        <thead>
          <tr>
            <th style="width:60px;">题号</th>
            <th>题目与分析</th>
            <th style="width:80px;text-align:center;">状态</th>
          </tr>
        </thead>
        <tbody>
          ${questionsHtml}
        </tbody>
      </table>
    </div>
  </div>

  <!-- 第四页：学习建议 -->
  <div class="page">
    <div class="section">
      <div class="section-title"><span class="icon">💡</span>提升建议</div>
      ${suggestionsHtml}
    </div>

    <div class="section">
      <div class="section-title"><span class="icon">📚</span>推荐专项内容</div>
      ${exercisesHtml}
    </div>

    <div class="section">
      <div class="section-title"><span class="icon">🚀</span>阶段性学习建议</div>
      <div class="strategy-box">
        <p>${report.examStrategy}</p>
      </div>
    </div>

    <div class="section">
      <div class="section-title"><span class="icon">📈</span>下一步跟踪计划</div>
      <div style="background:#f0fdf4;border-radius:12px;padding:20px;border:1px solid #bbf7d0;">
        <p style="font-size:14px;color:#166534;line-height:1.8;">
          <strong>建议2周后再次分析</strong>，对比本次数据观察进步情况。<br>
          WinGo 学情洞察将持续追踪学习轨迹，生成趋势分析。<br>
          每次分析后，系统将自动生成针对性的学习内容推荐，帮助孩子高效突破薄弱环节。
        </p>
      </div>
    </div>
  </div>

  <div class="report-footer">
    <div class="wingo-brand" style="margin-bottom:12px;justify-content:center;">
      <div class="wingo-logo" style="background:#1e3a5f;color:white;width:32px;height:32px;font-size:14px;">W</div>
      <div class="wingo-name" style="color:#1e3a5f;font-size:16px;">WinGo 学情洞察</div>
    </div>
    <p>AI 驱动的家庭学情分析工具 · 让每个家庭都懂孩子的学习</p>
    <p style="margin-top:4px;font-size:12px;color:#6b7280;">Powered by WinGo 学情引擎</p>
    <p>报告编号：${reportId} · 生成时间：${new Date().toLocaleString('zh-CN')}</p>
    <div class="disclaimer">
      本报告由 WinGo 学情洞察软件自动生成。数据仅供参考。本工具为家庭学情分析软件，不涉及任何教育培训、授课或辅导服务。
    </div>
  </div>
</div>
</body>
</html>`
}
