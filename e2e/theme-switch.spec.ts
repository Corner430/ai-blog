import { test, expect } from '@playwright/test'

test.describe('Theme Switch', () => {
  test('should open theme menu and switch to dark mode', async ({ page }) => {
    await page.goto('/')
    // Click theme switcher button
    await page.getByRole('button', { name: '切换主题' }).click()
    // Menu should appear with Light, Dark, System options
    await expect(page.getByRole('menuitem', { name: /暗色/i })).toBeVisible()
    await expect(page.getByRole('menuitem', { name: /亮色/i })).toBeVisible()
    await expect(page.getByRole('menuitem', { name: /跟随系统/i })).toBeVisible()
    // Click Dark
    await page.getByRole('menuitem', { name: /暗色/i }).click()
    // HTML should have class="dark"
    await expect(page.locator('html')).toHaveClass(/dark/)
  })

  test('should switch back to light mode', async ({ page }) => {
    await page.goto('/')
    // First switch to dark
    await page.getByRole('button', { name: '切换主题' }).click()
    await page.getByRole('menuitem', { name: /暗色/i }).click()
    await expect(page.locator('html')).toHaveClass(/dark/)
    // Then switch to light
    await page.getByRole('button', { name: '切换主题' }).click()
    await page.getByRole('menuitem', { name: /亮色/i }).click()
    await expect(page.locator('html')).not.toHaveClass(/dark/)
  })
})
