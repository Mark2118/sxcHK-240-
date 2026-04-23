import { test, expect } from '@playwright/test'
import { MASTER_KEY } from './helpers'

test.describe('OPC Cockpit', () => {
  test('should load dashboard with data', async ({ page }) => {
    await page.goto(`/xsc/cockpit?key=${MASTER_KEY}`)
    await page.waitForLoadState('networkidle')
    const body = await page.content()
    expect(body.includes('WinGo') || body.includes('运营')).toBe(true)
  })

  test('should load without master key', async ({ page }) => {
    await page.goto('/xsc/cockpit')
    await page.waitForLoadState('networkidle')
    const body = await page.content()
    expect(body.includes('WinGo')).toBe(true)
  })
})
