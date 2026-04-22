# API 设计文档

## 一、接口规范

### 1.1 统一响应格式

```typescript
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
  message?: string;
}
```

### 1.2 HTTP 状态码

| 状态码 | 场景 |
|--------|------|
| 200 | 成功 |
| 400 | 请求参数错误 |
| 401 | 未登录/Token无效 |
| 403 | 权限不足 |
| 404 | 资源不存在 |
| 422 | 业务校验失败（如OCR低置信度） |
| 429 | 请求过于频繁/免费额度用完 |
| 500 | 服务器内部错误 |

### 1.3 认证方式

- C端：JWT Token（`Authorization: Bearer <token>`）
- B端：API Key + Secret
- Webhook：签名验证（HMAC-SHA256）

---

## 二、C端 API

### 2.1 认证

#### POST /api/auth/wechat
微信一键登录

**请求：**
```json
{
  "code": "wechat_auth_code"
}
```

**响应：**
```json
{
  "success": true,
  "data": {
    "token": "jwt_token",
    "user": {
      "id": "uuid",
      "openid": "wx_openid",
      "nickname": "昵称",
      "avatar": "头像URL",
      "membership": "free|monthly|yearly",
      "freeCountRemaining": 3,
      "expiresAt": "2026-12-31"
    }
  }
}
```

---

### 2.2 学情分析

#### POST /api/check
上传作业进行AI分析

**请求：**
```json
{
  "image": "base64_encoded_image",
  "subject": "math",
  "grade": 6,
  "childId": "uuid"
}
```

**响应（异步）：**
```json
{
  "success": true,
  "data": {
    "taskId": "task_uuid",
    "status": "processing",
    "estimatedTime": 45
  }
}
```

#### GET /api/check/:taskId
查询分析进度

**响应：**
```json
{
  "success": true,
  "data": {
    "taskId": "task_uuid",
    "status": "completed",
    "progress": 100,
    "reportId": "report_uuid"
  }
}
```

---

### 2.3 报告

#### GET /api/report/:reportId
获取学情报告

**响应：**
```json
{
  "success": true,
  "data": {
    "id": "report_uuid",
    "createdAt": "2026-04-22T10:00:00Z",
    "subject": "math",
    "grade": 6,
    "overallScore": 78,
    "weakPoints": [
      { "topic": "计算模块", "score": 65, "trend": "up" },
      { "topic": "应用题", "score": 55, "trend": "down" }
    ],
    "actionList": [
      {
        "title": "计算模块：分配律和结合律混淆",
        "action": "用WinGo生成的5道同类题巩固",
        "exercises": ["题1", "题2", "题3"]
      }
    ],
    "paperMatch": {
      "paperId": "paper-001",
      "confidence": 0.85,
      "name": "六年级数学期末试卷"
    }
  }
}
```

---

### 2.4 趋势

#### GET /api/trends
获取学情趋势数据

**查询参数：**
- `period`: week|month|semester
- `childId`: uuid

**响应：**
```json
{
  "success": true,
  "data": {
    "period": "month",
    "summary": {
      "totalUploads": 12,
      "avgScore": 75,
      "improvement": "+8%"
    },
    "weakPointTrends": [
      {
        "topic": "计算模块",
        "data": [
          { "date": "2026-03-01", "score": 60 },
          { "date": "2026-03-15", "score": 70 },
          { "date": "2026-04-01", "score": 85 }
        ]
      }
    ],
    "radarData": {
      "labels": ["计算", "应用题", "几何", "统计"],
      "current": [85, 65, 70, 80],
      "previous": [60, 55, 65, 75]
    }
  }
}
```

---

### 2.5 支付

#### POST /api/pay/create
创建支付订单

**请求：**
```json
{
  "plan": "yearly",
  "childId": "uuid"
}
```

**响应：**
```json
{
  "success": true,
  "data": {
    "orderId": "order_uuid",
    "amount": 23900,
    "wxPayParams": {
      "appId": "...",
      "timeStamp": "...",
      "nonceStr": "...",
      "package": "prepay_id=...",
      "signType": "RSA",
      "paySign": "..."
    }
  }
}
```

---

## 三、B端 API

### 3.1 机构管理

#### POST /api/b/institution/register
机构注册

**请求：**
```json
{
  "name": "XX托管班",
  "type": "tutoring",
  "contact": "张三",
  "phone": "13800138000",
  "email": "admin@example.com"
}
```

**响应：**
```json
{
  "success": true,
  "data": {
    "institutionId": "inst_uuid",
    "apiKey": "ak_xxxx",
    "apiSecret": "sk_xxxx"
  }
}
```

---

### 3.2 批量分析

#### POST /api/b/batch/analyze
批量上传分析

**请求：**
```json
{
  "classId": "class_uuid",
  "images": ["base64_1", "base64_2"],
  "studentIds": ["stu_1", "stu_2"],
  "subject": "math"
}
```

**响应：**
```json
{
  "success": true,
  "data": {
    "batchId": "batch_uuid",
    "status": "processing",
    "total": 30,
    "completed": 0
  }
}
```

#### GET /api/b/batch/:batchId
查询批量分析进度

#### GET /api/b/batch/:batchId/results
获取批量分析结果

**响应：**
```json
{
  "success": true,
  "data": {
    "classSummary": {
      "avgScore": 72,
      "weakTopics": ["计算", "应用题"],
      "topStudents": ["stu_1", "stu_2"]
    },
    "studentReports": [
      {
        "studentId": "stu_1",
        "name": "小明",
        "score": 85,
        "weakPoints": ["几何"]
      }
    ]
  }
}
```

---

### 3.3 班级看板

#### GET /api/b/dashboard/:classId
班级学情看板

**响应：**
```json
{
  "success": true,
  "data": {
    "className": "六年级一班",
    "studentCount": 25,
    "avgScore": 75,
    "heatMap": {
      "topics": ["计算", "应用题", "几何", "统计"],
      "scores": [
        [85, 70, 75, 80],
        [60, 55, 65, 70],
        // ... 每个学生一行
      ]
    },
    "weakPointRanking": [
      { "topic": "应用题", "affectedCount": 15, "avgScore": 58 }
    ]
  }
}
```

---

### 3.4 品牌定制

#### POST /api/b/brand/settings
更新品牌设置

**请求：**
```json
{
  "logo": "base64_logo",
  "primaryColor": "#3B82F6",
  "reportTemplate": "template_1",
  "institutionName": "XX教育"
}
```

---

## 四、Webhook

### 4.1 XSC → n8n

| 事件 | Webhook URL | payload |
|------|-------------|---------|
| 用户注册 | `POST /webhook/user-register` | `{userId, openid, createdAt}` |
| 报告生成 | `POST /webhook/report-ready` | `{userId, reportId, childId}` |
| 免费额度用完 | `POST /webhook/limit-exceeded` | `{userId, usedCount, limit}` |
| 支付成功 | `POST /webhook/pay-success` | `{userId, orderId, plan}` |
| 年卡即将到期 | `POST /webhook/subscription-expiring` | `{userId, daysRemaining}` |

### 4.2 n8n → XSC

| 动作 | API | 说明 |
|------|-----|------|
| 查询用户状态 | `GET /api/user/status` | n8n 查询用户会员状态 |
| 查询报告摘要 | `GET /api/report/:id/summary` | n8n 获取报告简要信息 |
| 推送模板消息 | `POST /api/wechat/notify` | n8n 调用微信模板消息 |

---

## 五、错误码

| 错误码 | 说明 | HTTP状态 |
|--------|------|---------|
| `INVALID_INPUT` | 输入参数错误 | 400 |
| `UNAUTHORIZED` | 未登录或Token过期 | 401 |
| `FORBIDDEN` | 权限不足 | 403 |
| `NOT_FOUND` | 资源不存在 | 404 |
| `LOW_CONFIDENCE` | OCR低置信度 | 422 |
| `INVALID_QUESTION_COUNT` | 题目数量异常 | 422 |
| `RATE_LIMITED` | 请求过于频繁 | 429 |
| `FREE_LIMIT_EXCEEDED` | 免费额度用完 | 429 |
| `INTERNAL_ERROR` | 服务器内部错误 | 500 |
| `AI_TIMEOUT` | AI分析超时 | 504 |

---

*API文档 v1.0 - 2026-04-22*
