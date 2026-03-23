import { test, expect } from '@playwright/test'
import { mockCoverSubmit, mockCoverQuery } from './helpers/mock-api'

test.describe('Cover Image Generation', () => {
  test('should disable generate button when title is empty', async ({ page }) => {
    await page.goto('/admin/cover')
    const generateBtn = page.getByRole('button', { name: /生成封面/ })
    await expect(generateBtn).toBeDisabled()
  })

  test('should generate cover image successfully', async ({ page }) => {
    await mockCoverSubmit(page, 'test-job-123')
    await mockCoverQuery(page, 'done', 'https://example.com/cover.png')
    await page.goto('/admin/cover')
    // Fill title
    await page.locator('input[type="text"]').fill('Test Article Title')
    // Click generate
    const generateBtn = page.getByRole('button', { name: /生成封面/ })
    await expect(generateBtn).toBeEnabled()
    await generateBtn.click()
    // Button should show loading state
    await expect(page.getByRole('button', { name: /生成中/ })).toBeVisible()
    // After polling completes, image preview should appear
    await expect(page.locator('img[alt="封面图预览"]')).toBeVisible({ timeout: 15000 })
    // Action buttons should be visible
    await expect(page.getByRole('button', { name: '下载图片' })).toBeVisible()
    await expect(page.getByRole('button', { name: '复制 URL' })).toBeVisible()
  })

  test('should copy URL and show "已复制"', async ({ page }) => {
    await mockCoverSubmit(page, 'test-job-456')
    await mockCoverQuery(page, 'done', 'https://example.com/cover.png')
    // Grant clipboard permission
    await page.context().grantPermissions(['clipboard-write', 'clipboard-read'])
    await page.goto('/admin/cover')
    await page.locator('input[type="text"]').fill('Test Title')
    await page.getByRole('button', { name: /生成封面/ }).click()
    await expect(page.locator('img[alt="封面图预览"]')).toBeVisible({ timeout: 15000 })
    await page.getByRole('button', { name: '复制 URL' }).click()
    await expect(page.getByRole('button', { name: '已复制' })).toBeVisible()
  })

  test('should show error on submit failure', async ({ page }) => {
    await page.route('**/api/ai/cover/submit', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: '提交失败' }),
      })
    })
    await page.goto('/admin/cover')
    await page.locator('input[type="text"]').fill('Test Title')
    await page.getByRole('button', { name: /生成封面/ }).click()
    await expect(page.getByText('提交失败')).toBeVisible({ timeout: 10000 })
  })
})
