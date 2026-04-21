# 部署铁律 — 服务器只读

> 违反此规则的 agent 将被终止。

## 核心原则

**服务器 = 只读运行环境**

- ❌ 禁止在服务器上修改任何文件
- ❌ 禁止 `docker exec` 进容器改东西
- ❌ 禁止 `docker run -e` 临时注入环境变量
- ❌ 禁止服务器上 `chmod` / `chown` / `cp` / `sed`
- ❌ 禁止服务器上手动迁移数据

## 唯一正确的变更路径

```
本地改代码 → git commit → push GitHub
    ↓
本地 docker build
    ↓
docker save → scp 到服务器
    ↓
服务器 docker load → docker restart
```

**服务器只执行 3 个命令：**
1. `docker load -i xxx.tar`
2. `docker stop && docker rm`
3. `docker run`（无 `-e` 覆盖，无手动手脚）

## 配置管理

所有配置必须在代码仓库中：

| 配置项 | 位置 | 说明 |
|--------|------|------|
| 环境变量默认值 | `src/lib/*.ts` 代码中 | `process.env.XXX \|\| '默认值'` |
| 构建时注入 | `Dockerfile` | `ENV KEY=value` |
| 运行时覆盖 | **禁止** | 不设 `.env` 文件，不用 `-e` |
| 数据目录权限 | `Dockerfile` | `chmod` / `chown` 在 build 时完成 |

## 数据迁移

数据库迁移必须通过代码完成：
- 应用启动时自动检测并执行 schema 升级
- 或提供 `/api/migrate` 接口，由外部调用触发
- **禁止** 服务器上手动 `sqlite3` 或 `cp` 操作

## 部署脚本

唯一允许的部署脚本：`deploy-200.sh`
- 脚本本身在代码仓库中管理
- 脚本只包含 `load/stop/rm/run` 四个标准操作
- 不包含任何临时补丁
