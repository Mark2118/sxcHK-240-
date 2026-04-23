# n8n 工作流激活指南

> **日期**: 2026-04-23  
> **版本**: PRD-v6 全量 7 个工作流  
> **n8n 地址**: http://localhost:5678  
> **账号**: admin@wingo.edu / Wingo1234

---

## 一、当前工作流状态（7/7 已激活）

| # | 工作流名称 | Webhook Path | 状态 | PRD 章节 |
|---|-----------|-------------|------|---------|
| 1 | XSC User Register Welcome | `user-register` | ✅ Active | 3.1 新用户注册 |
| 2 | XSC Report Push | `report-ready` | ✅ Active | 3.2 报告生成推送 |
| 3 | XSC Paid Conversion | `limit-exceeded` | ✅ Active | 3.3 付费转化 |
| 4 | XSC Monthly Summary | 定时（每月1号） | ✅ Active | 3.4 月度总结 |
| 5 | XSC Renewal Reminder | `renewal-reminder` | ✅ Active | 3.5 续费提醒 |
| 6 | XSC Sleeping User Wakeup | `sleeping-wakeup` | ✅ Active | 3.6 沉默用户唤醒 |
| 7 | XSC B2B Lead Followup | `b2b-lead` | ✅ Active | 3.7 B端线索跟进 |

---

## 二、Webhook 端点配置

### n8n Webhook URL（XSC 后端调用目标）

```
POST http://localhost:5678/webhook/user-register     → 触发新用户欢迎
POST http://localhost:5678/webhook/report-ready       → 触发报告推送
POST http://localhost:5678/webhook/limit-exceeded     → 触发付费转化
POST http://localhost:5678/webhook/renewal-reminder   → 手动触发续费检查
POST http://localhost:5678/webhook/sleeping-wakeup    → 手动触发沉默唤醒
POST http://localhost:5678/webhook/b2b-lead           → 手动触发B端线索
```

### XSC 后端 Webhook 路由（接收前端事件）

```
POST http://localhost:3000/xsc/api/webhook/user-register   → 转发到 n8n
POST http://localhost:3000/xsc/api/webhook/report-ready     → 转发到 n8n
POST http://localhost:3000/xsc/api/webhook/limit-exceeded   → 转发到 n8n
```

### `.env.local` 环境变量

```env
# n8n Webhook 配置
N8N_WEBHOOK_URL=http://localhost:5678/webhook/wingo-events
N8N_WEBHOOK_URL_USER_REGISTER=http://localhost:5678/webhook/user-register
N8N_WEBHOOK_URL_REPORT_READY=http://localhost:5678/webhook/report-ready
N8N_WEBHOOK_URL_LIMIT_EXCEEDED=http://localhost:5678/webhook/limit-exceeded
```

---

## 三、工作流 JSON 文件位置

```
workflows/
├── n8n-user-register-welcome.json   # 新用户注册欢迎（3.1）
├── n8n-report-push.json             # 报告生成推送（3.2）
└── n8n-conversion.json              # 付费转化（3.3）

n8n-workflows/                        # 4 个 Summary 工作流（之前已导入）
├── wingo-marketing-master.json
├── wingo-sales-automation.json
├── wingo-sleeping-wakeup.json
└── wingo-error-handler.json
```

---

## 四、节点类型说明

每个工作流均包含以下节点类型：

| 节点类型 | 用途 | 示例 |
|---------|------|------|
| `n8n-nodes-base.webhook` | Webhook 触发 | `Webhook User Register` |
| `n8n-nodes-base.respondToWebhook` | 立即响应 200 | `Respond OK` |
| `n8n-nodes-base.httpRequest` | 调用微信/飞书 API | `Get WeChat Token` / `Send Welcome Msg` |
| `n8n-nodes-base.wait` | 延迟执行（Wait） | `Wait 3 Days` |
| `n8n-nodes-base.if` | 条件判断 | `Check If Used` / `Check If Paid` |

---

## 五、微信模板消息参数化配置

工作流中的微信配置使用 n8n 环境变量表达式：

| 参数 | 表达式 | `.env.local` 对应变量 |
|------|--------|---------------------|
| AppID | `{{$env.WECHAT_APP_ID}}` | `WECHAT_APP_ID` |
| AppSecret | `{{$env.WECHAT_APP_SECRET}}` | `WECHAT_APP_SECRET` |
| 模板ID（通知） | `{{$env.WECHAT_TEMPLATE_ID}}` | `WECHAT_TEMPLATE_ID` |
| 模板ID（报告） | `{{$env.WECHAT_TEMPLATE_MSG_ID}}` | `WECHAT_TEMPLATE_MSG_ID` |

飞书通知 Webhook URL 已硬编码为：
```
https://open.feishu.cn/open-apis/bot/v2/hook/7c7bb761-fac1-49f3-a52f-4e74d77c569d
```

---

## 六、激活方式（两种）

### 方式 A：直接修改数据库（已完成）

适用于批量导入和自动化部署：

```bash
# 1. 从容器拷贝数据库
docker cp n8n:/home/node/.n8n/database.sqlite ./data/n8n.db

# 2. 用 Python/SQLite 插入工作流记录（见 scripts/import_n8n_workflows.py）
# 3. 修复关联表（shared_workflow + workflow_history + workflow_published_version）
# 4. 设置 active=1

# 5. 拷贝回容器并修复权限
docker cp ./data/n8n.db n8n:/home/node/.n8n/database.sqlite
docker run --rm -v n8n_data:/data busybox sh -c "rm -f /data/database.sqlite-shm /data/database.sqlite-wal /data/crash.journal; chown 1000:1000 /data/database.sqlite && chmod 644 /data/database.sqlite"

# 6. 重启 n8n
docker restart n8n
```

### 方式 B：手动通过 n8n UI 激活

1. 打开 http://localhost:5678
2. 登录：admin@wingo.edu / Wingo1234
3. 进入 **Workflows** 页面
4. 点击工作流名称进入编辑器
5. 点击右上角 **Activate** 开关
6. 对每个工作流重复步骤 4-5

---

## 七、验证清单

```bash
# 1. n8n 健康检查
curl http://localhost:5678/healthz
# 期望: {"status":"ok"}

# 2. Webhook 可用性测试
curl -X POST http://localhost:5678/webhook/user-register -H "Content-Type: application/json" -d '{"openid":"test","userId":"123"}'
# 期望: OK

curl -X POST http://localhost:5678/webhook/report-ready -H "Content-Type: application/json" -d '{"openid":"test","reportId":"456"}'
# 期望: OK

curl -X POST http://localhost:5678/webhook/limit-exceeded -H "Content-Type: application/json" -d '{"openid":"test","userId":"789"}'
# 期望: OK

# 3. XSC 后端 webhook 路由测试
curl -X POST http://localhost:3000/xsc/api/webhook/user-register -H "Content-Type: application/json" -d '{"openid":"test","userId":"123"}'
# 期望: {"success":true,"message":"已触发欢迎工作流"}
```

---

## 八、故障排查

| 问题 | 原因 | 解决 |
|------|------|------|
| `SQLITE_READONLY` | 数据库文件权限错误 | 执行 `chmod 644` 并 `chown 1000:1000` |
| `SQLITE_CORRUPT` | -shm/-wal 文件与数据库不匹配 | 删除 `.sqlite-shm` 和 `.sqlite-wal` 文件 |
| Webhook 404 | 工作流未正确关联 project | 确保 `shared_workflow` 表有记录 |
| Webhook 404 | activeVersionId ≠ versionId | 确保 `workflow_history` 表有记录且两者一致 |
| 微信模板消息发送失败 | access_token 过期或 AppID/Secret 错误 | 检查 `.env.local` 中的微信凭证 |

---

## 九、后续维护

- **修改工作流**: 建议通过 n8n UI 修改，修改后导出 JSON 备份到 `workflows/` 目录
- **新增工作流**: 复制现有 JSON，修改 nodes/connections，运行 `scripts/import_n8n_workflows.py`
- **数据库备份**: 定期执行 `docker cp n8n:/home/node/.n8n/database.sqlite ./backup/n8n-$(date +%Y%m%d).db`
