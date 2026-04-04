import { test, expect } from '@playwright/test'
import { mockTextStream, mockErrorResponse } from './helpers/mock-api'
import { loginAsAdmin } from './helpers/admin-auth'

test.describe('Writing Assistant', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page)
  })

  test('should disable buttons when input is empty', async ({ page }) => {
    await page.goto('/admin/writing')
    await expect(page.getByRole('heading', { name: '写作助手' })).toBeVisible()
    await expect(page.getByRole('button', { name: '润色' })).toBeDisabled()
    await expect(page.getByRole('button', { name: '续写' })).toBeDisabled()
  })

  test('should polish text and show result', async ({ page }) => {
    await mockTextStream(page, '**/api/ai/writing', '这是润色后的文本')
    await page.goto('/admin/writing')
    const textarea = page.locator('textarea')
    await expect(textarea).toBeVisible()
    await textarea.click()
    await textarea.pressSequentially('test polish text', { delay: 30 })
    const polishBtn = page.getByRole('button', { name: '润色' })
    await expect(polishBtn).toBeEnabled({ timeout: 10000 })
    await polishBtn.click()
    // AI result should appear
    await expect(page.getByText('这是润色后的文本')).toBeVisible({ timeout: 10000 })
    // Action buttons should appear
    await expect(page.getByRole('button', { name: '复制结果' })).toBeVisible()
    await expect(page.getByRole('button', { name: '替换原文' })).toBeVisible()
  })

  test('should continue writing and show result', async ({ page }) => {
    await mockTextStream(page, '**/api/ai/writing', '续写的内容在这里')
    await page.goto('/admin/writing')
    const textarea = page.locator('textarea')
    await expect(textarea).toBeVisible()
    await textarea.click()
    await textarea.pressSequentially('start text', { delay: 30 })
    const continueBtn = page.getByRole('button', { name: '续写' })
    await expect(continueBtn).toBeEnabled({ timeout: 10000 })
    await continueBtn.click()
    await expect(page.getByText('续写的内容在这里')).toBeVisible({ timeout: 10000 })
  })

  test('should copy result and show "已复制"', async ({ page }) => {
    await mockTextStream(page, '**/api/ai/writing', '润色后的结果')
    await page.context().grantPermissions(['clipboard-write', 'clipboard-read'])
    await page.goto('/admin/writing')
    const textarea = page.locator('textarea')
    await expect(textarea).toBeVisible()
    await textarea.click()
    await textarea.pressSequentially('test', { delay: 30 })
    const polishBtn = page.getByRole('button', { name: '润色' })
    await expect(polishBtn).toBeEnabled({ timeout: 10000 })
    await polishBtn.click()
    await page.getByRole('button', { name: '复制结果' }).click()
    await expect(page.getByRole('button', { name: '已复制' })).toBeVisible()
  })

  test('should replace original text with AI result', async ({ page }) => {
    await mockTextStream(page, '**/api/ai/writing', '替换后的文本')
    await page.goto('/admin/writing')
    const textarea = page.locator('textarea')
    await expect(textarea).toBeVisible()
    await textarea.click()
    await textarea.pressSequentially('original text', { delay: 30 })
    const polishBtn2 = page.getByRole('button', { name: '润色' })
    await expect(polishBtn2).toBeEnabled({ timeout: 10000 })
    await polishBtn2.click()
    await expect(page.getByText('替换后的文本')).toBeVisible({ timeout: 10000 })
    await page.getByRole('button', { name: '替换原文' }).click()
    // Textarea should now contain the AI result
    await expect(page.locator('textarea')).toHaveValue('替换后的文本')
    // AI result section should be gone
    await expect(page.getByRole('button', { name: '替换原文' })).not.toBeVisible()
  })

  test('should show error on API failure', async ({ page }) => {
    await mockErrorResponse(page, '**/api/ai/writing', 500, '写作服务异常')
    await page.goto('/admin/writing')
    const textarea = page.locator('textarea')
    await expect(textarea).toBeVisible()
    await textarea.click()
    await textarea.pressSequentially('text', { delay: 50 })
    const errorPolishBtn = page.getByRole('button', { name: '润色' })
    await expect(errorPolishBtn).toBeEnabled({ timeout: 10000 })
    await errorPolishBtn.click()
    // Error message should appear
    await expect(page.locator('.text-red-600, .dark\\:text-red-400')).toBeVisible({
      timeout: 10000,
    })
  })
})
