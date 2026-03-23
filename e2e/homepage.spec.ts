import { test, expect } from '@playwright/test'

test.describe('Homepage', () => {
  test('should display Latest heading and article list', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('heading', { name: 'Latest' })).toBeVisible()
    // At least one article should be listed
    const articles = page.locator('article')
    await expect(articles.first()).toBeVisible()
  })

  test('should show article title, date, and summary', async ({ page }) => {
    await page.goto('/')
    const article = page.locator('article').first()
    // Title link
    await expect(article.locator('h2 a')).toBeVisible()
    // Date
    await expect(article.locator('time')).toBeVisible()
    // Summary text
    await expect(article.locator('.prose')).toBeVisible()
  })

  test('should navigate to blog post when clicking Read more', async ({ page }) => {
    await page.goto('/')
    const readMore = page.getByRole('link', { name: /Read more/i }).first()
    await expect(readMore).toBeVisible()
    await readMore.click()
    await expect(page).toHaveURL(/\/blog\//)
  })
})
