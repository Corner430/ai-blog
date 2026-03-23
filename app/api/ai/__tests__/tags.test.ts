/**
 * @jest-environment node
 */
import { POST } from '../tags/route'

jest.mock('@/lib/hunyuan', () => ({
  isAiEnabled: jest.fn(),
  getHunyuanModel: jest.fn(() => 'mock-model'),
}))

jest.mock('ai', () => ({
  generateText: jest.fn(),
}))

import { isAiEnabled } from '@/lib/hunyuan'
import { generateText } from 'ai'

const mockIsAiEnabled = isAiEnabled as jest.Mock
const mockGenerateText = generateText as jest.Mock

function createRequest(body: Record<string, unknown>): Request {
  return new Request('http://localhost:3000/api/ai/tags', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('POST /api/ai/tags', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns 400 when content is missing', async () => {
    mockIsAiEnabled.mockReturnValue(true)
    const res = await POST(createRequest({}))
    expect(res.status).toBe(400)
  })

  it('returns 503 when AI is not enabled', async () => {
    mockIsAiEnabled.mockReturnValue(false)
    const res = await POST(createRequest({ content: 'test' }))
    expect(res.status).toBe(503)
  })

  it('returns tags array for valid content', async () => {
    mockIsAiEnabled.mockReturnValue(true)
    mockGenerateText.mockResolvedValue({
      text: '["JavaScript", "React", "Next.js"]',
    })

    const res = await POST(
      createRequest({ content: 'Article about JavaScript and React with Next.js' })
    )
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.tags).toEqual(['JavaScript', 'React', 'Next.js'])
  })
})
