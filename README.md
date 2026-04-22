# WinGo 学情管家（WinGo XSC Enterprise）

> 基于 WinGo 学情引擎的家庭学情分析系统
> 
> 官网：https://edu.wingo.icu/xsc

---

## 当前分工（2026-04-22）

| 负责人 | 任务 | 状态 |
|--------|------|------|
| **01（Mac）** | **MVP — C端核心闭环** | 进行中 |
| | C端 API（/check /report /trends /auth）| |
| | 数据库 Schema（用户/报告/学情）| |
| | n8n 工作流（注册/推送/转化）| |
| | Dify 客服（知识库50+条目）| |
| | 微信生态（登录/支付/模板消息）| |
| | C端前端（分析页/报告页/趋势页）| |
| **02（Windows）** | **B端 + 深度咨询** | 待开始 |
| | B端管理后台（机构/学员/品牌）| |
| | 批量分析 API（全班作业批量OCR+AI）| |
| | 班级看板（热力图/雷达图）| |
| | OpenMAIC 深度咨询（学情解读/B端销售）| |
| | 品牌定制（Logo/颜色/报告模板）| |

**原则：不重复造车。** 01 做 C端 MVP，02 做 B端扩展，接口契约共用。

---

## 产品定位

**WinGo 学霸查分本**是一款面向家庭的智能作业批改工具，家长只需拍照上传孩子的作业/试卷，系统即可：

1. **自动识别**试卷题目（支持手写、印刷混排、数学公式、竖式计算）
2. **客观批改**每道选择题/判断题的对错（百度 AI 引擎，非 AI 猜测）
3. **智能分析**生成学情报告和薄弱点诊断
4. **自动出题**针对薄弱知识点生成专项练习题

**核心原则：**
- 是学情分析工具，非教育培训机构
- 为家长提供数据参考，辅助家庭学习规划
- 不涉及任何授课、辅导或培训服务
- 对错判断完全由百度客观批改引擎决定，AI 只负责分析报告

---

## 版本历史

| 版本 | 日期 | 核心升级 |
|------|------|----------|
| v1.0.0 | 2026-04-19 | 基础文本分析版：输入作业文本 → AI 分析 → 报告+出题 |
| v1.0.1 | 2026-04-19 | 增加 `ocr_text` 字段，保存原始 OCR 文本 |
| v1.0.2 | 2026-04-19 | 集成百度手写识别 `handwriting` |
| v1.0.3 | 2026-04-19 | OCR 升级：`accurate_basic` → `doc_analysis`（试卷分析识别，支持公式+版面+竖式+涂改+下划线） |
| v1.0.4 | 2026-04-20 | 集成百度智能作业批改 `correct_edu`（客观批改，返回正确/错误/未作答+原因） |
| v1.0.5 | 2026-04-20 | 集成试卷切题 `paper_cut_edu`（结构化分离题干/选项/答案），合并完整批改流程 |
| v1.0.6 | 2026-04-20 | 修复数组类型防护，更新百度企业认证 Key |
| v1.0.7 | 2026-04-20 | 进一步完善数组防护，增强健壮性 |
| **v1.0.8** | **2026-04-21** | **前端双模式改造：文本分析 + 拍照智能批改，五大结果 Tab 展示，Docker 镜像优化至 227MB** |

---

## 核心能力（v1.0.8）

### 双模式输入

| 模式 | 输入方式 | 适用场景 |
|------|----------|----------|
| **📷 拍照智能批改** | 上传图片 / 粘贴截图 | 孩子写完的纸质作业/试卷，拍照上传即可 |
| **📝 文本深度分析** | 粘贴作业文本内容 | 电子作业、错题整理文本 |

### 拍照智能批改完整流程

```
家长拍照上传
    ↓
【百度 doc_analysis】高精度 OCR 识别
  · 手写/印刷混排识别
  · 数学公式 LaTeX 输出
  · 版面分析（标题/段落/表格）
  · 竖式计算识别
  · 涂改痕迹检测
  · 下划线标注识别
    ↓
【百度 paper_cut_edu】试卷切题
  · 自动分离每道题目
  · 结构化提取：题干 / 选项 / 答案 / 元素坐标
  · 题目类型识别：选择/判断/填空/问答
    ↓
【百度 correct_edu】客观批改（核心！）
  · 选择题自动判对错
  · 判断题自动判对错
  · 返回：correctResult（1正确/2错误/3未作答）
  · 返回：reason（错误原因分析）
  · 返回：cropUrl（错题截图）
    ↓
【MiniMax AI】学情分析报告
  · AI 只基于客观批改结果生成报告
  · AI **绝不猜测对错**（对错已由百度确定）
  · 生成：知识点得分、薄弱点分析、学习建议
    ↓
【MiniMax AI】专项练习生成
  · 基于薄弱知识点自动生成练习题
  · 每道题附答案和解析
    ↓
结果展示（五大 Tab）
  · 总览：得分、正确率、薄弱点雷达图
  · 逐题：每道题的详细分析
  · 客观批改：百度批改结果展示（对错/原因/截图）
  · 专项练习：针对薄弱点的练习题
  · 完整报告：HTML 格式的完整学情报告
```

### 结果展示（五大 Tab）

1. **📊 总览** — 得分、总题数、正确/错误/未作答数量、薄弱点列表
2. **📝 逐题分析** — 每道题的题目内容、学生答案、正确答案、分析
3. **✅ 客观批改** — 百度 AI 的原始批改结果（correctResult + reason + cropUrl）
4. **📚 专项练习** — AI 根据薄弱点生成的针对性练习题（附答案解析）
5. **📄 完整报告** — HTML 格式的详细学情分析报告

---

## 技术架构

### 技术栈

| 层级 | 技术 |
|------|------|
| **前端** | Next.js 14.2.15 + React 18 + Tailwind CSS 3 + TypeScript |
| **后端** | Next.js API Routes (App Router) |
| **数据库** | SQLite (better-sqlite3) + WAL 模式 |
| **OCR 引擎** | 百度智能云 doc_analysis / paper_cut_edu / correct_edu |
| **AI 引擎** | MiniMax (sk-cp-...) + OpenMAIC 降级 |
| **部署** | Docker 多阶段构建 + nginx 反向代理 |

### 核心模块

```
src/
├── app/
│   ├── api/
│   │   ├── correct/route.ts      # 拍照智能批改主 API（切题+批改+报告+出题）
│   │   ├── check/route.ts        # 文本深度分析 API
│   │   ├── ocr/route.ts          # 高精度 OCR API
│   │   └── report/route.ts       # 历史报告查询 API
│   └── page.tsx                  # 前端主页面（双模式+五大 Tab）
├── lib/
│   ├── db.ts                     # SQLite 持久化层（better-sqlite3）
│   ├── ocr.ts                    # 百度 doc_analysis OCR
│   ├── paper.ts                  # 百度 paper_cut_edu 试卷切题
│   ├── correct.ts                # 百度 correct_edu 客观批改
│   ├── ai.ts                     # MiniMax AI 报告生成+出题
│   └── utils.ts                  # 工具函数
└── types/
    └── index.ts                  # TypeScript 类型定义
```

### API 接口

| 接口 | 方法 | 功能 |
|------|------|------|
| `/api/correct` | POST | 拍照智能批改：切题+客观批改+AI报告+出题+持久化 |
| `/api/check` | POST | 文本深度分析：AI 分析文本作业 → 报告+出题 |
| `/api/ocr` | POST | 高精度 OCR：调用百度 doc_analysis |
| `/api/report?id={id}` | GET | 查询历史报告（by 报告 ID） |

### 数据库表结构

```sql
CREATE TABLE reports (
  id TEXT PRIMARY KEY,           -- WGXQ-XXXXXX 格式
  subject TEXT,                  -- 学科（math/chinese/english）
  score REAL,                    -- 得分
  total_questions INTEGER,       -- 总题数
  correct INTEGER,               -- 正确题数
  wrong INTEGER,                 -- 错误题数
  report_json TEXT,              -- AI 报告 JSON
  html TEXT,                     -- HTML 格式报告
  exercises_json TEXT,           -- 练习题 JSON
  ocr_text TEXT,                 -- 原始 OCR 文本
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

---

## 对错判断策略（核心设计）

这是系统最关键的设计决策：

| 环节 | 负责方 | 职责 |
|------|--------|------|
| **对错判断** | **百度 correct_edu** | 客观批改，返回 1(正确)/2(错误)/3(未作答) |
| **原因分析** | **百度 correct_edu** | 返回 reason（如"选错选项""计算错误"） |
| **截图定位** | **百度 correct_edu** | 返回 cropUrl（错题区域截图） |
| **学情报告** | **MiniMax AI** | 基于百度的客观结果生成分析报告 |
| **学习建议** | **MiniMax AI** | 基于薄弱点给出学习建议 |
| **出题** | **MiniMax AI** | 针对薄弱知识点生成练习题 |

**为什么这样设计？**
- AI 大模型（GPT/Claude/MiniMax）**不适合判断客观题对错**，会产生幻觉
- 百度 correct_edu 是专门训练的作业批改模型，**对错判断准确率高**
- AI 的强项是**生成报告、分析薄弱点、提供建议**——这些不需要绝对准确
- 两者结合：**百度负责"判卷"，AI 负责"讲评"**

---

## 快速开始

### 环境要求

- Node.js >= 18
- npm >= 9
- Docker（可选，用于生产部署）

### 本地开发

```bash
# 1. 安装依赖
npm install

# 2. 配置环境变量
cp .env.local.example .env.local
# 编辑 .env.local，填入百度 API Key 和 AI API Key

# 3. 启动开发服务器
npm run dev

# 4. 访问 http://localhost:3000/xsc
```

### 生产部署（Docker）

```bash
# 构建镜像（多阶段构建，约 227MB）
docker build -t wingo-xsc:v1.0.8 .

# 运行容器（数据持久化到 Docker 卷）
docker run -d \
  -p 3000:3000 \
  -v xsc-data:/app/data \
  -e DATABASE_URL=file:/app/data/wingo-xsc.db \
  -e BAIDU_API_KEY=your_key \
  -e BAIDU_SECRET_KEY=your_secret \
  -e AI_API_KEY=your_ai_key \
  --name xsc-enterprise \
  wingo-xsc:v1.0.8
```

### nginx 配置（edu.wingo.icu/xsc）

```nginx
server {
    listen 80;
    server_name edu.wingo.icu;

    location /xsc/ {
        proxy_pass http://localhost:3000/xsc/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## 环境变量

复制 `.env.local.example` 为 `.env.local` 并配置：

| 变量 | 说明 | 必填 |
|------|------|------|
| `DATABASE_URL` | SQLite 数据库路径 | ✅ |
| `BAIDU_API_KEY` | 百度 OCR API Key | ✅ |
| `BAIDU_SECRET_KEY` | 百度 OCR Secret Key | ✅ |
| `AI_PROVIDER` | AI 供应商（minimax/openai） | ✅ |
| `AI_API_KEY` | AI API Key | ✅ |
| `AI_BASE_URL` | AI Base URL | ✅ |
| `AI_MODEL` | AI 模型名 | ✅ |
| `JWT_SECRET` | JWT 签名密钥 | ✅ |
| `MASTER_KEY` | 管理后台密钥 | ✅ |

---

## 百度 API 说明

本项目使用百度智能云 **企业认证账号**，以下 API 均为免费额度内使用：

| API | 接口 | 免费额度 | 超出费用 |
|-----|------|----------|----------|
| 试卷分析识别 | `doc_analysis` | 1000 次/月 | ~0.01 元/次 |
| 试卷切题识别 | `paper_cut_edu` | 1000 次/月 | ~0.01 元/次 |
| 智能作业批改 | `correct_edu` | 1000 次/月 | ~0.01 元/次 |

**认证信息：**
- 应用名称：wingoOCR
- 应用 ID：7654295

---

## 与昨天相比，新增了哪些能力？

### 昨天（v1.0.0 及之前）
- 只能粘贴文本进行分析
- AI 直接判断对错（容易出错）
- 没有 OCR 识别能力
- 没有试卷切题
- 没有客观批改
- 没有拍照功能
- 没有错题截图
- 没有历史报告查询

### 今天（v1.0.8）
- ✅ **拍照上传** — 支持上传图片/粘贴截图
- ✅ **高精度 OCR** — 百度 doc_analysis，支持手写+印刷混排、公式、竖式、涂改
- ✅ **试卷自动切题** — 自动分离每道题，结构化提取题干/选项/答案
- ✅ **客观批改** — 百度 correct_edu 专门判断对错（准确率高，无幻觉）
- ✅ **AI 只做报告** — MiniMax 基于客观结果生成报告，不再猜测对错
- ✅ **错题截图** — 每道错题返回 cropUrl 截图
- ✅ **历史报告查询** — 所有报告持久化到 SQLite，支持按 ID 查询
- ✅ **专项练习** — 基于薄弱点自动生成练习题
- ✅ **五大结果 Tab** — 总览/逐题/客观批改/专项练习/完整报告
- ✅ **Docker 优化** — 多阶段构建，镜像从 300MB+ 优化到 227MB

---

## 品牌

**WinGo** × **百度智能云** × **MiniMax**

---

## 法律声明

本产品为**家庭学情分析软件工具**，提供的分析报告仅供家长参考，帮助了解孩子的学习情况。本工具不涉及任何教育培训、授课或辅导服务。具体学习规划建议咨询学校教师或教育专业人士。

---

© 2026 WinGo Team. All rights reserved.
