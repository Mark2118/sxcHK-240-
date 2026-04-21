# 测试自动化方案 — 02号技术评估
> **日期**: 2026-04-21
> **问题**: 如果 AI 生成代码，谁来测试？不能让人类测。

---

## 根因

当前 WinGo Pipeline 的"测试验证"阶段：
- Python 项目 → 跑 pytest → 可能通过
- Next.js/HTML 项目 → pytest 报错 → 100%失败

**测试不是自动的，是摆设。**

---

## 方案：AI 生成代码 + AI 生成测试 + 自动执行 + 自动修复

### 1. 测试代码自动生成

AI 不仅写业务代码，还写测试代码：

```
业务代码: src/app/page.tsx
测试代码: src/app/page.test.tsx  (Jest)

业务代码: main.py
测试代码: test_main.py  (pytest)

业务代码: Dockerfile
测试代码: docker-compose.test.yml  (health check)
```

Prompt 模板：
```
你是一位测试工程师。请为下面的代码生成完整的单元测试，
覆盖正常路径和异常路径。使用 {测试框架}。

代码：
{code}
```

### 2. 测试自动执行（项目类型驱动）

```python
# core/test_runner.py
TEST_RUNNERS = {
    "python": {
        "cmd": "pytest {project_dir} --tb=short",
        "report": "pytest 输出 + coverage"
    },
    "nextjs": {
        "cmd": "cd {project_dir} && npm test -- --watchAll=false",
        "report": "Jest 输出 + 覆盖率"
    },
    "html": {
        "cmd": "playwright test {project_dir}/tests",
        "report": "截图对比 + 视觉回归"
    },
    "docker": {
        "cmd": "docker build -t {image} {project_dir} && docker run --rm {image} healthcheck",
        "report": "构建日志 + 容器状态"
    }
}
```

### 3. 测试失败 → AI 自动修复

递归循环：

```
生成代码 → 生成测试 → 执行测试
                              ↓
                        测试通过？
                        /        \
                      是          否
                      ↓            ↓
                  进入部署    AI 读取错误日志
                                ↓
                            AI 修复代码
                                ↓
                            重新执行测试
```

最大重试次数：3-5 次，防止无限循环。

### 4. 测试沙箱

所有测试在隔离环境执行：
- Docker 容器（推荐）
- Python venv
- 临时目录，测完销毁

防止 AI 生成的代码破坏系统。

---

## 各项目类型测试策略

| 项目类型 | 测试框架 | 测试内容 |
|:---|:---|:---|
| Python | pytest | 函数输入输出、异常处理 |
| Next.js | Jest + Playwright | 组件渲染、API路由、E2E截图 |
| HTML/CSS | Playwright | 视觉回归、响应式布局 |
| Docker | docker build + curl | 构建成功、健康检查、端口通 |

---

## 关键限制

**AI 修复不是万能的。**

- 简单 bug（语法错误、逻辑错误）→ AI 能修
- 复杂架构问题 → AI 可能越修越烂
- 需要人类在 3-5 次失败后介入

**结论：测试可以高度自动化，但不能 100%无人化。**

---

## 指挥官决策

- **A.** 先给 xsc-enterprise 写一套完整的 Jest + Playwright 测试？
- **B.** 先写 test_runner.py（自动测试执行框架）？
- **C.** 先搭 Docker 测试沙箱？
- **D.** 接受"测试高度自动 + 复杂失败人工介入"的现实？
