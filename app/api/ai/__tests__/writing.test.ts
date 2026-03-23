/**
 * @jest-environment node
 */
import { POST } from '../writing/route'

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
  return new Request('http://localhost:3000/api/ai/writing', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('POST /api/ai/writing', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns 400 when content is missing', async () => {
    mockIsAiEnabled.mockReturnValue(true)
    const res = await POST(createRequest({ action: 'polish' }))
    expect(res.status).toBe(400)
  })

  it('returns 400 when action is invalid', async () => {
    mockIsAiEnabled.mockReturnValue(true)
    const res = await POST(createRequest({ content: 'test', action: 'invalid' }))
    expect(res.status).toBe(400)
  })

  it('returns 503 when AI is not enabled', async () => {
    mockIsAiEnabled.mockReturnValue(false)
    const res = await POST(createRequest({ content: 'test', action: 'polish' }))
    expect(res.status).toBe(503)
  })

  it('returns streaming response for polish action', async () => {
    mockIsAiEnabled.mockReturnValue(true)
    const mockResponse = new Response('mock stream')
    mockStreamText.mockReturnValue({
      toDataStreamResponse: () => mockResponse,
    })

    const res = await POST(createRequest({ content: 'test content', action: 'polish' }))
    expect(res).toBe(mockResponse)
    expect(mockStreamText).toHaveBeenCalledTimes(1)
  })

  it('returns streaming response for continue action', async () => {
    mockIsAiEnabled.mockReturnValue(true)
    const mockResponse = new Response('mock stream')
    mockStreamText.mockReturnValue({
      toDataStreamResponse: () => mockResponse,
    })

    const res = await POST(createRequest({ content: 'test content', action: 'continue' }))
    expect(res).toBe(mockResponse)
    expect(mockStreamText).toHaveBeenCalledTimes(1)
  })
})
