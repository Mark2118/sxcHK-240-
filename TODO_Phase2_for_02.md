# Phase 2 任务清单 · 给 02

> **来源**：yk 代码审查后布置（XSC OCR 灾难根因分析）
> **状态**：待 02 领取执行
> **参考**：`XSC_CODE_REVIEW_ocr_disaster.md`

---

## 🔴 任务 1：题目数量一致性检查

### 目标
上传半张试卷或图片不完整时，系统能检测出来并提示用户。

### 文件
`src/lib/ai.ts` — `analyzeHomework` 函数

### 具体要求
在现有输入检查（低置信度/内容过短）之后，增加题目数量检查：

1. 从 `text` 里提取疑似"题目"的行数，匹配以下题目标记：
   - 中文数字：`一、二、三...` / `第1题` / `第2题`
   - 阿拉伯数字：`1.` / `2.` / `（1）` / `（2）`
   - 英文标记：`Question 1` / `Q1`

2. 如果提取出的题目数 `< 3` 或 `> 30`：
   ```typescript
   throw new Error(`识别结果异常，检测到 ${n} 道题目，请检查图片是否完整`)
   ```

3. 同时把提取的题目数写入日志：
   ```typescript
   console.log(`[AI] 检测到 ${n} 道题目`)
   ```

### 验收标准
- 上传今天那张六年级英语期末卷（共 9 题），系统正确识别为 9 题
- 上传半张试卷（只有 2 题），系统提示"题目数量异常"

### 预计工时
**2 小时**

---

## 🟡 任务 2：练习难度锚定原始试卷

### 目标
禁止练习难度跳跃。原始试卷全是看图填词（基础），练习不能出现定语从句（初中衔接）。

### 文件
- `src/lib/exercises.ts` — `buildPrompt` 函数
- `src/app/api/check/route.ts` — 调用 `generateExercises` 的位置

### 具体要求

1. `buildPrompt` 增加新参数 `sourceDifficulty: string`

2. 在 prompt 里加一段纪律：
   ```
   【原始试卷难度】${sourceDifficulty}
   【出题纪律】练习题难度必须与原始试卷难度一致，禁止跳跃到初中/高中水平。
   如果原始试卷难度为"基础"，练习难度只能是"基础"或"提高"，不能出现"思维拓展"或"初中衔接"。
   ```

3. `src/app/api/check/route.ts` 修改调用：
   ```typescript
   // 提取第一道题的 difficulty 作为锚定
   const sourceDifficulty = report.questions[0]?.difficulty || '基础'
   exercises = await generateExercises(
     report.weakPoints,
     report.moduleScores,
     subject,
     sourceDifficulty  // 新增参数
   )
   ```

4. `generateExercises` 函数签名同步更新

### 验收标准
- 上传基础难度试卷 → 生成的练习 100% 为基础/提高，不出现"思维拓展"或"初中衔接"
- 上传提高难度试卷 → 允许出现"思维拓展"

### 预计工时
**3 小时**

---

## 🟢 任务 3：最小可行题库索引（MVP）

### 目标
建立最简单的试卷特征库，识别结果能匹配到已知试卷时高亮，匹配不到时告警。

### 文件
新建 `src/lib/paper-index.ts`

### 具体要求

1. 建立 `knownPapers` 数组，包含 3-5 套常见试卷的**文本特征**（不需要完整题目）：
   ```typescript
   interface PaperSignature {
     id: string
     name: string
     grade: string        // 六年级
     subject: string      // english / math
     term: string         // 期末 / 期中
     questionCount: number
     keyPhrases: string[] // 试卷开头的特征短语（如 ["看图填词", "六年级英语期末"]
     typicalQuestionTypes: string[] // ["看图填词", "选择题", "阅读理解"]
   }
   ```

2. 提供匹配函数：
   ```typescript
   export function matchPaper(ocrText: string): {
     matched: boolean
     paperName?: string
     confidence: number  // 0-1
   }
   ```

3. `src/app/api/check/route.ts` 在调用 `analyzeHomework` 之前调用 `matchPaper`：
   ```typescript
   const match = matchPaper(text)
   if (match.confidence < 0.6) {
     console.warn(`[题库] 匹配度低 (${match.confidence})`)
     // 把 warning 存入 report 元数据，后续在报告里展示
   }
   ```

4. 先录入今天测的这套六年级英语期末卷作为第一条特征。

### 验收标准
- 上传今天那张六年级英语期末卷 → `matched: true`, `confidence >= 0.7`
- 上传一张陌生试卷 → `matched: false`, `confidence < 0.6`，日志报警

### 预计工时
**半天**

---

## 📌 执行顺序

1. **今天**：任务 1（2 小时）→ 题目数量护栏
2. **明天**：任务 2（3 小时）→ 难度锚定
3. **后天**：任务 3（半天）→ 题库 MVP

**有任何技术问题或需求不明确，随时 @yk 审。**

---

*布置时间：2026-04-22 12:22*  
*布置人：yk（代码审查）*  
*执行人：02*
