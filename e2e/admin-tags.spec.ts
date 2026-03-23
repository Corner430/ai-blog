import { test, expect } from '@playwright/test'
import { mockAdminArticles, mockJsonResponse, mockErrorResponse } from './helpers/mock-api'

const mockArticles = [
  {
    filename: 'hello-world.mdx',
    title: 'Hello World',
    tags: ['blog'],
    content: 'Welcome to my blog.',
  },
]

test.describe('Auto-Tagging Management', () => {
  test('should display article list with existing tags', async ({ page }) => {
    await mockAdminArticles(page, mockArticles)
    await page.goto('/admin/tags')
    await expect(page.getByRole('heading', { name: '自动标签管理' })).toBeVisible()
    // Article title in the card
    const card = page.locator('.rounded-lg.border').first()
    await expect(card.getByText('Hello World')).toBeVisible()
    await expect(card.getByText('hello-world.mdx')).toBeVisible()
    // Tag "blog" displayed as a span in the card
    await expect(card.locator('span').filter({ hasText: 'blog' })).toBeVisible()
  })

  test('should show empty state when no articles', async ({ page }) => {
    await mockAdminArticles(page, [])
    await page.goto('/admin/tags')
    await expect(page.getByText('暂无文章')).toBeVisible()
  })

  test('should generate tag suggestions and display checkboxes', async ({ page }) => {
    await mockAdminArticles(page, mockArticles)
    await mockJsonResponse(page, '**/api/ai/tags', { tags: ['javascript', 'typescript', 'react'] })
    await page.goto('/admin/tags')
    const card = page.locator('.rounded-lg.border').first()
    await expect(card.getByText('Hello World')).toBeVisible()
    // Click generate tags button
    await card.getByRole('button', { name: /生成标签/ }).click()
    // Suggested tags should appear with checkboxes inside the card
    await expect(card.getByText('javascript')).toBeVisible({ timeout: 10000 })
    await expect(card.getByText('typescript')).toBeVisible()
    await expect(card.getByText('react')).toBeVisible()
    // All checkboxes should be checked by default
    const checkboxes = card.locator('input[type="checkbox"]')
    const count = await checkboxes.count()
    expect(count).toBe(3)
    for (let i = 0; i < count; i++) {
      await expect(checkboxes.nth(i)).toBeChecked()
    }
    // Write button should be visible
    await expect(card.getByRole('button', { name: /写入 frontmatter/ })).toBeVisible()
  })

  test('should uncheck tags and write remaining', async ({ page }) => {
    await mockAdminArticles(page, mockArticles)
    await mockJsonResponse(page, '**/api/ai/tags', { tags: ['javascript', 'typescript', 'react'] })
    await page.route('**/api/admin/tags/write', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true }),
      })
    })
    await page.goto('/admin/tags')
    const card = page.locator('.rounded-lg.border').first()
    await card.getByRole('button', { name: /生成标签/ }).click()
    await expect(card.getByText('javascript')).toBeVisible({ timeout: 10000 })
    // Uncheck 'react' by clicking its checkbox
    const reactLabel = card.locator('label').filter({ hasText: 'react' })
    await reactLabel.locator('input[type="checkbox"]').uncheck()
    // Write tags
    await card.getByRole('button', { name: /写入 frontmatter/ }).click()
    await expect(card.getByText('标签已写入')).toBeVisible({ timeout: 10000 })
  })

  test('should show error when tag generation fails', async ({ page }) => {
    await mockAdminArticles(page, mockArticles)
    await mockErrorResponse(page, '**/api/ai/tags', 500, '生成标签错误')
    await page.goto('/admin/tags')
    const card = page.locator('.rounded-lg.border').first()
    await card.getByRole('button', { name: /生成标签/ }).click()
    await expect(card.getByText('生成标签错误')).toBeVisible({ timeout: 10000 })
  })
})
