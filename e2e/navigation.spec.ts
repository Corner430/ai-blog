import { test, expect } from '@playwright/test'

test.describe('Desktop Navigation', () => {
  const navLinks = [
    { name: '博客', href: '/blog' },
    { name: '标签', href: '/tags' },
    { name: '项目', href: '/projects' },
    { name: '推荐资源', href: '/resources' },
    { name: '关于', href: '/about' },
  ]

  for (const { name, href } of navLinks) {
    test(`should navigate to ${href} when clicking ${name}`, async ({ page }) => {
      await page.goto('/', { waitUntil: 'domcontentloaded' })
      // Desktop nav links are inside the hidden sm:flex container
      const navContainer = page.locator('.no-scrollbar.hidden.sm\\:flex')
      const link = navContainer.getByRole('link', { name })
      await expect(link).toBeVisible()
      await Promise.all([page.waitForURL(new RegExp(href), { timeout: 30000 }), link.click()])
    })
  }

  test('should hide desktop nav links on small screens', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/', { waitUntil: 'domcontentloaded' })
    // Desktop nav container should be hidden
    const navContainer = page.locator('.no-scrollbar.hidden.sm\\:flex')
    await expect(navContainer).not.toBeVisible()
    // Hamburger menu button should be visible
    await expect(page.getByRole('button', { name: '切换菜单' })).toBeVisible()
  })
})
