/**
 * WinGo 企业级输入校验（Zod）
 * - 统一 Schema 定义
 * - 自动错误格式化
 * - 类型推导导出
 */

import { z } from 'zod'

// ==================== 基础类型 ====================
export const uuidSchema = z.string().uuid()
export const idSchema = z.string().min(1).max(64)
export const textSchema = z.string().min(1).max(10000)
export const subjectSchema = z.enum(['math', 'chinese', 'english', 'science'])
export const memberTypeSchema = z.enum(['none', 'month', 'year'])

// ==================== API 请求 Schema ====================

// 学情分析
export const analyzeSchema = z.object({
  text: textSchema,
  subject: subjectSchema.optional().default('math'),
  generateExerciseSet: z.boolean().optional().default(false),
  ocrText: z.string().optional(),
})

// 用户注册/登录
export const wechatAuthSchema = z.object({
  code: z.string().min(1).max(256),
  openid: z.string().optional(),
})

// 邀请码
export const referralCreateSchema = z.object({})
export const referralClaimSchema = z.object({
  code: z.string().min(4).max(16),
})

// 报告查询
export const reportQuerySchema = z.object({
  id: idSchema,
})

// PDF 导出
export const pdfExportSchema = z.object({
  reportId: idSchema.optional(),
  type: z.enum(['report', 'monthly']),
})

// 咨询
export const consultSchema = z.object({
  question: z.string().min(1).max(2000),
  context: z.string().max(5000).optional(),
})

// Webhook 事件
export const webhookUserRegisterSchema = z.object({
  userId: idSchema,
  openid: z.string().min(1),
  nickname: z.string().optional(),
  createdAt: z.string().datetime().optional(),
})

export const webhookReportReadySchema = z.object({
  userId: idSchema,
  openid: z.string().min(1),
  reportId: idSchema,
  score: z.number().min(0).max(100).optional(),
  weakPoints: z.array(z.string()).optional(),
  subject: z.string().optional(),
  createdAt: z.string().datetime().optional(),
})

export const webhookLimitExceededSchema = z.object({
  userId: idSchema,
  openid: z.string().min(1),
  nickname: z.string().optional(),
  freeCount: z.number().int().min(0).optional(),
  memberType: memberTypeSchema.optional(),
})

// 小程序登录
export const wxappLoginSchema = z.object({
  code: z.string().min(1).max(256),
})

// B端
export const classAnalyticsSchema = z.object({
  id: idSchema,
})

// ==================== 校验函数 ====================

export function validate<T>(schema: z.ZodSchema<T>, data: unknown): T {
  return schema.parse(data)
}

export function validateSafe<T>(schema: z.ZodSchema<T>, data: unknown): { success: true; data: T } | { success: false; errors: z.ZodIssue[] } {
  const result = schema.safeParse(data)
  if (result.success) {
    return { success: true, data: result.data }
  }
  return { success: false, errors: result.error.issues }
}

export function formatZodErrors(issues: z.ZodIssue[]): string {
  return issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ')
}

// ==================== 类型导出 ====================
export type AnalyzeInput = z.infer<typeof analyzeSchema>
export type WechatAuthInput = z.infer<typeof wechatAuthSchema>
export type ReferralClaimInput = z.infer<typeof referralClaimSchema>
export type PDFExportInput = z.infer<typeof pdfExportSchema>
export type ConsultInput = z.infer<typeof consultSchema>
export type WxappLoginInput = z.infer<typeof wxappLoginSchema>
