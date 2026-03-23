import { test, expect } from '@playwright/test'

test.describe('Blog Post Page', () => {
  test('should display article title, date, and content', async ({ page }) => {
    await page.goto('/blog/hello-world')
    // Title
    await expect(page.getByRole('heading', { name: 'Hello World' })).toBeVisible()
    // Date
    await expect(page.locator('time')).toBeVisible()
    // Content
    await expect(page.getByText('Welcome to my blog')).toBeVisible()
  })

  test('should navigate back to blog list via "Back to the blog" link', async ({ page }) => {
    await page.goto('/blog/hello-world', { waitUntil: 'networkidle' })
    const backLink = page.getByRole('link', { name: /Back to the blog/i })
    await expect(backLink).toBeVisible()
    await Promise.all([
      page.waitForURL(/\/blog\/?$/, { timeout: 15000 }),
      backLink.click(),
    ])
  })

  test('should navigate to tag page when clicking a tag', async ({ page }) => {
    await page.goto('/blog/hello-world', { waitUntil: 'networkidle' })
    const tagLink = page.locator('a[href*="/tags/"]').first()
    await expect(tagLink).toBeVisible()
    await Promise.all([
      page.waitForURL(/\/tags\//, { timeout: 15000 }),
      tagLink.click(),
    ])
  })

  test('should show 404 for non-existent post', async ({ page }) => {
    await page.goto('/blog/this-post-does-not-exist-at-all', {
      timeout: 60000,
      waitUntil: 'domcontentloaded',
    })
    // Should show 404 content
    await expect(page.getByText('404')).toBeVisible({ timeout: 15000 })
  })
})
