/**
 * @jest-environment node
 */
import { GET } from '../articles/route'

jest.mock('fs', () => ({
  readdirSync: jest.fn(),
  readFileSync: jest.fn(),
}))

jest.mock('gray-matter', () => {
  const fn = jest.fn()
  return fn
})

import fs from 'fs'
import matter from 'gray-matter'

const mockReaddirSync = fs.readdirSync as jest.Mock
const mockReadFileSync = fs.readFileSync as jest.Mock
const mockMatter = matter as unknown as jest.Mock

describe('GET /api/admin/articles', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns article list with filename, title, tags, and content', async () => {
    mockReaddirSync.mockReturnValue(['hello-world.mdx', 'second-post.mdx'])
    mockReadFileSync
      .mockReturnValueOnce('---\ntitle: Hello World\ntags: [blog]\n---\nContent 1')
      .mockReturnValueOnce('---\ntitle: Second Post\ntags: [react, next]\n---\nContent 2')
    mockMatter
      .mockReturnValueOnce({
        data: { title: 'Hello World', tags: ['blog'] },
        content: 'Content 1',
      })
      .mockReturnValueOnce({
        data: { title: 'Second Post', tags: ['react', 'next'] },
        content: 'Content 2',
      })

    const res = await GET()
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.articles).toHaveLength(2)
    expect(data.articles[0]).toEqual({
      filename: 'hello-world.mdx',
      title: 'Hello World',
      summary: '',
      tags: ['blog'],
      content: 'Content 1',
    })
    expect(data.articles[1]).toEqual({
      filename: 'second-post.mdx',
      title: 'Second Post',
      summary: '',
      tags: ['react', 'next'],
      content: 'Content 2',
    })
  })

  it('returns empty array when no MDX files exist', async () => {
    mockReaddirSync.mockReturnValue([])

    const res = await GET()
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.articles).toEqual([])
  })

  it('filters non-mdx files', async () => {
    mockReaddirSync.mockReturnValue(['hello.mdx', 'readme.md', 'notes.txt'])
    mockReadFileSync.mockReturnValue('---\ntitle: Hello\ntags: []\n---\nContent')
    mockMatter.mockReturnValue({
      data: { title: 'Hello', tags: [] },
      content: 'Content',
    })

    const res = await GET()
    const data = await res.json()
    expect(data.articles).toHaveLength(1)
    expect(data.articles[0].filename).toBe('hello.mdx')
  })

  it('returns 500 when file reading fails', async () => {
    mockReaddirSync.mockImplementation(() => {
      throw new Error('ENOENT: no such file or directory')
    })

    const res = await GET()
    expect(res.status).toBe(500)
    const data = await res.json()
    expect(data.error).toBeDefined()
  })
})
