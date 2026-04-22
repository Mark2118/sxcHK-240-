# WinGo 学情管家 XSC — 项目总览

> **产品**：WinGo 学情管家（XSC）
> **定位**：私立教育机构的 AI 学情分析引擎
> **版本**：v6 OPC 生态版
> **团队**：01（Mac战场）+ 02（Windows工作站）+ 04（代码审查）
> **仓库**：https://github.com/Mark2118/wingedu

---

## 目录

| 文档 | 路径 | 说明 |
|------|------|------|
| 产品需求文档 | `docs/PRD-v6.md` | 完整PRD（含竞品分析、功能设计、定价策略） |
| 项目分工方案 | `docs/TEAM.md` | 01/02/04分工、Git协作流程、里程碑 |
| 竞品调研报告 | `docs/COMPETITOR.md` | 9个竞品深度分析 + 私立机构市场空白确认 |
| API设计文档 | `docs/API.md` | REST API接口规范、数据模型、Webhook设计 |
| 数据库设计 | `docs/DB.md` | Prisma Schema、表结构、索引设计 |
| n8n工作流 | `docs/N8N.md` | 7条核心工作流设计（注册/推送/转化/留存） |
| Dify客服 | `docs/DIFY.md` | 知识库设计、对话场景、集成方案 |
| OpenMAIC咨询 | `docs/OPENMAIC.md` | 深度咨询场景、B端自动演示、销售跟进 |
| 部署指南 | `docs/DEPLOY.md` | 环境配置、一键启动脚本、监控方案 |

---

## 快速开始

```bash
# 1. Clone 仓库
git clone git@github.com:Mark2118/wingedu.git
cd wingedu

# 2. 安装依赖
npm install

# 3. 配置环境变量
cp .env.example .env
# 编辑 .env 填入 API keys

# 4. 初始化数据库
npx prisma migrate dev

# 5. 启动开发服务器
npm run dev
```

---

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | Next.js 15 + Tailwind CSS + TypeScript |
| 后端 | Next.js API Routes + Prisma ORM |
| 数据库 | SQLite（开发）/ PostgreSQL（生产） |
| OCR | PaddleOCR（本地）+ 百度OCR（备用） |
| AI | MiniMax / DeepSeek（多模型切换） |
| 自动化 | n8n（Docker） |
| 客服 | Dify（Docker） |
| 深度咨询 | OpenMAIC |
| 部署 | systemd + Docker Compose |
| 穿透 | Tailscale |

---

## 核心卖点

1. **今晚行动清单** —— 报告直接转化为"今晚该辅导什么"（竞品空白）
2. **薄弱点跨时间追踪** —— 追踪30天，看进步还是退步（竞品空白）
3. **教学效果可视化** —— 机构向家长证明"孩子进步了"（竞品空白）
4. **不替代现有系统** —— 掌心宝贝做记录，校宝做教务，WinGo做分析（互补）

---

*项目文档由 01 整理，2026-04-22*
