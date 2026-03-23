/**
 * @jest-environment node
 */
import { POST } from '../summary/route'

// Mock the hunyuan module
jest.mock('@/lib/hunyuan', () => ({
  isAiEnabled: jest.fn(),
  getHunyuanProvider: jest.fn(() => jest.fn(() => 'mock-model')),
  HUNYUAN_MODEL: 'hunyuan-turbos-latest',
}))

// Mock the ai module
jest.mock('ai', () => ({
  streamText: jest.fn(),
}))

import { isAiEnabled } from '@/lib/hunyuan'
import { streamText } from 'ai'

const mockIsAiEnabled = isAiEnabled as jest.Mock
const mockStreamText = streamText as jest.Mock

function createRequest(body: Record<string, unknown>): Request {
  return new Request('http://localhost:3000/api/ai/summary', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('POST /api/ai/summary', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns 400 when content is missing', async () => {
    mockIsAiEnabled.mockReturnValue(true)
    const res = await POST(createRequest({ slug: 'test' }))
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toBeDefined()
  })

  it('returns 503 when AI is not enabled', async () => {
    mockIsAiEnabled.mockReturnValue(false)
    const res = await POST(createRequest({ content: 'test', slug: 'test' }))
    expect(res.status).toBe(503)
    const data = await res.json()
    expect(data.error).toBeDefined()
  })

  it('returns streaming response for valid request', async () => {
    mockIsAiEnabled.mockReturnValue(true)
    const mockResponse = new Response('mock stream')
    mockStreamText.mockReturnValue({
      toDataStreamResponse: () => mockResponse,
    })

    const res = await POST(createRequest({ content: 'Hello world article content', slug: 'test-article' }))
    expect(res).toBe(mockResponse)
    expect(mockStreamText).toHaveBeenCalledTimes(1)
  })
})
