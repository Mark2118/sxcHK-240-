# WinGo 自动化方案对比 — 02号技术评估
> **日期**: 2026-04-21
> **问题**: 01/02 是 Kimi CLI，不会主动触发，如何实现真正自动？

---

## 根因

Kimi CLI = 交互式 AI Agent，需要人类输入才能行动。
没有 daemon 模式，没有后台常驻能力。

要实现"全自动"，必须在 Kimi CLI **之外**加一个常驻的自动化引擎。

---

## 方案对比

### 方案 A：n8n 主导 + FastAPI 后端（⭐ 推荐）

**架构**:
```
触发源（定时/Webhook/飞书）→ n8n (:5678) → WinGo FastAPI (:38888) → MiniMax API
```

**优点**:
- n8n 已安装，配置成本低
- 可视化拖拽配置工作流
- 支持定时触发、Webhook、飞书事件
- 不需要改 Kimi CLI

**缺点**:
- 依赖 MiniMax API（质量不如 Kimi CLI）
- n8n 本身也是 Node.js，可能不稳定
- 复杂逻辑（多文件生成）n8n 搞不定

**适用**: 简单任务自动化（定时报告、飞书通知、简单代码生成）

---

### 方案 B：Python Daemon + 任务队列（⭐ 推荐）

**架构**:
```
触发源 → SQLite/Redis 队列 → Python Daemon 常驻后台 → MiniMax/Ollama API
```

**优点**:
- 完全可控，Python 写逻辑灵活
- 不依赖外部服务（除了 AI API）
- 可以处理复杂任务（多文件、Docker构建）
- 可以部署在任何节点（Mac/Windows/香港）

**缺点**:
- 需要写代码，不是拖拽配置
- 需要进程守护（systemd/launchd/watchdog）

**适用**: 复杂产品研发自动化（xsc-enterprise 这种 Next.js 项目）

---

### 方案 C：Kimi CLI API 包装层

**架构**:
```
外部调用 → kimi_daemon.py (:常驻) → subprocess 调用 Kimi CLI → 返回结果
```

**优点**:
- 保留 Kimi CLI 的高质量输出
- 对外暴露 HTTP API，任何系统都能调用

**缺点**:
- Kimi CLI 每次启动慢（初始化时间长）
- subprocess 管理复杂，容易泄漏
- 本质上还是"按需启动"，不是真正常驻

**适用**: 需要 Kimi 质量的场景，但不追求极致速度

---

### 方案 D：直接用 Kimi API（不用 CLI）

**架构**:
```
Python 代码 → api.moonshot.cn/v1 → Kimi 模型
```

**优点**:
- 真正的 HTTP API，完全自动化
- 速度快，不需要 subprocess
- 可以流式输出

**缺点**:
- Kimi API key 之前 401 失效（需要重新申请）
- 可能有调用频率限制
- 计费问题

**适用**: 如果能拿到有效的 API key，这是最佳方案

---

### 方案 E：LangChain / LangGraph

**架构**:
```
LangGraph 定义工作流 → 多个 Agent 节点 → 自动执行
```

**优点**:
- 业界标准，生态丰富
- 支持复杂多步骤工作流
- 可以集成各种 AI 模型和工具

**缺点**:
- 学习成本高
- 可能过度设计
- 引入新依赖

**适用**: 系统成熟后，需要复杂 Agent 协作时

---

## 02号建议

**短期（1-2周）**:
- 用 **方案 A（n8n）** 跑简单自动化（定时任务、飞书通知）
- 用 **方案 B（Python Daemon）** 跑复杂产品研发

**中期（1个月）**:
- 搞定 Kimi API key，切到 **方案 D**
- 或者把 MiniMax 质量调到可用

**长期（3个月）**:
- 系统成熟后，考虑 **方案 E（LangGraph）** 做复杂编排

**核心原则**:
- 自动化引擎 ≠ AI Agent
- 自动化引擎常驻后台，AI Agent 按需调用
- 人类指挥官只在关键决策点介入

---

## 下一步

指挥官定：
- **A.** 先配 n8n 工作流（简单自动化跑起来）
- **B.** 先写 Python Daemon（复杂任务自动化）
- **C.** 先搞定 Kimi API key（质量最高的方案）
- **D.** 其他
