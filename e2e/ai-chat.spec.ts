import { test, expect } from '@playwright/test'
import { mockChatStream, mockErrorResponse } from './helpers/mock-api'

test.describe('AI Chat', () => {
  test.beforeEach(async ({ page }) => {
    // Mock the summary endpoint to avoid real AI calls
    await page.route('**/api/ai/summary', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'text/plain; charset=utf-8',
        body: 'Mock summary text',
      })
    })
  })

  test('should open and close AI chat panel via toggle button', async ({ page }) => {
    await page.goto('/blog/hello-world')
    const toggle = page.getByTestId('ai-chat-toggle')
    await expect(toggle).toBeVisible()
    // Open panel
    await toggle.click()
    const panel = page.getByTestId('ai-chat-panel')
    await expect(panel).toBeVisible()
    await expect(panel.getByText('AI 问答助手')).toBeVisible()
    await expect(panel.getByText('针对这篇文章提问吧')).toBeVisible()
    // Close via toggle
    await toggle.click()
    await expect(panel).not.toBeVisible()
  })

  test('should close panel via X close button', async ({ page }) => {
    await page.goto('/blog/hello-world')
    await page.getByTestId('ai-chat-toggle').click()
    const panel = page.getByTestId('ai-chat-panel')
    await expect(panel).toBeVisible()
    // Find the close button inside the panel header
    const closeBtn = panel.locator('button').first()
    await closeBtn.click()
    await expect(panel).not.toBeVisible()
  })

  test('should send message and receive AI reply', async ({ page }) => {
    await mockChatStream(page, 'This is a mock AI response')
    await page.goto('/blog/hello-world')
    await page.getByTestId('ai-chat-toggle').click()
    const panel = page.getByTestId('ai-chat-panel')
    // Type and send message
    const input = panel.locator('input')
    await input.fill('What is this article about?')
    await panel.getByRole('button', { name: '发送' }).click()
    // User message should appear
    await expect(panel.getByText('What is this article about?')).toBeVisible()
    // AI response should appear
    await expect(panel.getByText('This is a mock AI response')).toBeVisible({ timeout: 10000 })
  })

  test('should disable send button while loading', async ({ page }) => {
    await mockChatStream(page, 'Response', 3000)
    await page.goto('/blog/hello-world')
    await page.getByTestId('ai-chat-toggle').click()
    const panel = page.getByTestId('ai-chat-panel')
    await panel.locator('input').fill('Test question')
    await panel.getByRole('button', { name: '发送' }).click()
    // Send button should be disabled during loading
    await expect(panel.getByRole('button', { name: '发送' })).toBeDisabled()
    // Loading indicator should show
    await expect(panel.getByText('...')).toBeVisible()
  })

  test('should show error and retry button on API error', async ({ page }) => {
    await page.route('**/api/ai/chat', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal error' }),
      })
    })
    await page.goto('/blog/hello-world')
    await page.getByTestId('ai-chat-toggle').click()
    const panel = page.getByTestId('ai-chat-panel')
    await panel.locator('input').fill('Test question')
    await panel.getByRole('button', { name: '发送' }).click()
    // Error message should appear
    await expect(panel.getByText('服务异常，请重试')).toBeVisible({ timeout: 10000 })
    await expect(panel.getByRole('button', { name: '重试' })).toBeVisible()
  })
})
