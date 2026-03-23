import { test, expect } from '@playwright/test'

test.describe('Theme Switch', () => {
  test('should open theme menu and switch to dark mode', async ({ page }) => {
    await page.goto('/')
    // Click theme switcher button
    await page.getByRole('button', { name: 'Theme switcher' }).click()
    // Menu should appear with Light, Dark, System options
    await expect(page.getByRole('menuitem', { name: /Dark/i })).toBeVisible()
    await expect(page.getByRole('menuitem', { name: /Light/i })).toBeVisible()
    await expect(page.getByRole('menuitem', { name: /System/i })).toBeVisible()
    // Click Dark
    await page.getByRole('menuitem', { name: /Dark/i }).click()
    // HTML should have class="dark"
    await expect(page.locator('html')).toHaveClass(/dark/)
  })

  test('should switch back to light mode', async ({ page }) => {
    await page.goto('/')
    // First switch to dark
    await page.getByRole('button', { name: 'Theme switcher' }).click()
    await page.getByRole('menuitem', { name: /Dark/i }).click()
    await expect(page.locator('html')).toHaveClass(/dark/)
    // Then switch to light
    await page.getByRole('button', { name: 'Theme switcher' }).click()
    await page.getByRole('menuitem', { name: /Light/i }).click()
    await expect(page.locator('html')).not.toHaveClass(/dark/)
  })
})
