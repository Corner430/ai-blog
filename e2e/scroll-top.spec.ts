import { test, expect } from '@playwright/test'

test.describe('Scroll To Top', () => {
  test('should not show scroll-to-top button at page top', async ({ page }) => {
    await page.goto('/blog/hello-world')
    const scrollBtn = page.getByRole('button', { name: 'Scroll To Top' })
    await expect(scrollBtn).not.toBeVisible()
  })

  test('should show scroll-to-top button after scrolling down', async ({ page }) => {
    await page.goto('/blog/hello-world')
    // Scroll down past threshold (50px)
    await page.evaluate(() => window.scrollTo(0, 200))
    const scrollBtn = page.getByRole('button', { name: 'Scroll To Top' })
    await expect(scrollBtn).toBeVisible({ timeout: 5000 })
  })

  test('should scroll to top when clicking the button', async ({ page }) => {
    await page.goto('/blog/hello-world')
    await page.evaluate(() => window.scrollTo(0, 200))
    const scrollBtn = page.getByRole('button', { name: 'Scroll To Top' })
    await expect(scrollBtn).toBeVisible({ timeout: 5000 })
    await scrollBtn.click()
    // Wait for scroll to complete
    await page.waitForFunction(() => window.scrollY === 0, null, { timeout: 5000 })
  })
})
