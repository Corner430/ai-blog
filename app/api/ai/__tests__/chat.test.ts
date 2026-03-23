/**
 * @jest-environment node
 */
import { POST } from '../chat/route'

jest.mock('@/lib/hunyuan', () => ({
  isAiEnabled: jest.fn(),
  getHunyuanProvider: jest.fn(() => jest.fn(() => 'mock-model')),
  HUNYUAN_MODEL: 'hunyuan-turbos-latest',
}))

jest.mock('ai', () => ({
  streamText: jest.fn(),
}))

import { isAiEnabled } from '@/lib/hunyuan'
import { streamText } from 'ai'

const mockIsAiEnabled = isAiEnabled as jest.Mock
const mockStreamText = streamText as jest.Mock

function createRequest(body: Record<string, unknown>): Request {
  return new Request('http://localhost:3000/api/ai/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('POST /api/ai/chat', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns 400 when messages is missing', async () => {
    mockIsAiEnabled.mockReturnValue(true)
    const res = await POST(createRequest({ articleContent: 'test' }))
    expect(res.status).toBe(400)
  })

  it('returns 400 when articleContent is missing', async () => {
    mockIsAiEnabled.mockReturnValue(true)
    const res = await POST(createRequest({ messages: [{ role: 'user', content: 'hi' }] }))
    expect(res.status).toBe(400)
  })

  it('returns 503 when AI is not enabled', async () => {
    mockIsAiEnabled.mockReturnValue(false)
    const res = await POST(
      createRequest({
        messages: [{ role: 'user', content: 'hi' }],
        articleContent: 'test',
      })
    )
    expect(res.status).toBe(503)
  })

  it('returns streaming response for valid chat request', async () => {
    mockIsAiEnabled.mockReturnValue(true)
    const mockResponse = new Response('mock stream')
    mockStreamText.mockReturnValue({
      toDataStreamResponse: () => mockResponse,
    })

    const res = await POST(
      createRequest({
        messages: [{ role: 'user', content: 'What is this article about?' }],
        articleContent: 'This is a test article about AI.',
      })
    )
    expect(res).toBe(mockResponse)
    expect(mockStreamText).toHaveBeenCalledTimes(1)
  })
})
