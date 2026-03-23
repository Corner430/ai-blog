import { test, expect } from '@playwright/test'

test.describe('404 Page', () => {
  test('should display 404 error page for non-existent route', async ({ page }) => {
    await page.goto('/this-page-does-not-exist')
    await expect(page.getByRole('heading', { name: '404' })).toBeVisible()
    await expect(page.getByText("Sorry we couldn't find this page.")).toBeVisible()
    await expect(page.getByRole('link', { name: 'Back to homepage' })).toBeVisible()
  })

  test('should navigate to homepage when clicking Back to homepage', async ({ page }) => {
    await page.goto('/this-page-does-not-exist')
    await page.getByRole('link', { name: 'Back to homepage' }).click()
    await expect(page).toHaveURL('/')
  })
})
