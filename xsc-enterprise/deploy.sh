#!/bin/bash
# WinGo 学情洞察 - Docker 部署脚本
# 用法: ./deploy.sh

set -e

echo "=========================================="
echo "WinGo 学情洞察 - Docker 部署"
echo "=========================================="

# 检查环境变量
if [ ! -f .env.local ]; then
    echo "错误: .env.local 文件不存在，请从 .env.example 复制并配置"
    exit 1
fi

# 构建镜像
echo "[1/4] 构建 Docker 镜像..."
docker build -t wingo-xsc:latest .

# 停止旧容器
echo "[2/4] 停止旧容器..."
docker stop wingo-xsc 2>/dev/null || true
docker rm wingo-xsc 2>/dev/null || true

# 启动新容器
echo "[3/4] 启动新容器..."
docker run -d \
    --name wingo-xsc \
    -p 3000:3000 \
    --env-file .env.local \
    -v $(pwd)/data:/app/data \
    --restart unless-stopped \
    wingo-xsc:latest

# 健康检查
echo "[4/4] 健康检查..."
sleep 5
curl -s http://localhost:3000/xsc/api/health || echo "健康检查失败，请查看日志"

echo ""
echo "=========================================="
echo "部署完成!"
echo "访问: http://localhost:3000/xsc"
echo "查看日志: docker logs -f wingo-xsc"
echo "=========================================="
