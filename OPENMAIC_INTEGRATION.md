# OpenMAIC 集成方案 —— AI作业批改系统

## 一、OpenMAIC 是什么

OpenMAIC = Open + MAIC (Multi-Agent Interactive Classroom)
- **技术栈**: Next.js 16 + LangGraph + TypeScript
- **核心能力**: AI课堂生成、多场景教学（幻灯片/互动/测验/白板）、内容资产生产
- **部署状态**: 已在 Mac mini (100.106.90.55:3000) 稳定运行

## 二、在作业批改流程中的 4 大集成点

### 集成点 1: 诊断 → 个性化微课生成

**场景**: 孩子"行程问题"总是错 → 系统自动生成一个 10 分钟微课

**OpenMAIC API 调用**:
```
POST http://100.106.90.55:3000/api/generate-classroom
Body: {
  "topic": "小升初行程问题精讲：相遇与追及",
  "targetAudience": "小学六年级",
  "style": "interactive",
  "language": "zh-CN"
}
```

**产出**: 
- 5-8 张幻灯片（知识点讲解 + 例题演示）
- 2-3 个互动环节（拖拽答题、选择判断）
- 1 个随堂测验（3-5题）
- 可直接在浏览器播放的 `.maic` 课堂文件

**价值**: 家长不再需要到处找资源，系统根据错题自动生成专属课程

---

### 集成点 2: 诊断 → 针对性练习生成

**场景**: 计算模块薄弱 → 自动生成 20 道递进练习题

**OpenMAIC API 调用**:
```
POST http://100.106.90.55:3000/api/generate/scene-content
Body: {
  "prompt": "生成20道小升初计算模块练习题，涵盖：简便运算、解方程、定义新运算。难度递进，附答案和解析。",
  "model": "minimax:MiniMax-M2.7-highspeed"
}
```

**产出**: 
- 结构化 JSON 练习题（题目/答案/解析/难度/知识点标签）
- 可导出为 PDF 或 Word
- 可导入到系统的"错题本"模块

**价值**: 告别题海战术，只做该做的题

---

### 集成点 3: 诊断 → 学习路径编排（LangGraph）

**场景**: 系统判断孩子需要 6 周系统复习 → 自动生成学习日历

**OpenMAIC LangGraph 工作流**:
```
[诊断输入] 
  → [知识图谱分析] 
  → [薄弱点排序] 
  → [阶段规划: 4周基础 + 2周冲刺]
  → [每周任务生成]
  → [每日微课+练习分配]
  → [周末测验安排]
  → [输出: 完整学习日历 JSON]
```

**OpenMAIC API 调用**:
```
POST /api/generate/scene-outlines-stream
Body: {
  "topic": "基于诊断报告生成6周小升初数学复习计划",
  "agents": ["planner", "content_generator", "quiz_designer"]
}
```

**产出**: 
- 带时间线的学习日历
- 每节课对应的微课链接
- 每周测验卷
- 家长每周接收的"本周学习总结"推送

**价值**: 从"诊断"到"行动"全自动闭环

---

### 集成点 4: 内容资产批量生产

**场景**: 机构客户需要 100 个知识点的讲解卡片

**OpenMAIC 批量生产能力**:
- 批量生成知识点 PPT（`create_ppt.py` 风格）
- 批量生成讲解音频（MiniMax TTS）
- 批量生成知识点短视频（图片+字幕合成）
- 批量生成思维导图（AI 自动排版）

**API 调用**:
```
POST /api/generate/tts
POST /api/generate/image  (知识点图解)
POST /api/generate/video  (讲解视频)
```

**价值**: 机构级客户的内容生产线

## 三、技术集成架构

```
┌─────────────────────────────────────────────────────────┐
│                    家长/学生端 (Next.js)                   │
│  [拍照上传] → [OCR识别] → [AI批改] → [报告生成]            │
└─────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────┐
│              OpenMAIC 引擎层 (Mac mini :3000)             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐  │
│  │ 微课生成     │  │ 练习生成     │  │ 学习路径编排     │  │
│  │ /generate   │  │ /generate   │  │ /generate-class │  │
│  │ -classroom  │  │ -scene-*    │  │ room            │  │
│  └─────────────┘  └─────────────┘  └─────────────────┘  │
│                           ↓                              │
│                    LangGraph Agent 调度                   │
│              (planner → teacher → quiz → reviewer)       │
└─────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────┐
│              内容资产库 (可导出/可播放)                     │
│  [微课.maic] [练习题PDF] [讲解音频] [学习日历] [思维导图]   │
└─────────────────────────────────────────────────────────┘
```

## 四、实施优先级

| 优先级 | 集成点 | 工作量 | 客户价值 |
|--------|--------|--------|----------|
| P0 | 微课生成 (集成点1) | 2天 | ⭐⭐⭐⭐⭐ |
| P1 | 练习生成 (集成点2) | 1天 | ⭐⭐⭐⭐ |
| P2 | 学习路径 (集成点3) | 3天 | ⭐⭐⭐⭐⭐ |
| P3 | 批量生产 (集成点4) | 5天 | ⭐⭐⭐ (机构客户) |

## 五、OpenMAIC 调用示例代码

```typescript
// src/lib/openmaic.ts
const OPENMAIC_BASE = process.env.OPENMAIC_URL || 'http://100.106.90.55:3000'

export async function generateClassroom(topic: string, style: string = 'interactive') {
  const res = await fetch(`${OPENMAIC_BASE}/api/generate-classroom`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ topic, style, targetAudience: '小学六年级' })
  })
  const data = await res.json()
  // 返回 jobId + pollUrl，需要轮询
  return { jobId: data.jobId, pollUrl: data.pollUrl }
}

export async function pollClassroom(jobId: string) {
  const res = await fetch(`${OPENMAIC_BASE}/api/generate-classroom/${jobId}`)
  return res.json()
}
```

---

**结论**: OpenMAIC 不是替代作业批改系统，而是将"诊断报告"升级为"诊断+治疗"的完整闭环。
家长拿到的不只是一份报告，而是一整套针对孩子的个性化学习方案。
