import { test, expect } from '@playwright/test'

test.describe('Blog List Page', () => {
  test('should display "All Posts" heading and article list', async ({ page }) => {
    await page.goto('/blog')
    // On desktop, the h1 is sm:hidden but the sidebar h3 "All Posts" is visible
    const sidebar = page.locator('.hidden.sm\\:flex').filter({ hasText: '全部文章' })
    await expect(sidebar).toBeVisible()
    // At least one article should be listed
    const articles = page.locator('article')
    await expect(articles.first()).toBeVisible()
  })

  test('should navigate to article when clicking title', async ({ page }) => {
    await page.goto('/blog', { waitUntil: 'domcontentloaded' })
    const firstArticleLink = page.locator('article h2 a').first()
    await expect(firstArticleLink).toBeVisible()
    const href = await firstArticleLink.getAttribute('href')
    await Promise.all([
      page.waitForURL(new RegExp(href!), { timeout: 30000 }),
      firstArticleLink.click(),
    ])
  })

  test('should navigate to tags page when clicking a tag', async ({ page }) => {
    await page.goto('/blog', { waitUntil: 'domcontentloaded' })
    const tagLink = page.locator('a[href*="/tags/"]').first()
    await expect(tagLink).toBeVisible()
    await Promise.all([page.waitForURL(/\/tags\//, { timeout: 30000 }), tagLink.click()])
  })

  test('should show tag sidebar on desktop', async ({ page }) => {
    await page.goto('/blog')
    // The sidebar with tag list is visible on desktop (hidden on sm:)
    const sidebar = page.locator('.hidden.sm\\:flex').filter({ hasText: '全部文章' })
    await expect(sidebar).toBeVisible()
  })
})
