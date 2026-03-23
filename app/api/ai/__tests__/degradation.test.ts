/**
 * @jest-environment node
 */

// Test graceful degradation when API keys are not configured

jest.mock('@/lib/hunyuan', () => ({
  isAiEnabled: jest.fn(() => false),
  getHunyuanClient: jest.fn(),
  getHunyuanProvider: jest.fn(() => jest.fn(() => 'mock-model')),
  HUNYUAN_MODEL: 'hunyuan-turbos-latest',
}))

jest.mock('@/lib/hunyuan-image', () => ({
  isImageAiEnabled: jest.fn(() => false),
  submitImageJob: jest.fn(),
  queryImageJob: jest.fn(),
}))

jest.mock('ai', () => ({
  streamText: jest.fn(),
  generateText: jest.fn(),
}))

jest.mock('fs', () => ({
  readFileSync: jest.fn(() => JSON.stringify({ articles: [] })),
}))

import { POST as summaryPOST } from '../summary/route'
import { POST as chatPOST } from '../chat/route'
import { POST as searchPOST } from '../search/route'
import { POST as tagsPOST } from '../tags/route'
import { POST as writingPOST } from '../writing/route'
import { POST as coverSubmitPOST } from '../cover/submit/route'
import { GET as coverQueryGET } from '../cover/query/route'

function createPostRequest(url: string, body: Record<string, unknown>): Request {
  return new Request(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('Graceful degradation - all AI routes return 503 when key is not set', () => {
  it('summary returns 503', async () => {
    const res = await summaryPOST(
      createPostRequest('http://localhost/api/ai/summary', { content: 'test', slug: 'test' })
    )
    expect(res.status).toBe(503)
    const data = await res.json()
    expect(data.error).toBeDefined()
  })

  it('chat returns 503', async () => {
    const res = await chatPOST(
      createPostRequest('http://localhost/api/ai/chat', {
        messages: [{ role: 'user', content: 'hi' }],
        articleContent: 'test',
      })
    )
    expect(res.status).toBe(503)
  })

  it('search returns 503', async () => {
    const res = await searchPOST(
      createPostRequest('http://localhost/api/ai/search', { query: 'test' })
    )
    expect(res.status).toBe(503)
  })

  it('tags returns 503', async () => {
    const res = await tagsPOST(
      createPostRequest('http://localhost/api/ai/tags', { content: 'test' })
    )
    expect(res.status).toBe(503)
  })

  it('writing returns 503', async () => {
    const res = await writingPOST(
      createPostRequest('http://localhost/api/ai/writing', { content: 'test', action: 'polish' })
    )
    expect(res.status).toBe(503)
  })

  it('cover submit returns 503', async () => {
    const res = await coverSubmitPOST(
      createPostRequest('http://localhost/api/ai/cover/submit', { title: 'test', summary: 'test' })
    )
    expect(res.status).toBe(503)
  })

  it('cover query returns 503', async () => {
    const req = new Request('http://localhost/api/ai/cover/query?jobId=test')
    const res = await coverQueryGET(req)
    expect(res.status).toBe(503)
  })
})
