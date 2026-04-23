# WinGo 学情引擎 API 文档

> 企业级 API 规范 | 版本: v6 | 日期: 2026-04-23

## 通用规范

### 认证方式
| 场景 | 方式 | Header |
|------|------|--------|
| C端用户 | JWT Bearer Token | `Authorization: Bearer <token>` |
| 管理后台 | MASTER_KEY | `x-master-key: xsc-admin-2026` |
| Webhook（内部） | 无（仅本地/内网） | - |

### 统一响应格式
```json
{
  "success": true,
  "data": { ... }
}
```
错误响应：
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "请先登录"
  }
}
```

### 通用响应头
```
X-Request-Id: <trace-id>
X-Response-Time: <ms>
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 59
X-RateLimit-Reset: <timestamp>
```

### 限流策略
| 接口类型 | 限流 |
|---------|------|
| 公共 API | 60次/分钟 |
| 认证 API | 10次/分钟 |
| 分析 API | 5次/分钟 |
| Webhook | 100次/分钟 |
| 管理后台 | 30次/分钟 |

---

## 认证 API

### POST /api/auth/wechat
微信登录/注册

**请求体：**
```json
{ "code": "wx_auth_code_xxx" }
```

**响应：**
```json
{
  "success": true,
  "token": "eyJhbG...",
  "user": { "id": "WGU-xxx", "openid": "...", "nickname": "...", "avatar": "..." }
}
```

---

## 学情分析 API

### POST /api/check
拍照分析作业

**Headers:** `Authorization: Bearer <token>`

**请求体：**
```json
{
  "text": "作业OCR文本...",
  "subject": "math",
  "generateExerciseSet": true,
  "ocrText": "原始OCR文本"
}
```

**响应：** 学情报告 + HTML + 专项练习

### GET /api/report?id=<reportId>
获取报告详情

### POST /api/report/pdf
导出 PDF

**请求体：**
```json
{ "reportId": "rep-xxx", "type": "report" }
// 或
{ "type": "monthly" }
```

**响应：** `Content-Type: application/pdf`

---

## 学情追踪 API

### GET /api/trends
用户学情趋势（薄弱点追踪）

**Headers:** `Authorization: Bearer <token>`

### GET /api/summary/monthly
月度总结数据

**Headers:** `Authorization: Bearer <token>`

---

## 邀请裂变 API

### POST /api/referral
创建邀请码

### GET /api/referral?code=<code>
查询邀请码

### POST /api/referral/claim
领取邀请码

**请求体：** `{ "code": "ABCDE" }`

---

## 深度咨询 API

### POST /api/consult
L1/L2/L3 问题分流

**请求体：**
```json
{ "question": "孩子计算总是错，是不是该报班？", "context": "可选上下文" }
```

**响应：**
```json
{
  "success": true,
  "data": {
    "level": "L3",
    "answer": "...",
    "leadScore": 8,
    "followUp": "...",
    "source": "openmaic"
  }
}
```

### GET /api/consult/history
咨询历史

---

## 微信小程序 API

### POST /api/wxapp/login
小程序登录

### GET /api/wxapp/reports
报告列表（简化字段）

### GET /api/wxapp/user
用户信息

---

## B端管理 API

### GET /api/b-admin/classes/[id]/students
班级学生列表

### GET /api/b-admin/classes/[id]/analytics
班级分析数据

---

## 运营管理 API

### GET /api/ops/dashboard?key=xsc-admin-2026
OPC 运营驾驶舱数据

### GET /api/summary/renewal
续费提醒数据（7天内到期）

### GET /api/summary/sleeping
沉默用户数据（30天未活跃）

### GET /api/summary/b2b-leads
B端线索数据

---

## Webhook API（内部）

### POST /api/webhook/user-register
新用户注册事件 → n8n

### POST /api/webhook/report-ready
报告生成事件 → n8n

### POST /api/webhook/limit-exceeded
额度用完事件 → n8n

---

## 错误码表

| 错误码 | HTTP | 说明 |
|--------|------|------|
| UNAUTHORIZED | 401 | 未登录 |
| FORBIDDEN | 403 | 无权限 |
| VALIDATION_ERROR | 400 | 输入校验失败 |
| RESOURCE_NOT_FOUND | 404 | 资源不存在 |
| QUOTA_EXCEEDED | 429 | 额度已用完 |
| RATE_LIMITED | 429 | 请求过于频繁 |
| EXTERNAL_SERVICE_ERROR | 502 | 外部服务错误 |
| INTERNAL_ERROR | 500 | 系统内部错误 |
