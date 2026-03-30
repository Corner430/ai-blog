import { test, expect } from '@playwright/test'

test.describe('404 Page', () => {
  test('should display 404 error page for non-existent route', async ({ page }) => {
    await page.goto('/this-page-does-not-exist')
    await expect(page.getByRole('heading', { name: '404' })).toBeVisible()
    await expect(page.getByText('抱歉，页面未找到')).toBeVisible()
    await expect(page.getByRole('link', { name: '返回首页' })).toBeVisible()
  })

  test('should navigate to homepage when clicking 返回首页', async ({ page }) => {
    await page.goto('/this-page-does-not-exist')
    await page.getByRole('link', { name: '返回首页' }).click()
    await expect(page).toHaveURL('/')
  })
})
