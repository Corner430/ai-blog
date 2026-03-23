import { Page } from '@playwright/test'

/**
 * Mock AI Chat streaming response (AI SDK UI Message Stream Protocol).
 * The useChat hook expects responses in the AI SDK data stream format.
 * For `toUIMessageStreamResponse()`, the format uses specific prefixed lines.
 */
export async function mockChatStream(page: Page, responseText: string) {
  await page.route('**/api/ai/chat', async (route) => {
    // AI SDK UI Message Stream format:
    // First: message start with id and role
    // Then: text parts
    // Finally: message end with finish reason
    const messageId = 'mock-msg-id'
    const body = [
      `f:{"messageId":"${messageId}"}`,
      `0:${JSON.stringify(responseText)}`,
      `e:{"finishReason":"stop","usage":{"promptTokens":10,"completionTokens":20},"isContinued":false}`,
      `d:{"finishReason":"stop","usage":{"promptTokens":10,"completionTokens":20}}`,
    ].join('\n')

    await route.fulfill({
      status: 200,
      contentType: 'text/plain; charset=utf-8',
      body,
    })
  })
}

/**
 * Mock a text streaming endpoint (used by useCompletion with streamProtocol: 'text').
 * Returns plain text response.
 */
export async function mockTextStream(page: Page, url: string, responseText: string) {
  await page.route(url, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'text/plain; charset=utf-8',
      body: responseText,
    })
  })
}

/**
 * Mock a JSON response for the given URL.
 */
export async function mockJsonResponse(
  page: Page,
  url: string,
  data: unknown,
  status: number = 200
) {
  await page.route(url, async (route) => {
    await route.fulfill({
      status,
      contentType: 'application/json',
      body: JSON.stringify(data),
    })
  })
}

/**
 * Mock an error response for the given URL.
 */
export async function mockErrorResponse(
  page: Page,
  url: string,
  status: number,
  error: string
) {
  await page.route(url, async (route) => {
    await route.fulfill({
      status,
      contentType: 'application/json',
      body: JSON.stringify({ error }),
    })
  })
}

/**
 * Mock /api/admin/articles endpoint.
 */
export async function mockAdminArticles(
  page: Page,
  articles: Array<{ filename: string; title: string; tags: string[]; content: string }>
) {
  await page.route('**/api/admin/articles', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ articles }),
    })
  })
}

/**
 * Mock /api/ai/cover/submit endpoint.
 */
export async function mockCoverSubmit(page: Page, jobId: string) {
  await page.route('**/api/ai/cover/submit', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ jobId }),
    })
  })
}

/**
 * Mock /api/ai/cover/query endpoint.
 */
export async function mockCoverQuery(
  page: Page,
  status: 'done' | 'pending' | 'failed',
  imageUrl?: string
) {
  await page.route('**/api/ai/cover/query*', async (route) => {
    const body: Record<string, string> = { status }
    if (status === 'done' && imageUrl) {
      body.imageUrl = imageUrl
    }
    if (status === 'failed') {
      body.error = '生成失败'
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(body),
    })
  })
}
