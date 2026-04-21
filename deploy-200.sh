#!/bin/bash
# WinGo XSC 200服务器部署脚本
# 铁律：服务器只读，所有配置在镜像中固化，服务器只做 load/stop/rm/run

set -e

IMAGE_NAME="wingo-xsc"
CONTAINER_NAME="wingo-xsc"
DATA_DIR="/opt/xsc/data"
PORT="3000"

echo "=== WinGo XSC 部署 ==="

# 1. 加载镜像（如需要）
if [ -f "wingo-xsc-new.tar" ]; then
    echo "加载新镜像..."
    docker load -i wingo-xsc-new.tar
fi

# 2. 停旧容器
echo "停止旧容器..."
docker stop ${CONTAINER_NAME} 2>/dev/null || true
docker rm ${CONTAINER_NAME} 2>/dev/null || true

# 3. 启动新容器
# 铁律：不使用 -e 注入环境变量，所有配置在 Dockerfile ENV 中固化
# 铁律：不使用服务器 chmod/chown，容器用 root 运行
echo "启动新容器..."
docker run -d \
    --name ${CONTAINER_NAME} \
    -p ${PORT}:3000 \
    -v ${DATA_DIR}:/app/data \
    --restart unless-stopped \
    ${IMAGE_NAME}:latest

# 4. 健康检查
echo "健康检查..."
sleep 3
HEALTH=$(curl -s http://localhost:${PORT}/xsc/api/health || echo "fail")
echo "Health: $HEALTH"

echo "=== 部署完成 ==="
docker ps | grep ${CONTAINER_NAME}
