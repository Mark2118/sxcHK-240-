#!/bin/bash
# WinGo XSC 200服务器部署脚本
# 用法: 在本地build完成后，save镜像 -> scp到服务器 -> 执行此脚本

set -e

IMAGE_NAME="wingo-xsc"
CONTAINER_NAME="wingo-xsc"
DATA_DIR="/opt/xsc/data"
PORT="3000"

echo "=== WinGo XSC 部署到 200 服务器 ==="

# 1. 保存旧容器数据（如有）
if docker ps -a --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
    echo "备份旧容器..."
    docker stop ${CONTAINER_NAME} || true
    docker rename ${CONTAINER_NAME} ${CONTAINER_NAME}-old || true
fi

# 2. 加载新镜像（如需要）
if [ -f "wingo-xsc-new.tar" ]; then
    echo "加载新镜像..."
    docker load -i wingo-xsc-new.tar
fi

# 3. 启动新容器
echo "启动新容器..."
docker run -d \
    --name ${CONTAINER_NAME} \
    -p ${PORT}:3000 \
    -v ${DATA_DIR}:/app/data \
    -e NODE_ENV=production \
    -e DATABASE_URL=file:./data/wingo-xsc.db \
    --restart unless-stopped \
    ${IMAGE_NAME}:latest

# 4. 健康检查
echo "健康检查..."
sleep 3
curl -s http://localhost:${PORT}/xsc/api/health || echo "健康检查未配置，跳过"

# 5. 清理旧容器
echo "清理旧容器..."
docker rm -f ${CONTAINER_NAME}-old 2>/dev/null || true

echo "=== 部署完成 ==="
docker ps | grep ${CONTAINER_NAME}
