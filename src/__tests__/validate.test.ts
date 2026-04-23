import { describe, it, expect } from 'vitest'
import { validateSafe, formatZodErrors, pdfExportSchema, consultSchema, referralClaimSchema } from '@/lib/validate'

describe('Validation', () => {
  it('should validate PDF export input', () => {
    const result = validateSafe(pdfExportSchema, { type: 'report', reportId: 'rep-123' })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.type).toBe('report')
      expect(result.data.reportId).toBe('rep-123')
    }
  })

  it('should reject invalid PDF type', () => {
    const result = validateSafe(pdfExportSchema, { type: 'invalid' })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.errors.length).toBeGreaterThan(0)
    }
  })

  it('should validate consult input', () => {
    const result = validateSafe(consultSchema, { question: '孩子数学怎么提升？' })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.question).toBe('孩子数学怎么提升？')
    }
  })

  it('should reject empty consult question', () => {
    const result = validateSafe(consultSchema, { question: '' })
    expect(result.success).toBe(false)
  })

  it('should validate referral code', () => {
    const result = validateSafe(referralClaimSchema, { code: 'ABCDE' })
    expect(result.success).toBe(true)
  })

  it('should format zod errors', () => {
    const result = validateSafe(pdfExportSchema, { type: 'bad' })
    if (!result.success) {
      const formatted = formatZodErrors(result.errors)
      expect(typeof formatted).toBe('string')
      expect(formatted.length).toBeGreaterThan(0)
    }
  })
})
