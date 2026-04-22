FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat openssl python3 make g++
WORKDIR /app

COPY package.json ./
RUN npm install

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

# === 环境变量：全部在镜像中固化，服务器不再注入 ===
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV DATABASE_URL=file:./data/wingo-xsc.db
ENV NEXT_PUBLIC_BASE_URL=http://101.200.53.200:3000
ENV N8N_WEBHOOK_URL=http://172.17.0.1:5678/webhook/wingo-events
ENV OPENMAIC_URL=http://172.17.0.1:3001
ENV AI_BASE_URL=https://api.minimaxi.com/v1
ENV AI_API_KEY=sk-cp-Gj_m4OGRLtUtxLH0L3VNzREUPI_MHqSANPRpUUWV5G-ZnlA4Ic_5uJ-9awjGFMIDCvmPCVfPMk-v2yoyuaksFz6LHq_rjaQvuHjFOw8bYijKgSzbIpT3Tdk
ENV AI_MODEL=MiniMax-M2.7-highspeed
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# 数据目录（用root跑，bind mount权限问题自动解决）
RUN mkdir -p /app/data

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# 用root运行，避免bind mount权限问题
# 如需降权，在entrypoint中处理
EXPOSE 3000

CMD ["node", "server.js"]
