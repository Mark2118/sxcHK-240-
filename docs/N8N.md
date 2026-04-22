# n8n 工作流设计文档

## 一、工作流清单

| # | 工作流名称 | 触发方式 | 复杂度 | 负责人 |
|---|-----------|---------|--------|--------|
| 1 | 新用户注册欢迎 | Webhook | 低 | 01 |
| 2 | 报告生成推送 | Webhook | 中 | 01 |
| 3 | 付费转化 | Webhook | 高 | 01 |
| 4 | 月度总结推送 | 定时 | 中 | 01 |
| 5 | 续费提醒 | 定时 | 中 | 01 |
| 6 | 沉默用户唤醒 | 定时 | 高 | 01 |
| 7 | B端线索跟进 | Webhook | 高 | 01 |

---

## 二、工作流详细设计

### WF-1: 新用户注册欢迎

```json
{
  "name": "XSC-User-Welcome",
  "trigger": {
    "type": "webhook",
    "path": "xsc-user-register",
    "method": "POST"
  },
  "nodes": [
    {
      "name": "发送欢迎消息",
      "type": "wechat-template-message",
      "config": {
        "templateId": "welcome_msg",
        "data": {
          "first": "欢迎加入 WinGo 学情管家！",
          "keyword1": "前3次分析免费",
          "remark": "点击开始体验 →"
        }
      }
    },
    {
      "name": "延迟3天",
      "type": "wait",
      "config": { "delay": 259200 }
    },
    {
      "name": "检查是否使用过",
      "type": "httpRequest",
      "config": {
        "url": "http://100.106.90.55:3002/api/user/activity",
        "method": "GET"
      }
    },
    {
      "name": "条件判断",
      "type": "if",
      "config": {
        "condition": "{{ $json.hasUsed === false }}"
      }
    },
    {
      "name": "发送使用指南",
      "type": "wechat-template-message",
      "config": {
        "templateId": "usage_guide",
        "data": { "first": "还没用过？3分钟教你看懂学情报告" }
      }
    }
  ]
}
```

---

### WF-2: 报告生成推送

```json
{
  "name": "XSC-Report-Push",
  "trigger": {
    "type": "webhook",
    "path": "xsc-report-ready",
    "method": "POST"
  },
  "nodes": [
    {
      "name": "获取报告摘要",
      "type": "httpRequest",
      "config": {
        "url": "http://100.106.90.55:3002/api/report/{{ $json.reportId }}/summary",
        "method": "GET"
      }
    },
    {
      "name": "判断用户类型",
      "type": "switch",
      "config": {
        "cases": [
          { "condition": "{{ $json.userType === 'c' }}", "output": 0 },
          { "condition": "{{ $json.userType === 'b' }}", "output": 1 }
        ]
      }
    },
    {
      "name": "推送C端家长",
      "type": "wechat-template-message",
      "config": {
        "templateId": "report_ready",
        "data": {
          "first": "您孩子的学情报告已生成！",
          "keyword1": "{{ $json.weakPointTop }}",
          "remark": "点击查看完整报告 + 今晚行动清单 →"
        }
      }
    },
    {
      "name": "推送B端家长",
      "type": "wechat-template-message",
      "config": {
        "templateId": "report_ready_inst",
        "data": {
          "first": "【{{ $json.instName }}】今日学情简报",
          "keyword1": "{{ $json.childName }}",
          "keyword2": "{{ $json.weakPointTop }}"
        }
      }
    },
    {
      "name": "推送B端管理员",
      "type": "wechat-template-message",
      "config": {
        "templateId": "class_summary",
        "data": {
          "first": "班级学情汇总",
          "keyword1": "{{ $json.className }}",
          "keyword2": "{{ $json.avgScore }}"
        }
      }
    }
  ]
}
```

---

### WF-3: 付费转化（最复杂）

```json
{
  "name": "XSC-Pay-Conversion",
  "trigger": {
    "type": "webhook",
    "path": "xsc-limit-exceeded",
    "method": "POST"
  },
  "nodes": [
    {
      "name": "立即推送付费弹窗",
      "type": "wechat-template-message",
      "config": {
        "templateId": "pay_prompt",
        "data": {
          "first": "本月免费额度已用完",
          "keyword1": "月卡¥29.9 / 年卡¥239",
          "remark": "解锁查看完整报告 →"
        }
      }
    },
    {
      "name": "延迟2小时",
      "type": "wait",
      "config": { "delay": 7200 }
    },
    {
      "name": "检查是否付费",
      "type": "httpRequest",
      "config": {
        "url": "http://100.106.90.55:3002/api/user/status",
        "method": "GET"
      }
    },
    {
      "name": "未付费？",
      "type": "if",
      "config": {
        "condition": "{{ $json.membership === 'free' }}"
      }
    },
    {
      "name": "发送报告预览",
      "type": "wechat-template-message",
      "config": {
        "templateId": "report_preview",
        "data": {
          "first": "您的报告已生成！",
          "keyword1": "{{ $json.weakPointPreview }}",
          "remark": "解锁查看完整报告 →"
        }
      }
    },
    {
      "name": "延迟24小时",
      "type": "wait",
      "config": { "delay": 86400 }
    },
    {
      "name": "再次检查",
      "type": "httpRequest",
      "config": {
        "url": "http://100.106.90.55:3002/api/user/status",
        "method": "GET"
      }
    },
    {
      "name": "仍未付费？",
      "type": "if",
      "config": {
        "condition": "{{ $json.membership === 'free' }}"
      }
    },
    {
      "name": "发送7折优惠",
      "type": "wechat-template-message",
      "config": {
        "templateId": "discount_offer",
        "data": {
          "first": "今日特惠",
          "keyword1": "年卡立减¥30",
          "keyword2": "仅¥209",
          "remark": "限时24小时 →"
        }
      }
    }
  ]
}
```

---

### WF-4: 月度总结推送

```json
{
  "name": "XSC-Monthly-Summary",
  "trigger": {
    "type": "schedule",
    "cron": "0 9 1 * *"
  },
  "nodes": [
    {
      "name": "获取上月活跃用户",
      "type": "httpRequest",
      "config": {
        "url": "http://100.106.90.55:3002/api/admin/active-users?period=last_month",
        "method": "GET"
      }
    },
    {
      "name": "循环处理每个用户",
      "type": "splitInBatches",
      "config": { "batchSize": 50 }
    },
    {
      "name": "获取月度数据",
      "type": "httpRequest",
      "config": {
        "url": "http://100.106.90.55:3002/api/trends?period=month&userId={{ $json.userId }}",
        "method": "GET"
      }
    },
    {
      "name": "生成月度总结",
      "type": "code",
      "config": {
        "language": "javascript",
        "code": "// 生成月度总结文本\nconst data = $input.first().json;\nconst summary = `[${data.childName}3月学情总结]\\n本月上传作业${data.totalUploads}次，错题减少${data.improvement}\\n薄弱点TOP3：${data.weakPoints.join('、')}\\n进步最大：${data.bestImprovement}`;\nreturn [{ summary }];"
      }
    },
    {
      "name": "推送月度总结",
      "type": "wechat-template-message",
      "config": {
        "templateId": "monthly_summary",
        "data": {
          "first": "{{ $json.summary }}",
          "remark": "查看详细趋势 →"
        }
      }
    }
  ]
}
```

---

### WF-5: 续费提醒

```json
{
  "name": "XSC-Renewal-Reminder",
  "trigger": {
    "type": "schedule",
    "cron": "0 10 * * *"
  },
  "nodes": [
    {
      "name": "获取即将到期用户",
      "type": "httpRequest",
      "config": {
        "url": "http://100.106.90.55:3002/api/admin/expiring-users?days=7",
        "method": "GET"
      }
    },
    {
      "name": "循环处理",
      "type": "splitInBatches",
      "config": { "batchSize": 100 }
    },
    {
      "name": "推送续费提醒",
      "type": "wechat-template-message",
      "config": {
        "templateId": "renewal_reminder",
        "data": {
          "first": "您的 WinGo 年卡即将到期",
          "keyword1": "{{ $json.daysRemaining }}天后到期",
          "keyword2": "续费立享9折，仅¥215",
          "remark": "立即续费，保持学情追踪不中断 →"
        }
      }
    }
  ]
}
```

---

### WF-6: 沉默用户唤醒

```json
{
  "name": "XSC-Silent-User-Reactivation",
  "trigger": {
    "type": "schedule",
    "cron": "0 14 * * *"
  },
  "nodes": [
    {
      "name": "获取沉默用户",
      "type": "httpRequest",
      "config": {
        "url": "http://100.106.90.55:3002/api/admin/silent-users?days=30",
        "method": "GET"
      }
    },
    {
      "name": "排除已标记流失用户",
      "type": "filter",
      "config": {
        "condition": "{{ $json.tag !== 'churned' }}"
      }
    },
    {
      "name": "循环处理",
      "type": "splitInBatches",
      "config": { "batchSize": 50 }
    },
    {
      "name": "推送唤醒消息",
      "type": "wechat-template-message",
      "config": {
        "templateId": "reactivation",
        "data": {
          "first": "好久不见！小明最近学习怎么样了？",
          "keyword1": "送你2次免费分析",
          "remark": "回来看看 →"
        }
      }
    },
    {
      "name": "延迟7天",
      "type": "wait",
      "config": { "delay": 604800 }
    },
    {
      "name": "检查是否活跃",
      "type": "httpRequest",
      "config": {
        "url": "http://100.106.90.55:3002/api/user/activity?userId={{ $json.userId }}",
        "method": "GET"
      }
    },
    {
      "name": "仍未活跃？",
      "type": "if",
      "config": {
        "condition": "{{ $json.lastActiveDays > 37 }}"
      }
    },
    {
      "name": "发送回归礼",
      "type": "wechat-template-message",
      "config": {
        "templateId": "return_gift",
        "data": {
          "first": "限时回归礼",
          "keyword1": "7天会员体验",
          "remark": "看看孩子这段时间的变化 →"
        }
      }
    }
  ]
}
```

---

### WF-7: B端线索跟进

```json
{
  "name": "XSC-B2B-Lead-Followup",
  "trigger": {
    "type": "webhook",
    "path": "xsc-b2b-lead",
    "method": "POST"
  },
  "nodes": [
    {
      "name": "发送确认邮件",
      "type": "email",
      "config": {
        "to": "{{ $json.email }}",
        "subject": "WinGo 学情引擎演示预约确认",
        "body": "已收到您的演示预约，OpenMAIC 智能助手将为您自动演示..."
      }
    },
    {
      "name": "延迟5分钟",
      "type": "wait",
      "config": { "delay": 300 }
    },
    {
      "name": "OpenMAIC 自动演示",
      "type": "httpRequest",
      "config": {
        "url": "http://100.106.90.55:3000/api/demo/send",
        "method": "POST",
        "body": {
          "leadId": "{{ $json.leadId }}",
          "institutionType": "{{ $json.type }}"
        }
      }
    },
    {
      "name": "延迟24小时",
      "type": "wait",
      "config": { "delay": 86400 }
    },
    {
      "name": "检查是否成交",
      "type": "httpRequest",
      "config": {
        "url": "http://100.106.90.55:3002/api/b/leads/{{ $json.leadId }}/status",
        "method": "GET"
      }
    },
    {
      "name": "未成交？",
      "type": "if",
      "config": {
        "condition": "{{ $json.status !== 'converted' }}"
      }
    },
    {
      "name": "发送跟进邮件",
      "type": "email",
      "config": {
        "to": "{{ $json.email }}",
        "subject": "WinGo 学情引擎 - 还有什么疑问？",
        "body": "对演示还有什么疑问？我们的顾问随时为您解答..."
      }
    },
    {
      "name": "延迟3天",
      "type": "wait",
      "config": { "delay": 259200 }
    },
    {
      "name": "再次检查",
      "type": "httpRequest",
      "config": {
        "url": "http://100.106.90.55:3002/api/b/leads/{{ $json.leadId }}/status",
        "method": "GET"
      }
    },
    {
      "name": "仍未成交？",
      "type": "if",
      "config": {
        "condition": "{{ $json.status !== 'converted' }}"
      }
    },
    {
      "name": "发送案例分享",
      "type": "email",
      "config": {
        "to": "{{ $json.email }}",
        "subject": "看看 XX 托管班怎么用 WinGo 提升续费率30%",
        "body": "..."
      }
    },
    {
      "name": "标记高意向",
      "type": "httpRequest",
      "config": {
        "url": "http://100.106.90.55:3002/api/b/leads/{{ $json.leadId }}/tag",
        "method": "POST",
        "body": { "tag": "high_intent" }
      }
    }
  ]
}
```

---

## 三、环境配置

### 3.1 n8n 环境变量

```bash
N8N_BASIC_AUTH_ACTIVE=true
N8N_BASIC_AUTH_USER=admin
N8N_BASIC_AUTH_PASSWORD=xxx
N8N_WEBHOOK_URL=https://100.106.90.55:5678/
WEBHOOK_TUNNEL_URL=https://100.106.90.55:5678/

# 微信配置
WECHAT_APPID=xxx
WECHAT_APPSECRET=xxx
WECHAT_TEMPLATE_WELCOME=xxx
WECHAT_TEMPLATE_REPORT=xxx
WECHAT_TEMPLATE_PAY=xxx
WECHAT_TEMPLATE_MONTHLY=xxx
WECHAT_TEMPLATE_RENEWAL=xxx

# XSC API
XSC_API_URL=http://100.106.90.55:3002
XSC_API_KEY=xxx
```

### 3.2 Webhook URL 列表

| Webhook | URL | 触发方 |
|---------|-----|--------|
| 用户注册 | `https://100.106.90.55:5678/webhook/xsc-user-register` | XSC |
| 报告生成 | `https://100.106.90.55:5678/webhook/xsc-report-ready` | XSC |
| 额度用完 | `https://100.106.90.55:5678/webhook/xsc-limit-exceeded` | XSC |
| 支付成功 | `https://100.106.90.55:5678/webhook/xsc-pay-success` | XSC |
| B端线索 | `https://100.106.90.55:5678/webhook/xsc-b2b-lead` | OpenMAIC |

---

## 四、备份与恢复

### 4.1 工作流导出

```bash
# 导出所有工作流
curl -X GET http://100.106.90.55:5678/rest/workflows \
  -u admin:password \
  > n8n-workflows-backup.json
```

### 4.2 工作流导入

```bash
# 导入工作流
curl -X POST http://100.106.90.55:5678/rest/workflows \
  -u admin:password \
  -H "Content-Type: application/json" \
  -d @n8n-workflows-backup.json
```

---

*n8n 工作流设计文档 v1.0 - 2026-04-22*
