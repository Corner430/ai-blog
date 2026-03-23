/**
 * @jest-environment node
 */
import { POST } from '../tags/write/route'

jest.mock('fs', () => ({
  existsSync: jest.fn(),
  readFileSync: jest.fn(),
  writeFileSync: jest.fn(),
}))

jest.mock('gray-matter', () => {
  const fn = jest.fn()
  fn.stringify = jest.fn()
  return fn
})

import fs from 'fs'
import matter from 'gray-matter'

const mockExistsSync = fs.existsSync as jest.Mock
const mockReadFileSync = fs.readFileSync as jest.Mock
const mockWriteFileSync = fs.writeFileSync as jest.Mock
const mockMatter = matter as unknown as jest.Mock
const mockStringify = (matter as unknown as { stringify: jest.Mock }).stringify

function createRequest(body: Record<string, unknown>): Request {
  return new Request('http://localhost:3000/api/admin/tags/write', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('POST /api/admin/tags/write', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('writes tags successfully and returns success', async () => {
    mockExistsSync.mockReturnValue(true)
    mockReadFileSync.mockReturnValue('---\ntitle: Test\ntags: [old]\n---\nContent')
    mockMatter.mockReturnValue({
      data: { title: 'Test', tags: ['old'] },
      content: 'Content',
    })
    mockStringify.mockReturnValue('---\ntitle: Test\ntags:\n  - new1\n  - new2\n---\nContent')

    const res = await POST(createRequest({ filename: 'test.mdx', tags: ['new1', 'new2'] }))
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.success).toBe(true)
    expect(mockWriteFileSync).toHaveBeenCalled()
  })

  it('returns 400 when filename is missing', async () => {
    const res = await POST(createRequest({ tags: ['tag1'] }))
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toBeDefined()
  })

  it('returns 400 when tags is missing', async () => {
    const res = await POST(createRequest({ filename: 'test.mdx' }))
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toBeDefined()
  })

  it('returns 400 for non-mdx filename (path traversal prevention)', async () => {
    const res = await POST(createRequest({ filename: '../etc/passwd', tags: ['tag1'] }))
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toBeDefined()
  })

  it('returns 404 when file does not exist', async () => {
    mockExistsSync.mockReturnValue(false)

    const res = await POST(createRequest({ filename: 'nonexistent.mdx', tags: ['tag1'] }))
    expect(res.status).toBe(404)
    const data = await res.json()
    expect(data.error).toBeDefined()
  })

  it('returns 500 when write fails', async () => {
    mockExistsSync.mockReturnValue(true)
    mockReadFileSync.mockReturnValue('---\ntitle: Test\ntags: []\n---\nContent')
    mockMatter.mockReturnValue({
      data: { title: 'Test', tags: [] },
      content: 'Content',
    })
    mockStringify.mockReturnValue('result')
    mockWriteFileSync.mockImplementation(() => {
      throw new Error('EACCES: permission denied')
    })

    const res = await POST(createRequest({ filename: 'test.mdx', tags: ['tag1'] }))
    expect(res.status).toBe(500)
    const data = await res.json()
    expect(data.error).toBeDefined()
  })
})
