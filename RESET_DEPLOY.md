# 香港服务器重置部署

## 1. 清理旧环境

```bash
ssh root@8.217.147.240

# 停掉旧服务
pkill -f node
pkill -f next

# 删掉旧代码（如果有）
rm -rf /opt/xsc /opt/wingo /root/wingedu

# 清理旧进程
ps aux | grep node
```

## 2. 全新安装

```bash
mkdir -p /opt/xsc && cd /opt/xsc

# 拉代码
git clone https://github.com/Mark2118/wingedu.git .

# 装依赖
npm install
```

## 3. 环境变量

```bash
cat > .env << 'EOF'
BAIDU_API_KEY=xxx
BAIDU_SECRET_KEY=xxx
AI_PROVIDER=minimax
AI_API_KEY=xxx
AI_BASE_URL=https://api.minimaxi.chat/v1
AI_MODEL=MiniMax-M2.7-highspeed
DATABASE_URL=file:./data/wingo-xsc.db
EOF

mkdir -p data
```

## 4. 放收款码

```bash
# 把公司收款码图片命名为 company-qr.png
# 放到 /opt/xsc/public/company-qr.png
```

## 5. 构建启动

```bash
npm run build
nohup npm start > xsc.log 2>&1 &
```

## 6. 验证

```bash
curl http://localhost:3000
tail -f xsc.log
```

## 状态检查

| 检查项 | 命令 |
|--------|------|
| 进程在跑 | `ps aux \| grep node` |
| 端口监听 | `netstat -tlnp \| grep 3000` |
| 日志 | `tail -f /opt/xsc/xsc.log` |
| 数据库 | `ls -la /opt/xsc/data/` |

---