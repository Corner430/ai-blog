import { Page } from '@playwright/test'
import { createHmac } from 'crypto'

/**
 * Generate the admin token matching middleware.ts logic.
 * middleware uses Web Crypto HMAC-SHA256 with password as key and 'admin-session' as message.
 * Node's crypto.createHmac produces the same result.
 */
function generateAdminToken(password: string): string {
  return createHmac('sha256', password).update('admin-session').digest('hex')
}

/**
 * Set the admin-token cookie so admin pages don't redirect to login.
 */
export async function loginAsAdmin(page: Page) {
  const password = process.env.ADMIN_PASSWORD
  if (!password) {
    throw new Error('ADMIN_PASSWORD env var is required for admin E2E tests')
  }
  const token = generateAdminToken(password)
  await page.context().addCookies([
    {
      name: 'admin-token',
      value: token,
      domain: 'localhost',
      path: '/',
    },
  ])
}
