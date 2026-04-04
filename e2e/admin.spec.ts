import { test, expect } from '@playwright/test'
import { loginAsAdmin } from './helpers/admin-auth'

test.describe('Admin Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page)
  })

  const cards = [
    { name: '封面图生成', href: '/admin/cover' },
    { name: '自动标签', href: '/admin/tags' },
    { name: '写作助手', href: '/admin/writing' },
  ]

  test('should display admin dashboard with title and feature cards', async ({ page }) => {
    await page.goto('/admin', { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { name: '管理中心' })).toBeVisible()
    for (const card of cards) {
      await expect(page.getByRole('link', { name: new RegExp(card.name) })).toBeVisible()
    }
  })

  for (const card of cards) {
    test(`should navigate to ${card.href} when clicking ${card.name}`, async ({ page }) => {
      await page.goto('/admin', { waitUntil: 'domcontentloaded' })
      await Promise.all([
        page.waitForURL(new RegExp(card.href), { timeout: 30000 }),
        page.getByRole('link', { name: new RegExp(card.name) }).click(),
      ])
    })
  }
})
