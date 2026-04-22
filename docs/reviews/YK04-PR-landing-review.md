# YK-04 PR Review — feat(landing): 极简落地页重构

> **Review对象**: `0205275` feat(landing): 极简落地页重构 -- 1屏C端转化页
> **作者**: 02号
> **Review时间**: 2026-04-22 19:04
> **Reviewer**: YK-04

---

## 通过项 ✅

1. **1屏设计**: 结构清晰，无冗余内容
2. **学段选择卡片**: 交互直观，选中态明确
3. **CTA按钮**: 突出，有loading状态
4. **合规声明**: 底部"不涉及任何教育培训服务"正确
5. **构建通过**: 3.57kB，First Load JS 90.7kB

---

## 需修复项 ❌

### 1. 🔴 高 — MOCK登录残留（生产环境可伪造身份）

**位置**: `src/app/page.tsx` L45-49

```typescript
// 问题代码
const mockCode = 'mock_wx_code_' + Date.now()
const res = await fetch('/xsc/api/auth/wechat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ code: mockCode }),
})
```

**风险**: 生产环境任何人可伪造 mock_wx_code，直接登录任意账号。

**修复建议**:
```typescript
// 修复方案
const handleStart = async () => {
  if (isNavigating) return
  setIsNavigating(true)

  if (user) {
    router.push(`/xsc/analyze?grade=${selectedGrade}`)
    return
  }

  // 开发环境：mock登录
  if (process.env.NODE_ENV === 'development') {
    try {
      const mockCode = 'mock_wx_code_' + Date.now()
      const res = await fetch('/xsc/api/auth/wechat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: mockCode }),
      })
      // ...mock登录逻辑
    } catch (e) {
      setError('网络错误，请稍后重试')
      setIsNavigating(false)
    }
    return
  }

  // 生产环境：跳转微信OAuth授权
  const redirectUri = encodeURIComponent(`/xsc/analyze?grade=${selectedGrade}`)
  window.location.href = `/xsc/api/auth/wechat?redirect=${redirectUri}`
}
```

**优先级**: **P0 — Week 1 必须修复**

---

### 2. 🟡 中 — `alert()` 阻塞交互

**位置**: `src/app/page.tsx` L56, L60

```typescript
alert('登录失败: ' + (data.error || '请稍后重试'))
// ...
alert('网络错误，请稍后重试')
```

**风险**: 阻塞用户交互，移动端体验极差。

**修复建议**: 使用非阻塞错误提示组件（如 Toast 或内联错误）

```typescript
// 修复方案
const [error, setError] = useState<string | null>(null)

// JSX 中
{error && (
  <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
    {error}
  </div>
)}

// 调用时
setError('登录失败: ' + (data.error || '请稍后重试'))
setIsNavigating(false)
```

**优先级**: **P1 — Week 1 建议修复**

---

### 3. 🟡 中 — 定价与 PRD v6 不一致

**位置**: `src/app/page.tsx` L356-358

```typescript
<span>月卡 ¥39</span>
<span>年卡 ¥299</span>
```

**PRD v6 定价**:
```
月卡 ¥29.9
年卡 ¥239
```

**风险**: 定价混乱，用户困惑，与 PRD 文档不一致。

**修复建议**: 统一为 PRD 定价，或更新 PRD 文档。

```typescript
<span>月卡 ¥29.9</span>
<span>年卡 ¥239</span>
```

**优先级**: **P1 — Week 1 建议修复**

---

### 4. 🟢 低 — 无学段参数校验

**位置**: `router.push(`/xsc/analyze?grade=${selectedGrade}`)`

**风险**: 传入非法 grade 值可能导致 analyze 页面异常。

**修复建议**:
```typescript
const VALID_GRADES = ['kindergarten', 'primary', 'general']
if (!VALID_GRADES.includes(selectedGrade)) {
  setSelectedGrade('general') // 回退到默认值
}
router.push(`/xsc/analyze?grade=${selectedGrade}`)
```

**优先级**: **P2 — 可选修复**

---

## 全仓库扫描速报

**除本 PR 外，全仓库还存在的共性问题**:

| # | 问题 | 数量 | 优先级 |
|---|------|------|--------|
| 1 | MOCK 登录残留 | 3处（page.tsx, analyze.tsx×2） | P0 🔴 |
| 2 | MOCK 支付残留 | 5处（wechat-pay.ts, orders, callback, query） | P0 🔴 |
| 3 | 数据库手写SQL（无法支撑PRD v6） | 全文件 | P0 🔴 |
| 4 | AI无重试降级 | ai.ts | P0 🔴 |
| 5 | 百度Token无并发锁 | ocr.ts, paper.ts, correct.ts | P0 🔴 |
| 6 | alert()弹窗 | 9处 | P1 🟡 |
| 7 | console.log残留 | 39处 | P1 🟡 |
| 8 | API输入无验证 | 8个路由 | P1 🟡 |
| 9 | 硬编码路径/xsc/ | 14处 | P2 🟢 |
| 10 | AI超时120秒 | ai.ts | P1 🟡 |

详见: `docs/reports/YK04-code-review.md`

---

## 总结

**本 PR 状态**: 需修改后合并

**必须修复**: 问题 #1（MOCK登录）
**建议修复**: 问题 #2（alert）、#3（定价）
**可选修复**: 问题 #4（参数校验）

**全局建议**: Week 1 优先修复 P0 问题，再推进新功能。

*YK-04 Review 完毕。*
