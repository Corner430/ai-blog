import { test, expect } from '@playwright/test'

test.describe('Blog List Page', () => {
  test('should display "All Posts" heading and article list', async ({ page }) => {
    await page.goto('/blog')
    // On desktop, the h1 is sm:hidden but the sidebar h3 "All Posts" is visible
    const sidebar = page.locator('.hidden.sm\\:flex').filter({ hasText: 'All Posts' })
    await expect(sidebar).toBeVisible()
    // At least one article should be listed
    const articles = page.locator('article')
    await expect(articles.first()).toBeVisible()
  })

  test('should navigate to article when clicking title', async ({ page }) => {
    await page.goto('/blog', { waitUntil: 'networkidle' })
    await Promise.all([
      page.waitForURL(/\/blog\/hello-world/, { timeout: 15000 }),
      page.getByRole('link', { name: /Hello World/i }).first().click(),
    ])
  })

  test('should navigate to tags page when clicking a tag', async ({ page }) => {
    await page.goto('/blog', { waitUntil: 'networkidle' })
    const tagLink = page.locator('a[href*="/tags/"]').first()
    await expect(tagLink).toBeVisible()
    await Promise.all([
      page.waitForURL(/\/tags\//, { timeout: 15000 }),
      tagLink.click(),
    ])
  })

  test('should show tag sidebar on desktop', async ({ page }) => {
    await page.goto('/blog')
    // The sidebar with tag list is visible on desktop (hidden on sm:)
    const sidebar = page.locator('.hidden.sm\\:flex').filter({ hasText: 'All Posts' })
    await expect(sidebar).toBeVisible()
  })
})
