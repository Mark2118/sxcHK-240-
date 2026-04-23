import { test, expect } from '@playwright/test'

test.describe('Landing Page', () => {
  test('should load landing page with key elements', async ({ page }) => {
    await page.goto('/xsc/landing')

    // 页面标题
    await expect(page).toHaveTitle(/WinGo|学情/)

    // Hero 区域
    await expect(page.locator('h1:has-text("拍一拍作业")').first()).toBeVisible()
    await expect(page.locator('text=15秒看懂').first()).toBeVisible()

    // 信任条
    await expect(page.locator('text=位家长').first()).toBeVisible()

    // 定价卡片
    await expect(page.locator('text=体验版').first()).toBeVisible()
    await expect(page.locator('text=月卡').first()).toBeVisible()
    await expect(page.locator('text=年卡').first()).toBeVisible()

    // CTA 按钮
    await expect(page.locator('text=开始体验').first()).toBeVisible()

    // FAQ
    await expect(page.locator('text=您可能还想问').first()).toBeVisible()
  })

  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/xsc/landing')
    await expect(page.locator('h1:has-text("拍一拍作业")').first()).toBeVisible()
  })
})
