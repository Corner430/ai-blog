import { test, expect } from '@playwright/test'

test.describe('Mobile Navigation', () => {
  test.use({ viewport: { width: 390, height: 844 } })

  test('should open sidebar when clicking hamburger menu', async ({ page }) => {
    await page.goto('/')
    const menuButton = page.getByRole('button', { name: 'Toggle Menu' }).first()
    await expect(menuButton).toBeVisible()
    await menuButton.click()
    // Wait for the transition - the DialogPanel has nav links
    const nav = page.locator('nav').filter({ has: page.getByRole('link', { name: 'Home' }) })
    await expect(nav).toBeVisible({ timeout: 5000 })
    for (const name of ['Home', 'Blog', 'Tags', 'Projects', 'About']) {
      await expect(nav.getByRole('link', { name })).toBeVisible()
    }
  })

  test('should navigate and close sidebar when clicking a link', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: 'Toggle Menu' }).first().click()
    const nav = page.locator('nav').filter({ has: page.getByRole('link', { name: 'Home' }) })
    await expect(nav).toBeVisible({ timeout: 5000 })
    await nav.getByRole('link', { name: 'Blog' }).click()
    await expect(page).toHaveURL(/\/blog/)
    // Sidebar should close after navigation (nav links no longer visible)
    await expect(nav).not.toBeVisible({ timeout: 5000 })
  })

  test('should close sidebar when clicking X button', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: 'Toggle Menu' }).first().click()
    const nav = page.locator('nav').filter({ has: page.getByRole('link', { name: 'Home' }) })
    await expect(nav).toBeVisible({ timeout: 5000 })
    // The X close button is fixed-position inside the DialogPanel
    const closeButton = page.locator('button.fixed[aria-label="Toggle Menu"]')
    await closeButton.click()
    await expect(nav).not.toBeVisible({ timeout: 5000 })
  })
})
