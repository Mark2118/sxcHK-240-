# YK-04 PR Review — Batch v6 代码审查（394f764）

> **Review对象**: `394f764` 批次提交（2541 行新增代码）
> **作者**: 01号 + 02号
> **Review时间**: 2026-04-22 19:15
> **Reviewer**: YK-04

---

## 概览

本次提交新增 15 个文件，2541 行代码：
- **B端API**: 7 个路由（`batch`, `class`, `dashboard`, `institution`, `student`, `login`, `me`）
- **前端页面**: 4 个页面（`b-admin` 580行, `cockpit` 343行, `report` 525行, `trends` 323行）
- **C端API**: `trends` 路由（121行）
- **数据库**: `db.ts` +242 行（新增 institutions/classes/students/batchAnalyses 等表）

---

## 通过项 ✅

1. **B端认证有基础设计**: `apiKey + apiSecret` 头认证，比 C 端 MOCK 登录好
2. **数据库补齐 PRD v6**: institutions/classes/students/batchAnalyses/knowledgeSummary 等表已添加
3. **trends API 用 JWT**: `verifyToken()` 验证，不是 MOCK
4. **前端页面结构完整**: B端后台、趋势页、报告页、驾驶舱都有
5. **驾驶舱可视化**: 团队任务进度 + 健康状态监控（有实际价值）

---

## 需修复项 ❌

### 🔴 P0 — 阻塞上线

#### 1. auth() 函数重复定义 × 6 处 — DRY 原则严重违反

**位置**: 以下 6 个文件各有一份完全相同的 `auth()` 函数：
- `src/app/api/b/batch/route.ts`
- `src/app/api/b/class/route.ts`
- `src/app/api/b/dashboard/route.ts`
- `src/app/api/b/student/route.ts`
- `src/app/api/b/institution/me/route.ts`（部分不同）

```typescript
// 重复了6次的代码
function auth(req: NextRequest) {
  const apiKey = req.headers.get('x-api-key')
  const apiSecret = req.headers.get('x-api-secret')
  if (!apiKey || !apiSecret) return null
  const inst = dbClient.institutions.findByApiKey(apiKey)
  if (!inst || inst.apiSecret !== apiSecret) return null
  return inst
}
```

**风险**: 修改认证逻辑需改6个文件，极易遗漏，维护灾难。

**修复建议**: 提取到 `src/lib/auth.ts`（或新建 `src/lib/b-auth.ts`）

```typescript
// src/lib/b-auth.ts
import { NextRequest } from 'next/server'
import { dbClient } from './db'

export function authB(req: NextRequest) {
  const apiKey = req.headers.get('x-api-key')
  const apiSecret = req.headers.get('x-api-secret')
  if (!apiKey || !apiSecret) return null
  const inst = dbClient.institutions.findByApiKey(apiKey)
  if (!inst || inst.apiSecret !== apiSecret) return null
  return inst
}
```

**优先级**: **P0 — Week 1 必须修复**

---

#### 2. B端认证用明文比对 apiSecret — 安全隐患

**位置**: `auth()` 函数中 `inst.apiSecret !== apiSecret`

**风险**: apiSecret 明文存储在数据库，请求头明文传输，中间人可截获。如果泄露，攻击者可伪造任意机构身份。

**修复建议**:
```typescript
// 1. 注册时生成带盐的哈希
import crypto from 'crypto'
const salt = crypto.randomBytes(16).toString('hex')
const hashedSecret = crypto.pbkdf2Sync(apiSecret, salt, 100000, 64, 'sha512').toString('hex')
// 存储: { apiKey, hashedSecret, salt }

// 2. 认证时比对哈希
const hashedInput = crypto.pbkdf2Sync(inputSecret, inst.salt, 100000, 64, 'sha512').toString('hex')
if (inst.hashedSecret !== hashedInput) return null
```

**优先级**: **P0 — 生产环境上线前必须修复**

---

#### 3. B端 API 无输入验证 — 直接 `req.json()`

**位置**: 所有 B 端路由

```typescript
const body = await req.json() // 无任何校验
```

**风险**: 超大请求体导致内存溢出、字段注入、API 费用爆炸。

**修复建议**: 引入 `zod` 校验

```typescript
import { z } from 'zod'

const createClassSchema = z.object({
  name: z.string().min(1).max(50),
  grade: z.enum(['1','2','3','4','5','6']),
  subject: z.enum(['math','chinese','english']),
})

const body = createClassSchema.parse(await req.json())
```

**优先级**: **P0 — Week 1 必须修复**

---

#### 4. `cockpit` 页面硬编码团队数据 — 无法实时反映真实进度

**位置**: `src/app/cockpit/page.tsx` L30+

```typescript
const TEAM = [
  { id: '01', tasks: [
    { name: 'C端 API 闭环', done: true },
    { name: 'n8n 工作流', done: false },
  ]},
]
```

**风险**: 数据写死在代码里，无法动态更新，随着开发推进会迅速过时，变成"虚假驾驶舱"。

**修复建议**: 
- 短期：从 GitHub API 拉取最近 commit + issue 状态
- 长期：接入项目管理工具（Notion/Linear）或自建任务数据库

```typescript
// 临时方案：从 GitHub API 拉
const commits = await fetch('https://api.github.com/repos/Mark2118/wingedu/commits').then(r => r.json())
```

**优先级**: **P1 — 建议 Week 2 改动态**

---

### 🟡 P1 — 影响质量

#### 5. `dashboard` API 在内存中做聚合 — N+1 查询风险

**位置**: `src/app/api/b/dashboard/route.ts`

```typescript
const classStats = classes.map(cls => {
  const classStudents = students.filter(s => s.classId === cls.id) // 内存过滤，O(n²)
  return { ...classStudents.length }
})
```

**风险**: 机构学员数多（500+）时，每次 dashboard 请求都是 O(n²) 复杂度，响应慢。

**修复建议**: 数据库层面聚合

```sql
SELECT c.id, c.name, COUNT(s.id) as studentCount 
FROM classes c LEFT JOIN students s ON c.id = s.class_id 
WHERE c.institution_id = ? GROUP BY c.id
```

**优先级**: **P1 — Week 2 优化**

---

#### 6. `trends` API 解析 JSON 时吞错误 — `catch {}` 静默失败

**位置**: `src/app/api/trends/route.ts`

```typescript
for (const r of records) {
  try {
    const report = JSON.parse(r.reportJson)
    const wps: string[] = report.weakPoints || []
    // ...
  } catch {} // 吞掉了所有解析错误
}
```

**风险**:  corrupt 数据被静默忽略，趋势统计不准确，用户看到的薄弱点统计缺失。

**修复建议**:
```typescript
try {
  const report = JSON.parse(r.reportJson)
} catch (e) {
  console.error('解析报告失败:', r.id, e) // 至少记录日志
  continue
}
```

**优先级**: **P1 — 建议修复**

---

#### 7. `b-admin` 页面无错误边界 — 任何 API 失败白屏

**位置**: `src/app/b-admin/page.tsx`

**风险**: 500 错误时页面崩溃，B端用户（老师/校长）无法操作。

**修复建议**: 加 `ErrorBoundary` 或至少 try-catch + 错误提示 UI

**优先级**: **P1 — 建议修复**

---

### 🟢 P2 — 可选优化

#### 8. `report` 页面 525 行 — 建议拆分组件

**位置**: `src/app/report/page.tsx`

**风险**: 单文件过长，维护困难。

**修复建议**: 拆分为 `ReportHeader`, `ReportScore`, `QuestionList`, `ActionList`, `WeakPointPanel` 等组件

**优先级**: **P2 — 可选**

---

#### 9. `b-admin` 无移动端适配

**位置**: `src/app/b-admin/page.tsx`

**风险**: 老师在手机上无法管理班级。

**修复建议**: 加响应式 `md:flex-row flex-col` 等 Tailwind 类

**优先级**: **P2 — 可选**

---

#### 10. `cockpit` 页面每 30 秒刷新 — 无退避/节流

**位置**: `src/app/cockpit/page.tsx`

```typescript
useEffect(() => {
  const interval = setInterval(fetchHealth, 30000)
  return () => clearInterval(interval)
}, [])
```

**风险**: 用户离开页面后台仍请求，浪费带宽。

**修复建议**: 用 `document.visibilitychange` 暂停后台刷新

**优先级**: **P2 — 可选**

---

## 全仓库问题汇总（含之前扫描）

| 类别 | 问题 | 数量 | 优先级 |
|------|------|------|--------|
| **认证安全** | MOCK登录残留 | 3处 | P0 🔴 |
| **认证安全** | apiSecret 明文比对 | 6处 | P0 🔴 |
| **认证安全** | auth() 函数重复定义 | 6处 | P0 🔴 |
| **支付** | MOCK支付残留 | 5处 | P0 🔴 |
| **数据库** | 手写SQL无法扩展 | 全文件 | P0 🔴 |
| **AI** | 无重试降级 | 1处 | P0 🔴 |
| **OCR** | Token无并发锁 | 3处 | P0 🔴 |
| **输入验证** | API无输入校验 | 全路由 | P0 🔴 |
| **前端** | alert()弹窗 | 9处 | P1 🟡 |
| **日志** | console残留 | 39处 | P1 🟡 |
| **前端** | 驾驶舱硬编码 | 1处 | P1 🟡 |
| **API** | trends静默吞错误 | 1处 | P1 🟡 |
| **API** | dashboard内存聚合 | 1处 | P1 🟡 |
| **定价** | 不一致 | 1处 | P1 🟡 |
| **路径** | 硬编码/xsc/ | 14处 | P2 🟢 |

---

## 修复优先级建议

### Week 1（必须修完）
1. **auth() 提取到 lib** — 消除6处重复
2. **apiSecret 哈希存储** — 安全底线
3. **所有路由加 zod 校验** — 防注入/溢出
4. **MOCK登录/支付清理** — 防伪造
5. **AI重试 + OCR并发锁** — 稳定性

### Week 2（建议修完）
6. **console → pino** — 日志规范
7. **alert → Toast** — 体验
8. **dashboard SQL聚合** — 性能
9. **trends 错误不吞** — 数据准确
10. **cockpit 动态数据** — 真实驾驶舱

---

## 总结

**本批次代码质量**: 比上次好，B端有认证设计、数据库补齐了 PRD v6，但 DRY 原则、安全、输入验证仍是硬伤。

**关键判断**: 
- auth() 重复定义必须立即提取到 lib，否则后续每加一个 B 端路由就多一份复制
- apiSecret 明文比对是安全隐患，生产环境上线前必须改哈希
- 输入验证缺位是所有路由的共同问题，Week 1 统一加 zod

**YK-04 建议**: 01/02 在并行推进是对的，但 Week 1 结束前必须统一走一遍"提取公共函数 + 加输入验证 + 清 MOCK"的修复流程，否则 Week 2 的功能会堆在脆弱地基上。

*YK-04 Review 完毕。*
