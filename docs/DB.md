# 数据库设计文档

## 一、Prisma Schema

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

// ==================== C端用户 ====================

model User {
  id        String   @id @default(uuid())
  openid    String   @unique
  unionid   String?
  nickname  String?
  avatar    String?
  phone     String?
  
  // 会员信息
  membership   String   @default("free") // free, monthly, yearly
  freeCountUsed Int     @default(0)
  freeCountLimit Int    @default(3)
  expiresAt    DateTime?
  
  // 邀请裂变
  inviteCode   String   @unique
  invitedBy    String?
  inviteReward Int      @default(0)
  
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  
  // 关联
  children     Child[]
  reports      Report[]
  orders       Order[]
  
  @@map("users")
}

// ==================== 孩子档案 ====================

model Child {
  id       String @id @default(uuid())
  userId   String
  name     String
  grade    Int
  school   String?
  avatar   String?
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  user     User     @relation(fields: [userId], references: [id])
  reports  Report[]
  
  @@map("children")
}

// ==================== 学情报告 ====================

model Report {
  id        String   @id @default(uuid())
  userId    String
  childId   String
  
  // 分析输入
  subject   String
  grade     Int
  imageUrl  String
  ocrText   String   @db.Text
  ocrConfidence Float
  
  // 分析结果
  overallScore  Int
  questionCount Int
  correctCount  Int
  
  // 薄弱点（JSON存储）
  weakPoints    String @db.Text // JSON: [{topic, score, trend}]
  knowledgeSummary String @db.Text // JSON: 知识点聚合数据
  
  // 行动清单
  actionList    String @db.Text // JSON: [{title, action, exercises}]
  
  // 试卷匹配
  paperMatch    String? @db.Text // JSON: {paperId, confidence, name}
  
  // 报告内容
  reportContent String @db.Text // HTML/JSON
  exercises     String @db.Text // JSON: 推荐练习题
  
  createdAt     DateTime @default(now())
  
  user    User    @relation(fields: [userId], references: [id])
  child   Child   @relation(fields: [childId], references: [id])
  
  @@index([userId, createdAt])
  @@index([childId, createdAt])
  @@map("reports")
}

// ==================== 订单支付 ====================

model Order {
  id        String   @id @default(uuid())
  userId    String
  plan      String   // monthly, yearly
  amount    Int      // 分
  status    String   @default("pending") // pending, paid, refunded
  
  wxOrderId String?
  paidAt    DateTime?
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  user User @relation(fields: [userId], references: [id])
  
  @@map("orders")
}

// ==================== B端机构 ====================

model Institution {
  id          String @id @default(uuid())
  name        String
  type        String // kindergarten, tutoring, private_school, international, training
  contact     String
  phone       String
  email       String
  
  // 品牌定制
  logo        String?
  primaryColor String @default("#3B82F6")
  reportTemplate String @default("default")
  
  // API凭证
  apiKey      String @unique
  apiSecret   String
  
  // 订阅
  plan        String @default("trial") // trial, active, expired
  expiresAt   DateTime?
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  // 关联
  classes     Class[]
  students    Student[]
  
  @@map("institutions")
}

// ==================== B端班级 ====================

model Class {
  id            String @id @default(uuid())
  institutionId String
  name          String
  grade         Int
  subject       String
  
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  institution   Institution @relation(fields: [institutionId], references: [id])
  students      Student[]
  
  @@map("classes")
}

// ==================== B端学员 ====================

model Student {
  id            String @id @default(uuid())
  institutionId String
  classId       String
  name          String
  
  // 关联C端家长（可选）
  parentUserId  String?
  
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  institution   Institution @relation(fields: [institutionId], references: [id])
  class         Class       @relation(fields: [classId], references: [id])
  
  @@map("students")
}

// ==================== B端批量分析 ====================

model BatchAnalysis {
  id            String @id @default(uuid())
  institutionId String
  classId       String
  
  status        String @default("processing") // processing, completed, failed
  total         Int
  completed     Int @default(0)
  
  results       String? @db.Text // JSON: 批量分析结果
  
  createdAt     DateTime @default(now())
  completedAt   DateTime?
  
  @@map("batch_analyses")
}
```

---

## 二、关键索引

| 表 | 索引 | 用途 |
|----|------|------|
| users | openid (unique) | 微信登录快速查询 |
| users | inviteCode (unique) | 邀请码查询 |
| reports | userId + createdAt | 用户报告列表排序 |
| reports | childId + createdAt | 孩子报告列表排序 |
| orders | userId + status | 用户订单查询 |
| institutions | apiKey (unique) | B端API认证 |
| students | institutionId + classId | 班级学员查询 |

---

## 三、数据迁移策略

### 从现有XSC迁移

```bash
# 1. 备份现有数据库
cp prisma/dev.db prisma/dev.db.bak

# 2. 创建新迁移
npx prisma migrate dev --name add_b2b_models

# 3. 数据迁移脚本（如需）
# node scripts/migrate-data.js
```

---

*数据库设计 v1.0 - 2026-04-22*
