# 部署指南

## 一、环境要求

| 组件 | 版本 | 说明 |
|------|------|------|
| Node.js | 20+ | XSC + OpenMAIC |
| Docker | 24+ | n8n + Dify |
| Redis | 7+ | 缓存/队列 |
| SQLite | 3.40+ | 开发环境数据库 |
| Tailscale | 最新 | 内网穿透 |

## 二、一键启动脚本

```bash
#!/bin/bash
# start-wingo-ecosystem.sh

echo "🚀 启动 WinGo 产品生态..."

# 启动 Redis
redis-server --daemonize yes
echo "✅ Redis 启动完成"

# 启动 XSC
cd /path/to/xsc && npm start &
echo "✅ XSC 启动完成 (http://100.106.90.55:3002)"

# 启动 n8n
docker start n8n
echo "✅ n8n 启动完成 (http://100.106.90.55:5678)"

# 启动 Dify
docker start dify
echo "✅ Dify 启动完成 (http://100.106.90.55:8080)"

# 启动 OpenMAIC
cd /path/to/openmaic && npm start &
echo "✅ OpenMAIC 启动完成 (http://100.106.90.55:3000)"

echo ""
echo "🎉 所有服务已启动！"
echo "  - XSC:      http://100.106.90.55:3002"
echo "  - n8n:      http://100.106.90.55:5678"
echo "  - Dify:     http://100.106.90.55:8080"
echo "  - OpenMAIC: http://100.106.90.55:3000"
```

## 三、服务端口

| 服务 | 端口 | 部署方式 |
|------|------|---------|
| XSC | 3002 | systemd |
| OpenMAIC | 3000 | systemd |
| n8n | 5678 | Docker |
| Dify | 8080 | Docker |
| Redis | 6379 | systemd |

## 四、监控

```bash
# 健康检查
curl http://100.106.90.55:3002/api/health
curl http://100.106.90.55:5678/healthz
curl http://100.106.90.55:8080/health
```

*部署指南 v1.0*
