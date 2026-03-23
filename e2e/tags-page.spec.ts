import { test, expect } from '@playwright/test'

test.describe('Tags Page', () => {
  test('should display Tags heading and tag list', async ({ page }) => {
    await page.goto('/tags')
    await expect(page.getByRole('heading', { name: 'Tags' })).toBeVisible()
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
    await page.waitForURL(href!)
    // ListLayoutWithTags shows articles in li elements with article inside
    // On desktop, the sidebar "All Posts" text should be visible
    const sidebar = page.locator('.hidden.sm\\:flex').filter({ hasText: 'All Posts' })
    await expect(sidebar).toBeVisible({ timeout: 10000 })
  })
})
