# WinGo 系统 V3 重构设计 — 02号提案
> **日期**: 2026-04-21
> **设计者**: 02号
> **目标**: 解决当前6个致命伤，让系统真正跑通"需求→部署"全自动闭环

---

## 一、当前系统诊断

WinGo V2 是一个**单文件 Python 项目生成器**，伪装成了"AI指挥官"。

| 层级 | 现状 | 问题 |
|------|------|------|
| 前端 | static/index.html 指挥舱 | 输入不发射，AI只闲聊 |
| 后端 | FastAPI + SQLite | 耦合严重，扩展性差 |
| Pipeline | 6阶段串行硬编码 | 只认Python，无PRD确认 |
| AI引擎 | MiniMax API | Kimi失效，Ollama兜底太慢 |
| 部署器 | write_file→main.py | HTML/Next.js/Docker 100%失败 |
| 节点协作 | 01-Mac独裁 | 02/03/Dell等执行节点闲置 |

---

## 二、V3 核心设计原则

```
1. 项目类型驱动 — 不同技术栈走不同的Pipeline
2. 节点分工 — Mac中枢决策，各节点并行执行
3. 模板化 — 不硬编码，用模板定义项目生命周期
4. 本地优先 — AI用本地CLI/API，不依赖远程Kimi
5. 渐进式 — V2不扔，V3兼容V2的Python项目
```

---

## 三、V3 架构图

```
┌─────────────────────────────────────────────────────────────────┐
│                      指挥官（用户/飞书）                          │
└─────────────────────────────┬───────────────────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Mac 中枢 — 决策层 (:38888)                     │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │ 意图识别    │  │ 项目路由    │  │ 中央记忆 / 任务调度      │  │
│  │ /api/intent │  │ 选择节点    │  │ /api/memory / scheduler  │  │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘  │
└─────────────────────────────┬───────────────────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    执行层 — 分布式节点                            │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │ 01-Mac      │  │ 02-Windows  │  │ 03-移动端 / Dell / HK   │  │
│  │ Python项目  │  │ Next.js项目 │  │ 轻量任务 / 财商内容      │  │
│  │ OpenMAIC    │  │ Docker构建  │  │ 数据采集 / 客服          │  │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 四、关键改进：项目类型驱动 Pipeline

### 4.1 项目类型注册表

不再硬编码 Python，用 `project_type` 决定 Pipeline：

```python
# core/project_types.py
PROJECT_TYPES = {
    "python": {
        "name": "Python脚本",
        "stages": ["prd", "code", "test", "deploy"],
        "test_cmd": "pytest {project_dir}",
        "deployer": "local_python",
        "icon": "🐍"
    },
    "nextjs": {
        "name": "Next.js应用",
        "stages": ["prd", "code", "build", "docker", "deploy"],
        "test_cmd": "cd {project_dir} && npm test",
        "build_cmd": "cd {project_dir} && npm run build",
        "docker_cmd": "cd {project_dir} && docker build -t {image_name} .",
        "deployer": "docker_local",
        "icon": "⚛️"
    },
    "html": {
        "name": "静态网站",
        "stages": ["prd", "code", "deploy"],
        "deployer": "static_web",
        "icon": "🌐"
    },
    "openmaic_course": {
        "name": "OpenMAIC课程",
        "stages": ["outline", "scenes", "generate", "package"],
        "deployer": "openmaic_api",
        "icon": "📚"
    }
}
```

### 4.2 Pipeline 模板化

把 `core/pipeline.py` 从硬编码改为模板驱动：

```python
# core/pipeline_v3.py
class PipelineRunner:
    def __init__(self, project_type: str):
        self.type_def = PROJECT_TYPES[project_type]
        self.stages = self.type_def["stages"]
    
    async def run(self, project_id: str, prd: str, on_log):
        project_dir = f"{PROJECTS_DIR}/{project_id}"
        
        for stage in self.stages:
            on_log(stage, f"开始: {stage}")
            
            handler = STAGE_HANDLERS[stage]
            result = await handler.run(project_id, prd, project_dir)
            
            if not result["ok"]:
                on_log(stage, f"失败: {result['error']}")
                return {"status": "failed", "stage": stage}
            
            on_log(stage, f"完成: {result['summary']}")
        
        return {"status": "deployed"}
```

### 4.3 多文件生成

AI 生成的是**文件树**，不是单文件：

```json
{
  "files": [
    {"path": "package.json", "content": "..."},
    {"path": "src/app/page.tsx", "content": "..."},
    {"path": "Dockerfile", "content": "..."}
  ]
}
```

`deployer.py` 改为遍历文件树写入，不再硬编码 `main.py`。

---

## 五、关键改进：AI引擎升级

### 5.1 Kimi CLI 替代 Kimi API

Kimi API 401失效，但本地 Kimi CLI 可用。用 subprocess 调用：

```python
# core/ai_engine.py
async def generate_with_kimi_cli(prompt: str) -> str:
    proc = await asyncio.create_subprocess_exec(
        KIMI_CLI_MAC_PATH,
        "--no-interactive",
        "--context", prompt,
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE
    )
    stdout, _ = await proc.communicate()
    return stdout.decode()
```

### 5.2 引擎优先级

```
1. Kimi CLI (本地，质量最高)
2. MiniMax API (远程，速度快)
3. Ollama (本地，兜底)
```

---

## 六、关键改进：节点协作

### 6.1 02号节点注册

02号启动时向 Mac 中枢注册：

```bash
curl -X POST http://100.106.90.55:38888/api/nodes/register \
  -d '{
    "node_id": "02-win",
    "ip": "100.92.188.101",
    "capabilities": ["nextjs", "docker", "windows_exe"],
    "status": "online"
  }'
```

### 6.2 任务分发

Mac 中枢根据项目类型分发到对应节点：
- Python → 01-Mac
- Next.js → 02-Windows
- 财商内容 → 03-移动端

---

## 七、关键改进：前端发射闭环

当前问题：用户输入 → AI闲聊 → 手动点"开始构建"

V3 改进：

```
用户输入"做个博客"
  → 意图识别 (develop_new)
  → 弹窗确认 PRD（AI生成概要）
  → 用户点"确认发射"
  → POST /api/launch (source=frontend)
  → Pipeline 自动执行
  → WebSocket 实时推送进度
  → 完成后自动展示结果
```

---

## 八、实施路线图

| 阶段 | 任务 | 负责人 | 时间 |
|------|------|--------|------|
| **Phase 1** | 02号在 D 盘把 xsc-enterprise 做成 Next.js 模板 | 02号 | 2-3天 |
| **Phase 2** | 写 `core/project_types.py` + `pipeline_v3.py` | 01-Mac | 3-5天 |
| **Phase 3** | 改造 `deployer.py` 支持文件树 + Docker | 01-Mac | 2-3天 |
| **Phase 4** | 前端加 PRD 确认弹窗 + 自动发射 | 01-Mac | 2-3天 |
| **Phase 5** | Kimi CLI 集成测试 | 01-Mac | 1-2天 |
| **Phase 6** | 02号节点注册 + 任务分发联调 | 01+02 | 2-3天 |

---

## 九、02号当前可立即做的事

1. **在 D 盘把 xsc-enterprise 标准化** — 让它能被 WinGo 系统"一键构建"
   - 写好 `docker-compose.yml`
   - 写好 `README.md`（含构建步骤）
   - 做成模板：`D:\02工作空间\templates\nextjs-starter\`

2. **写一个 Next.js 项目的 Pipeline 规范文档** — 交给 01-Mac 实现
   - Stage 定义、测试命令、Docker 构建命令

3. **测试 Mac 中枢的 API** — 验证 02号 和 Mac 的通信是否正常
   - `POST /api/memory` 写入任务
   - `GET /api/architecture/status` 查看系统状态

---

## 十、一句话总结

> **V2 是"Python代码生成器"，V3 应该是"项目类型驱动的分布式AI工厂"。**

Mac 中枢负责决策和调度，各节点负责擅长的项目类型，02号先把 Next.js/Docker 这块啃下来。

---

**下一步**：
- A. 02号先标准化 xsc-enterprise 模板？
- B. 先写详细的 Pipeline 规范给 01-Mac？
- C. 先测试 Mac 中枢 API 联通性？
- D. 其他？
