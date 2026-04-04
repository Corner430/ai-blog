import { test, expect } from '@playwright/test'

test.describe('Tags Page', () => {
  test('should display Tags heading and tag list', async ({ page }) => {
    await page.goto('/tags')
    await expect(page.getByRole('heading', { name: '标签' })).toBeVisible()
    // Should have at least one tag link
    const tagLinks = page.locator('a[href*="/tags/"]')
    await expect(tagLinks.first()).toBeVisible()
  })

  test('should navigate to tag article list when clicking a tag', async ({ page }) => {
    await page.goto('/tags')
    // Click the first tag link inside the main content (not the nav bar)
    const tagLink = page.locator('main a[href*="/tags/"]').first()
    const href = await tagLink.getAttribute('href')
    await tagLink.click()
    // Wait for navigation to the tag detail page
    await page.waitForURL(href!, { timeout: 30000 })
    // ListLayoutWithTags shows articles in li elements with article inside
    // On desktop, the sidebar "All Posts" text should be visible
    const sidebar = page.locator('.hidden.sm\\:flex').filter({ hasText: '全部文章' })
    await expect(sidebar).toBeVisible({ timeout: 10000 })
  })
})
