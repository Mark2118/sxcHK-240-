# xsc-enterprise 项目健康检查 — 02号报告
> **日期**: 2026-04-21
> **检查人**: 02号
> **项目**: WinGo 学霸查分本 (xsc-enterprise)

---

## 项目概况

| 项 | 详情 |
|:---|:---|
| **名称** | WinGo 学霸查分本 |
| **定位** | AI 家庭作业检查辅导工具 |
| **技术栈** | Next.js 14.2.15 + React 18 + Tailwind CSS 3 + TypeScript |
| **部署** | Docker (多阶段构建) + nginx 反向代理 |
| **域名** | edu.wingo.icu/xsc |

---

## 功能模块

```
用户上传作业图片 → 百度 OCR 识别 → AI 分析批改
                              ↓
                    生成学情报告（分数/错题/薄弱点）
                              ↓
                    专项练习生成 + HTML 报告下载
```

| 模块 | 文件 | 状态 |
|:---|:---|:---|
| 前端首页 | `src/app/page.tsx` | ✅ 完整，UI 设计不错 |
| OCR 识别 | `src/lib/ocr.ts` | ✅ 百度 OCR，有 token 缓存 |
| AI 分析 | `src/lib/ai.ts` | ✅ 支持数学/语文/英语，prompt 专业 |
| 报告生成 | `src/lib/report.ts` | ✅ HTML 报告渲染 |
| 练习生成 | `src/lib/exercises.ts` | ✅ 根据薄弱点生成针对性练习 |
| 管理登录 | `src/app/api/auth/login` | ✅ masterKey 验证 |
| 健康检查 | `src/app/api/health` | ✅ |
| 报告查询 | `src/app/api/report` | ❌ 未实现（返回占位符）|

---

## 严重问题（必须修）

### 🔴 1. 数据库是内存存储（数据重启就丢）

**位置**: `src/lib/db.ts`

```typescript
const storage: Map<string, CheckRecord> = new Map()
```

**影响**: 所有检查记录存在内存里，服务重启数据全丢。

**修复**: 
- 方案 A: 接入 SQLite + Prisma（package.json 已有脚本，但依赖没装）
- 方案 B: 直接写 SQLite（不装 Prisma，减少依赖）

### 🔴 2. 缺少 Prisma 依赖

**位置**: `package.json`

```json
"scripts": {
  "db:generate": "prisma generate",
  "db:push": "prisma db push"
}
```

但 `dependencies` / `devDependencies` 里没有 `prisma` 和 `@prisma/client`。

**影响**: db 脚本跑不了，数据库无法初始化。

### 🔴 3. next.config 可能没配 standalone

**位置**: `Dockerfile`

```dockerfile
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
```

Dockerfile 引用了 `.next/standalone`，但 `next.config.mjs` 需要配置 `output: 'standalone'`。

**影响**: Docker 构建可能失败。

---

## 中等问题（建议修）

### 🟡 4. 报告查询 API 未实现

**位置**: `src/app/api/report/route.ts`

```typescript
return NextResponse.json({ 
  success: true, 
  id, 
  message: '报告查询功能开发中' 
})
```

只是占位符，没有真正查数据库。

### 🟡 5. 没有测试

- 没有 Jest 配置
- 没有 Playwright 配置
- 没有单元测试
- 没有 E2E 测试

### 🟡 6. 编码问题

大量文件是 GBK 编码，中文显示乱码。需要批量转 UTF-8。

### 🟡 7. 环境变量硬编码在 .env

`.env` 文件包含真实 API key，提交到 git 有泄露风险。应该：
- `.env` 加入 `.gitignore`
- 提供 `.env.example`

---

## 优点（值得保留）

| 优点 | 说明 |
|:---|:---|
| **前端 UI 设计好** | Tailwind + Lucide icons，深色/浅色搭配合理 |
| **AI Prompt 专业** | 有完整的学科知识体系和 JSON 格式规范 |
| **代码结构清晰** | 模块化好，lib/ 下各模块职责分明 |
| **Docker 配置完整** | 多阶段构建，生产镜像小 |
| **安全设计** | JWT token + masterKey 验证 |

---

## 修复优先级

| 优先级 | 问题 | 预计时间 |
|:---|:---|:---|
| **P0** | 数据库接入 SQLite/Prisma | 2-4小时 |
| **P0** | 修复 next.config standalone | 30分钟 |
| **P1** | 实现 report API | 1-2小时 |
| **P1** | .env 加入 gitignore | 10分钟 |
| **P2** | 编码批量转 UTF-8 | 1小时 |
| **P2** | 添加基础测试 | 2-3小时 |

---

## 02号建议

**当前状态**: 项目能跑（Docker 构建通过），但数据不持久，API 不完整。

**最快让它成为可用产品**: 
1. 接入 SQLite（数据持久化）
2. 实现 report API（完整闭环）
3. 部署测试

**下一步**: 
- A. 02号先修数据库 + report API？
- B. 先写测试再修功能？
- C. 先批量修复编码问题？
- D. 其他？
