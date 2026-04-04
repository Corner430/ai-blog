import { test, expect } from '@playwright/test'

test.describe('Theme Switch', () => {
  test('should open theme menu and switch to dark mode', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' })
    // Click theme switcher button
    const themeBtn = page.getByRole('button', { name: '切换主题' })
    await expect(themeBtn).toBeVisible()
    await themeBtn.click()
    // Wait for the menu items container to appear
    const menuItems = page.locator('[role="menu"]')
    await expect(menuItems).toBeVisible({ timeout: 10000 })
    // Menu should appear with Light, Dark, System options
    const darkBtn = menuItems.getByRole('menuitem').filter({ hasText: '暗色' })
    await expect(darkBtn).toBeVisible({ timeout: 5000 })
    await expect(menuItems.getByRole('menuitem').filter({ hasText: '亮色' })).toBeVisible()
    await expect(menuItems.getByRole('menuitem').filter({ hasText: '跟随系统' })).toBeVisible()
    // Click Dark
    await darkBtn.click()
    // HTML should have class="dark"
    await expect(page.locator('html')).toHaveClass(/dark/)
  })

  test('should switch back to light mode', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' })
    // First switch to dark
    const themeBtn = page.getByRole('button', { name: '切换主题' })
    await expect(themeBtn).toBeVisible()
    await themeBtn.click()
    const menuItems = page.locator('[role="menu"]')
    await expect(menuItems).toBeVisible({ timeout: 10000 })
    await menuItems.getByRole('menuitem').filter({ hasText: '暗色' }).click()
    await expect(page.locator('html')).toHaveClass(/dark/)
    // Then switch to light
    await themeBtn.click()
    await expect(menuItems).toBeVisible({ timeout: 10000 })
    await menuItems.getByRole('menuitem').filter({ hasText: '亮色' }).click()
    await expect(page.locator('html')).not.toHaveClass(/dark/)
  })
})
