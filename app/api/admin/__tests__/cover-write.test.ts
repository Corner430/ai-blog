/**
 * @jest-environment node
 */
import { POST } from '../cover/write/route'

// Mock gray-matter
jest.mock('gray-matter', () => {
  const fn = jest.fn() as jest.Mock & { stringify: jest.Mock }
  fn.stringify = jest.fn()
  return fn
})

import matter from 'gray-matter'

const mockMatter = matter as unknown as jest.Mock
const mockStringify = (matter as unknown as { stringify: jest.Mock }).stringify

// Mock global fetch for GitHub API calls
const mockFetch = jest.fn()
global.fetch = mockFetch

function createRequest(body: Record<string, unknown>): Request {
  return new Request('http://localhost:3000/api/admin/cover/write', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('POST /api/admin/cover/write', () => {
  const originalEnv = process.env

  beforeEach(() => {
    jest.clearAllMocks()
    process.env = { ...originalEnv, GITHUB_TOKEN: 'ghp_test_token' }
  })

  afterAll(() => {
    process.env = originalEnv
  })

  it('commits updated images field via GitHub API and returns success', async () => {
    const fileContent = '---\ntitle: Test\ntags:\n  - blog\n---\nContent'
    const base64Content = Buffer.from(fileContent).toString('base64')

    // Mock GET (fetch current file)
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ content: base64Content, sha: 'abc123' }),
    })

    mockMatter.mockReturnValue({
      data: { title: 'Test', tags: ['blog'] },
      content: 'Content',
    })
    mockStringify.mockReturnValue(
      '---\ntitle: Test\nimages:\n  - https://example.com/img.jpg\n---\nContent'
    )

    // Mock PUT (commit file)
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ content: { sha: 'def456' } }),
    })

    const res = await POST(
      createRequest({ filename: 'test.mdx', imageUrl: 'https://example.com/img.jpg' })
    )
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.success).toBe(true)

    // Verify GET call
    expect(mockFetch).toHaveBeenCalledTimes(2)
    expect(mockFetch.mock.calls[0][0]).toContain('api.github.com')
    expect(mockFetch.mock.calls[0][0]).toContain('data/blog/test.mdx')

    // Verify PUT call
    expect(mockFetch.mock.calls[1][1].method).toBe('PUT')
    const putBody = JSON.parse(mockFetch.mock.calls[1][1].body)
    expect(putBody.sha).toBe('abc123')
    expect(putBody.message).toContain('test.mdx')
  })

  it('returns 400 when filename is missing', async () => {
    const res = await POST(createRequest({ imageUrl: 'https://example.com/img.jpg' }))
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toBeDefined()
  })

  it('returns 400 when imageUrl is missing', async () => {
    const res = await POST(createRequest({ filename: 'test.mdx' }))
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toBeDefined()
  })

  it('returns 400 for non-mdx filename', async () => {
    const res = await POST(
      createRequest({ filename: '../etc/passwd', imageUrl: 'https://example.com/img.jpg' })
    )
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toBeDefined()
  })

  it('returns 404 when file does not exist on GitHub', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      text: async () => 'Not Found',
    })

    const res = await POST(
      createRequest({ filename: 'nonexistent.mdx', imageUrl: 'https://example.com/img.jpg' })
    )
    expect(res.status).toBe(404)
    const data = await res.json()
    expect(data.error).toBeDefined()
  })

  it('returns 500 when GITHUB_TOKEN is not configured', async () => {
    delete process.env.GITHUB_TOKEN

    const res = await POST(
      createRequest({ filename: 'test.mdx', imageUrl: 'https://example.com/img.jpg' })
    )
    expect(res.status).toBe(500)
    const data = await res.json()
    expect(data.error).toContain('GITHUB_TOKEN')
  })

  it('returns 500 when GitHub commit fails', async () => {
    const fileContent = '---\ntitle: Test\n---\nContent'
    const base64Content = Buffer.from(fileContent).toString('base64')

    // Mock GET success
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ content: base64Content, sha: 'abc123' }),
    })

    mockMatter.mockReturnValue({
      data: { title: 'Test' },
      content: 'Content',
    })
    mockStringify.mockReturnValue('result')

    // Mock PUT failure
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 409,
      text: async () => 'Conflict',
    })

    const res = await POST(
      createRequest({ filename: 'test.mdx', imageUrl: 'https://example.com/img.jpg' })
    )
    expect(res.status).toBe(500)
    const data = await res.json()
    expect(data.error).toBeDefined()
  })
})
