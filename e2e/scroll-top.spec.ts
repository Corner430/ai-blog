import { test, expect } from '@playwright/test'

test.describe('Scroll To Top', () => {
  test('should not show scroll-to-top button at page top', async ({ page }) => {
    await page.goto('/blog/hello-world', { waitUntil: 'domcontentloaded' })
    const scrollBtn = page.getByRole('button', { name: '回到顶部' })
    await expect(scrollBtn).not.toBeVisible()
  })

  test('should show scroll-to-top button after scrolling down', async ({ page }) => {
    await page.goto('/blog/hello-world', { waitUntil: 'domcontentloaded' })
    // Scroll down past threshold (50px) and wait for scroll to complete
    await page.evaluate(() => window.scrollTo(0, 500))
    await page.waitForFunction(() => window.scrollY > 50, null, { timeout: 5000 })
    const scrollBtn = page.getByRole('button', { name: '回到顶部' })
    await expect(scrollBtn).toBeVisible({ timeout: 10000 })
  })

  test('should scroll to top when clicking the button', async ({ page }) => {
    await page.goto('/blog/hello-world', { waitUntil: 'domcontentloaded' })
    await page.evaluate(() => window.scrollTo(0, 500))
    await page.waitForFunction(() => window.scrollY > 50, null, { timeout: 5000 })
    const scrollBtn = page.getByRole('button', { name: '回到顶部' })
    await expect(scrollBtn).toBeVisible({ timeout: 10000 })
    await scrollBtn.click()
    // Wait for scroll to complete
    await page.waitForFunction(() => window.scrollY === 0, null, { timeout: 5000 })
  })
})
