import { test, expect } from '@playwright/test'
import { mockJsonResponse, mockErrorResponse } from './helpers/mock-api'

test.describe('Search', () => {
  test('should open search modal when clicking search button', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: 'Search' }).click()
    await expect(page.getByTestId('ai-search-modal')).toBeVisible()
  })

  test('should open search modal with Ctrl+K', async ({ page }) => {
    await page.goto('/')
    await page.keyboard.press('Control+k')
    await expect(page.getByTestId('ai-search-modal')).toBeVisible()
  })

  test('should close search modal with ESC', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: 'Search' }).click()
    await expect(page.getByTestId('ai-search-modal')).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(page.getByTestId('ai-search-modal')).not.toBeVisible()
  })

  test('should show "未找到相关文章" when no results', async ({ page }) => {
    // Mock AI search returning empty results
    await mockJsonResponse(page, '**/api/ai/search', { results: [] })
    await page.goto('/')
    await page.getByRole('button', { name: 'Search' }).click()
    const modal = page.getByTestId('ai-search-modal')
    await modal.locator('input').fill('xyznonexistent')
    await expect(modal.getByText('未找到相关文章')).toBeVisible({ timeout: 10000 })
  })

  test('should show AI search results and navigate on click', async ({ page }) => {
    await mockJsonResponse(page, '**/api/ai/search', {
      results: [
        { slug: 'hello-world', title: 'Hello World', summary: 'First post', score: 1 },
      ],
    })
    await page.goto('/')
    await page.getByRole('button', { name: 'Search' }).click()
    const modal = page.getByTestId('ai-search-modal')
    await modal.locator('input').fill('hello')
    // Wait for results
    await expect(modal.getByText('Hello World')).toBeVisible({ timeout: 10000 })
    // Click the result
    await modal.getByText('Hello World').click()
    await expect(page).toHaveURL(/\/blog\/hello-world/)
  })

  test('should show loading state during AI search', async ({ page }) => {
    // Mock a delayed response
    await page.route('**/api/ai/search', async (route) => {
      await new Promise((r) => setTimeout(r, 2000))
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ results: [] }),
      })
    })
    await page.goto('/')
    await page.getByRole('button', { name: 'Search' }).click()
    const modal = page.getByTestId('ai-search-modal')
    await modal.locator('input').fill('test query')
    await expect(modal.getByText('搜索中...')).toBeVisible({ timeout: 5000 })
  })

  test('should show empty results when AI search returns error', async ({ page }) => {
    await mockErrorResponse(page, '**/api/ai/search', 500, 'Internal error')
    await page.goto('/')
    await page.getByRole('button', { name: 'Search' }).click()
    const modal = page.getByTestId('ai-search-modal')
    await modal.locator('input').fill('Hello')
    // When AI is enabled and search fails, fallback keyword search has no docs loaded
    // so it shows empty results
    await expect(modal.getByText('未找到相关文章')).toBeVisible({ timeout: 10000 })
  })
})
