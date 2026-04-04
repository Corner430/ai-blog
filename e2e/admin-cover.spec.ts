import { test, expect } from '@playwright/test'
import { mockAdminArticles, mockCoverSubmit, mockCoverQuery } from './helpers/mock-api'
import { loginAsAdmin } from './helpers/admin-auth'

const mockArticles = [
  {
    filename: 'test-post.mdx',
    title: 'Test Article Title',
    tags: ['blog'],
    content: 'Test content',
    summary: 'Test summary for cover generation',
  },
]

async function setupCoverPage(page: import('@playwright/test').Page) {
  await mockAdminArticles(page, mockArticles)
  await page.goto('/admin/cover')
  // Wait for loading to finish and select to appear
  const select = page.locator('select#cover-article')
  await expect(select).toBeVisible({ timeout: 30000 })
  return select
}

test.describe('Cover Image Generation', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page)
  })

  test('should disable generate button when title is empty', async ({ page }) => {
    const select = await setupCoverPage(page)
    await expect(select).toBeVisible()
    const generateBtn = page.getByRole('button', { name: /生成封面/ })
    await expect(generateBtn).toBeDisabled()
  })

  test('should generate cover image successfully', async ({ page }) => {
    await mockCoverSubmit(page, 'test-job-123')
    await mockCoverQuery(page, 'done', 'https://example.com/cover.png')
    const select = await setupCoverPage(page)
    await select.selectOption('test-post.mdx')
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
    const select = await setupCoverPage(page)
    await select.selectOption('test-post.mdx')
    await page.getByRole('button', { name: /生成封面/ }).click()
    await expect(page.locator('img[alt="封面图预览"]')).toBeVisible({ timeout: 15000 })
    await page.context().grantPermissions(['clipboard-write', 'clipboard-read'])
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
    const select = await setupCoverPage(page)
    await select.selectOption('test-post.mdx')
    await page.getByRole('button', { name: /生成封面/ }).click()
    await expect(page.getByText('提交失败')).toBeVisible({ timeout: 10000 })
  })
})
