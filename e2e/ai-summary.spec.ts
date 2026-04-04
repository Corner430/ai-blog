import { test, expect } from '@playwright/test'
import { mockTextStream, mockErrorResponse } from './helpers/mock-api'

test.describe('AI Summary', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage to avoid cached summaries
    await page.addInitScript(() => {
      window.localStorage.clear()
    })
  })

  test('should display AI summary section with label', async ({ page }) => {
    await mockTextStream(page, '**/api/ai/summary', 'This is a test summary of the article.')
    await page.goto('/blog/hello-world')
    const summary = page.getByTestId('ai-summary')
    await expect(summary).toBeVisible()
    await expect(summary.getByText('AI 摘要')).toBeVisible()
    // Summary text should appear after loading
    await expect(summary.getByText('This is a test summary of the article.')).toBeVisible({
      timeout: 10000,
    })
  })

  test('should show loading skeleton while fetching', async ({ page }) => {
    // Delay needed to observe loading state — inline mock required
    await page.route('**/api/ai/summary', async (route) => {
      await new Promise((r) => setTimeout(r, 30000))
      await route.fulfill({
        status: 200,
        contentType: 'text/plain; charset=utf-8',
        body: 'Summary text',
      })
    })
    await page.goto('/blog/hello-world')
    const summary = page.getByTestId('ai-summary')
    // Loading skeleton should be visible while the response is delayed
    await expect(summary.getByTestId('ai-summary-loading')).toBeVisible({ timeout: 15000 })
  })

  test('should show error message on API failure', async ({ page }) => {
    await page.route('**/api/ai/summary', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'text/plain',
        body: 'Internal Server Error',
      })
    })
    await page.goto('/blog/hello-world')
    const summary = page.getByTestId('ai-summary')
    await expect(summary.getByText('AI 摘要生成失败，请稍后刷新重试')).toBeVisible({
      timeout: 15000,
    })
  })
})
