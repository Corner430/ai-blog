/**
 * @jest-environment node
 */

jest.mock('@/lib/hunyuan', () => ({
  isAiEnabled: jest.fn(),
  getHunyuanClient: jest.fn(),
}))

jest.mock('@/lib/embeddings', () => ({
  searchByEmbedding: jest.fn(),
}))

jest.mock('fs', () => ({
  readFileSync: jest.fn(() => JSON.stringify({ articles: [] })),
}))

import { POST } from '../search/route'
import { isAiEnabled, getHunyuanClient } from '@/lib/hunyuan'
import { searchByEmbedding } from '@/lib/embeddings'

const mockIsAiEnabled = isAiEnabled as jest.Mock
const mockGetHunyuanClient = getHunyuanClient as jest.Mock
const mockSearchByEmbedding = searchByEmbedding as jest.Mock

function createRequest(body: Record<string, unknown>): Request {
  return new Request('http://localhost:3000/api/ai/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('POST /api/ai/search', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns 400 when query is empty', async () => {
    mockIsAiEnabled.mockReturnValue(true)
    const res = await POST(createRequest({ query: '' }))
    expect(res.status).toBe(400)
  })

  it('returns 503 when AI is not enabled', async () => {
    mockIsAiEnabled.mockReturnValue(false)
    const res = await POST(createRequest({ query: 'test' }))
    expect(res.status).toBe(503)
  })

  it('returns results sorted by score descending', async () => {
    mockIsAiEnabled.mockReturnValue(true)
    mockGetHunyuanClient.mockReturnValue({
      embeddings: {
        create: jest.fn().mockResolvedValue({
          data: [{ embedding: [0.1, 0.2, 0.3] }],
        }),
      },
    })
    mockSearchByEmbedding.mockReturnValue([
      { slug: 'a', title: 'A', summary: 'Sum A', score: 0.9 },
      { slug: 'b', title: 'B', summary: 'Sum B', score: 0.7 },
    ])

    const res = await POST(createRequest({ query: 'test query' }))
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.results).toHaveLength(2)
    expect(data.results[0].score).toBeGreaterThan(data.results[1].score)
  })

  it('returns empty results for unrelated query', async () => {
    mockIsAiEnabled.mockReturnValue(true)
    mockGetHunyuanClient.mockReturnValue({
      embeddings: {
        create: jest.fn().mockResolvedValue({
          data: [{ embedding: [0.1, 0.2, 0.3] }],
        }),
      },
    })
    mockSearchByEmbedding.mockReturnValue([])

    const res = await POST(createRequest({ query: 'completely unrelated' }))
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.results).toHaveLength(0)
  })
})
