# YK04 调研报告 — WinGo 学情洞察代码审查与架构分析

> **报告人**: YK-04（代码审查与质量控制）
> **日期**: 2026-04-22
> **依据**: PRD-v6.md + TEAM.md + 现有代码库完整扫描

---

## 一、执行摘要

现有代码库 (`v1.0.8`) 与 PRD v6 的"成熟产品"目标之间存在**显著差距**。代码层面存在 3 个高风险、7 个中风险、12 个低风险问题。架构层面需要从"单文件工具"升级为"分布式 OPC 生态"。

**核心判断**: 如果直接在当前代码上迭代，5 周内无法达到 PRD v6 的验收标准。建议**Week 1 先进行架构重构**，而非直接开发功能。

---

## 二、高风险问题（必须修复，阻塞上线）

### 🔴 R1: 数据库设计与 PRD v6 严重不符

**现状**: 现有 `db.ts` 使用 better-sqlite3 手写 SQL，表结构简单：
- `users` (id, openid, nickname, avatar)
- `user_limits` (user_id, free_count, member_type)
- `reports` (id, user_id, subject, score, html, ...)
- `orders` (id, user_id, type, amount, status)
- `applications` (企业申请表)

**PRD v6 要求** (Prisma Schema):
- `users` — 增加 `phone`, `membership`, `freeCountUsed/Limit`, `inviteCode`, `invitedBy`, `inviteReward`
- **新增 `Child`** — 孩子档案（name, grade, school）
- **新增 `Institution`** — B端机构表
- **新增 `InstitutionUser`** — 机构-用户关联
- **新增 `KnowledgeSummary`** — 知识点时间线（薄弱点追踪）
- **新增 `Report.childId`** — 报告关联到具体孩子
- **新增 `Report.actionList`** — 今晚行动清单
- **新增 `Report.paperMatch`** — 试卷匹配
- **新增 `Report.ocrConfidence`** — OCR置信度

**风险**: 如果 Week 1 不重构数据库，后续所有功能（薄弱点追踪、B端、多孩子）都无法实现。

**建议**: Week 1 必须引入 Prisma ORM，重写数据库层。

---

### 🔴 R2: 无输入验证与防注入保护

**发现位置**: `src/app/api/check/route.ts`, `src/app/api/correct/route.ts`

**问题**: 
```typescript
const body = await req.json()
const { text, subject = 'math', generateExerciseSet = false, ocrText } = body
```
- `text` 只有 `!text.trim()` 检查，无长度限制（可能导致 AI API 超长请求/费用爆炸）
- `subject` 直接传入，未校验是否为允许值（math/chinese/english）
- `imageBase64` 在 correct API 中无大小校验（可能上传超大图片导致内存溢出）

**风险**: 
- 恶意用户可发送超大文本导致 AI API 费用失控
- 非法 subject 值可能导致 AI prompt 出错
- 超大图片可能导致服务器内存溢出

**建议**: 添加严格的输入校验层：
```typescript
const MAX_TEXT_LENGTH = 5000
const ALLOWED_SUBJECTS = ['math', 'chinese', 'english']
const MAX_IMAGE_SIZE_MB = 10
```

---

### 🔴 R3: 微信支付是 MOCK 实现

**发现位置**: `src/lib/wechat-pay.ts`

**问题**: 
```typescript
console.log('[MOCK] 创建微信支付订单:', params)
// TODO: 接入真实微信支付
```

**风险**: PRD v6 的"付费转化工作流"依赖真实微信支付。如果 Week 3 才开始接入，可能来不及测试。

**建议**: Week 2 必须完成微信支付真实接入（微信JS-SDK + 统一下单API + 回调验证）。

---

## 三、中风险问题（影响质量，建议修复）

### 🟡 M1: 39 处 console.log/warn/error 残留

**统计**: 
- `console.log`: 8 处
- `console.warn`: 7 处  
- `console.error`: 24 处

**风险**: 生产环境日志污染，可能泄露敏感信息（如用户openid、订单信息）。

**建议**: 引入 `pino` 或 `winston` 日志库，区分环境（dev/prod），生产环境禁用 console。

---

### 🟡 M2: 百度 Token 缓存无并发保护

**发现位置**: `src/lib/ocr.ts`, `src/lib/paper.ts`, `src/lib/correct.ts`

**问题**: 
```typescript
let cachedToken: { token: string; expiresAt: number } | null = null

async function getAccessToken(): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expiresAt) {
    return cachedToken.token
  }
  // 并发请求时，多个请求同时进入这里，会重复获取token
```

**风险**: 高并发时多个请求同时刷新 token，可能触发百度 API 限流。

**建议**: 使用 `async-mutex` 或 Promise 锁机制保护 token 刷新。

---

### 🟡 M3: AI 分析无重试与降级策略

**发现位置**: `src/lib/ai.ts` — `analyzeHomework()` 函数

**问题**: AI API 调用失败时直接抛出错误，无重试、无降级。

**风险**: MiniMax API 偶发 5xx 错误时，用户分析直接失败，体验差。

**建议**: 
- 添加指数退避重试（3次）
- 接入 DeepSeek 作为备用 AI 引擎（PRD v6 已规划）
- 超时控制（当前 `AI_TIMEOUT=120` 秒过长，建议 30 秒）

---

### 🟡 M4: 无全局错误处理中间件

**现状**: 每个 API 路由都用 try-catch 包裹，重复代码，且错误响应格式不统一。

**风险**: 
- 遗漏的异常会导致 Next.js 默认 500 页面，暴露堆栈信息
- 错误格式不统一，前端处理困难

**建议**: 添加 `src/lib/error-handler.ts` 全局中间件，统一错误响应格式：
```typescript
{
  success: false,
  error: 'ERROR_CODE',
  message: '用户友好的错误描述',
  detail?: '技术细节（仅dev环境）'
}
```

---

### 🟡 M5: 文件结构不符合 PRD v6 规范

**现状**:
```
src/app/api/apply/route.ts
src/app/api/auth/login/route.ts
src/app/api/auth/logout/route.ts
...
```

**PRD v6 要求**:
```
src/app/api/b/institution/route.ts      # B端机构管理
src/app/api/b/batch/route.ts            # 批量分析
src/app/api/b/dashboard/route.ts        # 班级看板
src/app/api/webhook/n8n/route.ts        # n8n Webhook
```

**风险**: 当前结构无法支撑 B 端 API 扩展。

**建议**: Week 1 重构目录结构，预留 B 端和 Webhook 路由。

---

### 🟡 M6: 微信授权流程存在 MOCK 登录

**发现位置**: `src/app/analyze/page.tsx`

**问题**: 
```typescript
const mockLogin = async () => {
  const mockCode = 'mock_wx_code_' + Date.now()
  const res = await fetch('/xsc/api/auth/wechat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code: mockCode }),
  })
```

**风险**: 正式环境如果保留 MOCK 登录，任何人都能伪造微信身份，绕过鉴权。

**建议**: 添加 `NODE_ENV` 判断，生产环境强制禁用 MOCK 登录。

---

### 🟡 M7: 图片上传无格式/大小校验

**发现位置**: `src/app/analyze/page.tsx` — `handleImageUpload`

**问题**: 
```typescript
const file = e.target.files?.[0]
if (file) handleImageUpload(file)
```

无 MIME 类型检查、无文件大小限制。

**风险**: 用户可能上传非图片文件（如 .exe）或超大图片（50MB+），导致前端/后端崩溃。

**建议**: 
```typescript
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_SIZE = 10 * 1024 * 1024 // 10MB
```

---

## 四、低风险问题（建议优化）

### 🟢 L1-L12 清单

| # | 问题 | 位置 | 建议 |
|---|------|------|------|
| L1 | 硬编码路径 `/xsc/` | 全局 | 使用 `NEXT_PUBLIC_BASE_PATH` 环境变量 |
| L2 | `alert()` 直接弹出错误 | analyze/page.tsx | 改为 Toast 组件，避免阻塞 |
| L3 | 无 API 速率限制 | API路由 | 添加 `rate-limiter-flexible` |
| L4 | 无 CORS 配置 | API路由 | 明确配置 CORS，防止跨域攻击 |
| L5 | 无健康检查端点 | 部署 | `src/app/api/health/route.ts` 太简单，应检查 DB/AI/OCR 连通性 |
| L6 | 无数据库连接池 | db.ts | better-sqlite3 是同步的，但多 worker 时可能竞争 |
| L7 | AI prompt 无版本管理 | ai.ts | prompt 变更可能导致输出格式破坏 |
| L8 | 无自动化测试 | 项目 | 至少添加 API 单元测试（Jest/Vitest） |
| L9 | 依赖版本未锁定 | package.json | 使用 `npm ci` + `package-lock.json` |
| L10 | 无 CI/CD 配置 | 仓库 | 缺少 `.github/workflows/` |
| L11 | Dockerfile 未优化 | Dockerfile | 当前镜像可能过大，建议多阶段构建 |
| L12 | 无监控告警 | 部署 | 缺少 Sentry/DataDog/自建监控 |

---

## 五、架构层面差距分析（PRD v6 vs 现状）

### 5.1 功能矩阵

| 功能 | PRD v6 要求 | 现状 | 差距 |
|------|------------|------|------|
| C端拍照分析 | ✅ | ✅ | 无差距 |
| 文本分析 | ✅ | ✅ | 无差距 |
| 学情报告 | ✅ | ✅ | 无差距 |
| 专项练习 | ✅ | ✅ | 无差距 |
| 微信登录 | ✅ | ⚠️ MOCK+真实混合 | 需清理 MOCK |
| 微信支付 | ✅ | ❌ 仅MOCK | 必须接入 |
| 免费次数控制 | ✅ | ✅ | 无差距 |
| **今晚行动清单** | ✅ | ❌ 未实现 | **Week 2 必须做** |
| **薄弱点追踪/趋势** | ✅ | ❌ 未实现 | **需数据库重构** |
| **B端机构管理** | ✅ | ❌ 未实现 | **Week 1-2 必须做** |
| **批量分析** | ✅ | ❌ 未实现 | **Week 2-3 必须做** |
| **班级看板** | ✅ | ❌ 未实现 | **Week 3 必须做** |
| n8n 工作流 | 7条 | ❌ 未实现 | **Week 1-4 分批做** |
| Dify 客服 | 知识库 | ❌ 未实现 | **Week 3 必须做** |
| OpenMAIC 咨询 | 深度场景 | ❌ 未实现 | **Week 4 必须做** |
| 品牌定制 | Logo/颜色 | ❌ 未实现 | **Week 4 必须做** |
| 月度总结 | 自动推送 | ❌ 未实现 | **需 n8n + 趋势数据** |
| 续费提醒 | 自动推送 | ❌ 未实现 | **需 n8n + 订单数据** |
| 沉默唤醒 | 自动推送 | ❌ 未实现 | **需 n8n + 用户活跃数据** |

### 5.2 关键缺失模块

1. **`src/lib/trends.ts`** — 薄弱点追踪时间线（未创建）
2. **`src/lib/action-list.ts`** — 今晚行动清单生成（未创建）
3. **`src/app/api/b/`** — B端 API 路由目录（未创建）
4. **`n8n-workflows/`** — 工作流备份目录（空）
5. **`dify-kb/`** — Dify 知识库备份目录（空）
6. **`prisma/schema.prisma`** — Prisma Schema（未创建）
7. **`tests/`** — 测试目录（未创建）

---

## 六、安全审计

### 6.1 通过项 ✅

- API Key 使用环境变量，无硬编码泄露
- JWT 使用 `jose` 库（现代标准）
- 密码使用 `bcryptjs` 哈希
- API 强制鉴权（token 检查）

### 6.2 未通过项 ❌

| # | 问题 | 风险等级 |
|---|------|---------|
| 1 | MOCK 登录可绕过鉴权 | **高** |
| 2 | 无输入长度/大小限制 | **高** |
| 3 | 无速率限制（可暴力破解 token） | **中** |
| 4 | 无 CORS 白名单 | **中** |
| 5 | 错误响应可能泄露堆栈 | **低** |
| 6 | 无 SQL 注入保护（虽然 SQLite 参数化查询默认安全，但需确认） | **低** |

---

## 七、性能预判

### 7.1 当前瓶颈

| 环节 | 耗时预估 | 风险 |
|------|---------|------|
| 百度 OCR (doc_analysis) | 3-5s | 网络依赖，超时需降级 |
| 百度试卷切题 | 2-3s | 串行执行，未并行 |
| 百度客观批改 | 3-5s | 串行执行 |
| MiniMax AI 分析 | 5-15s | 最慢环节，120s 超时设置过长 |
| 练习生成 | 5-10s | 串行，可与报告渲染并行 |
| **总耗时** | **20-40s** | PRD 要求 < 15s，需优化 |

### 7.2 优化建议

1. **并行化**: OCR 与试卷切题可并行执行（当前是串行）
2. **AI 超时**: 从 120s 降至 30s，超时降级到备用引擎
3. **图片压缩**: 上传前前端压缩至 2MB 以内
4. **缓存**: 相同试卷匹配结果可缓存 24h
5. **流式响应**: 大报告可分块返回，先展示总览再加载细节

---

## 八、Week 1 建议调整

根据以上分析，建议调整 TEAM.md 的 Week 1 计划：

### 原计划 vs 建议调整

| 负责人 | 原计划 | **建议调整** | 原因 |
|--------|--------|-------------|------|
| 01 | 数据库Schema设计 | **引入 Prisma + 重写 db.ts** | 手写 SQL 无法支撑 PRD v6 复杂关系 |
| 01 | C端API框架搭建 | **先添加输入验证层 + 全局错误处理** | 安全基础不打好，后续修成本高 |
| 01 | — | **新增: 清理 MOCK 登录** | 安全风险 |
| 02 | B端后台初始化 | **延后到 Week 2** | Week 1 应先打好数据库基础 |
| 02 | 批量分析API设计 | **延后到 Week 2** | 依赖数据库重构 |
| **04** | 审查数据库设计 | **审查 Prisma Schema + 安全审计** | 确保新 Schema 覆盖 PRD v6 全部需求 |
| **04** | 代码规范定义 | **新增: 定义输入验证规范 + API 响应规范** | 统一标准 |

---

## 九、04 审查清单（正式版）

基于以上调研，更新审查清单：

```
□ 代码逻辑正确，无 obvious bug
□ 有充分的错误处理（try-catch、边界判断）
□ 有必要的注释（复杂逻辑必须注释）
□ 命名规范（变量/函数名有意义）
□ **无 console.log 残留（生产代码）**
□ **无敏感信息泄露（API key、密码）**
□ **无 MOCK 代码残留（生产环境）**
□ **有输入验证（长度、类型、大小）**
□ **有速率限制（API 路由）**
□ 数据库变更有 migration
□ API 变更有文档更新
□ **测试用例覆盖新增逻辑**
□ 性能无明显问题（无 N+1 查询、无死循环）
□ **PRD v6 功能对齐检查**
```

---

## 十、总结

**当前代码是"可用的原型"，但不是"可上线的产品"。**

作为 04，我的判断是：
1. **Week 1 必须做架构重构**（数据库 Prisma 化、输入验证层、错误处理中间件、清理 MOCK）
2. **Week 2 才能开始功能开发**（否则功能建在沙堆上）
3. **微信支付必须 Week 2 接入**（阻塞付费转化工作流）
4. **n8n 工作流需要 Week 1 就设计好 Webhook 接口**（前后端契约）

如果 01 和 02 同意调整 Week 1 计划，我可以立即开始审查具体代码。

---

*YK-04 报告完毕，等待指挥官指示。*
