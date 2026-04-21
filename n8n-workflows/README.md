# WinGo 营销自动化 — n8n 工作流部署说明

## 架构

```
用户操作 → 后端埋点 → n8n Webhook → 微信模板消息
                    ↓
              Dify (可选) → AI生成个性化文案
```

## 您只需要做 3 步（一次性）

### 第 1 步：导入工作流
1. 打开 n8n UI：`http://100.106.90.55:5678`
2. 左侧菜单 → **Workflows** → **Import from File**
3. 选择 `wingo-marketing-master.json`
4. 点击 **Save**

### 第 2 步：填 3 个值
在工作流中，找到所有标了 `YOUR_` 的地方，替换成真实值：

| 占位符 | 值 | 在哪填 |
|--------|---|--------|
| `YOUR_APPID` | 微信公众号 AppID | 3 个 "Get Token" 节点的 URL 参数里 |
| `YOUR_SECRET` | 微信公众号 Secret | 同上 |
| `YOUR_TEMPLATE_ID` | 传统模板消息 ID | 3 个 "Send" 节点的 jsonBody 里 |

> 💡 批量替换：在 n8n 里按 `Ctrl+F`（或 `Cmd+F`），搜索 `YOUR_`，逐个替换。

### 第 3 步：激活
1. 工作流右上角 → 切换 **Inactive** → **Active**
2. 完成。以后全自动，无需再碰。

---

## 后端已自动埋点的事件

| 事件 | 触发时机 | n8n 动作 |
|------|---------|---------|
| `user_registered` | 新用户关注/注册 | 发欢迎模板消息 |
| `report_generated` | 学情报告生成 | （暂不发消息，避免骚扰） |
| `free_quota_exhausted` | 2次免费额度用完 | 发升级提示（月卡/年卡） |
| `payment_success` | 支付成功 | 发开通成功通知 |

---

## 后续增强（可选）

### Dify AI 文案（让消息更个性化）
在 n8n 的 "Send" 节点之前，插入一个 HTTP Request 节点调用 Dify：
- URL: `http://100.106.90.55:8080/v1/chat-messages`
- Method: POST
- Headers: `Authorization: Bearer {DIFY_API_KEY}`
- Body: 传入用户学情数据，让 Dify 生成个性化文案
- 然后将 Dify 返回的文案传给微信模板消息

### 延时提醒工作流（续费/留存）
后续可新增定时工作流：
- **每周一 9:00**：给付费用户发"本周学情小结"
- **会员到期前7天**：发续费提醒
- **注册后24h未使用**：发使用引导

---

## 故障排查

| 现象 | 原因 | 解决 |
|------|------|------|
| n8n 收不到事件 | webhook URL 填错 | 检查 `.env` 中 `N8N_WEBHOOK_URL` |
| 微信消息发不出去 | appid/secret 填错 | 检查 n8n 工作流中的凭证 |
| 模板消息返回 43004 | 用户未关注公众号 | 正常，忽略即可 |
