/**
 * @jest-environment jsdom
 */
import React from 'react'
import { render, screen, fireEvent, act, waitFor, cleanup } from '@testing-library/react'
import '@testing-library/jest-dom'
import TagsPage from '../tags/page'

const mockFetch = jest.fn()
global.fetch = mockFetch

describe('Auto-tagging Admin Page', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  afterEach(() => {
    cleanup()
  })

  it('fetches and displays article list on mount', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          articles: [
            { filename: 'hello.mdx', title: 'Hello World', tags: ['blog'], content: 'Content' },
            { filename: 'react.mdx', title: 'React Guide', tags: ['react'], content: 'React content' },
          ],
        }),
    })

    await act(async () => {
      render(<TagsPage />)
    })

    expect(screen.getByText('Hello World')).toBeInTheDocument()
    expect(screen.getByText('React Guide')).toBeInTheDocument()
    expect(mockFetch).toHaveBeenCalledWith('/api/admin/articles')
  })

  it('shows existing tags and generate button for each article', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          articles: [
            { filename: 'hello.mdx', title: 'Hello World', tags: ['blog', 'intro'], content: 'Content' },
          ],
        }),
    })

    await act(async () => {
      render(<TagsPage />)
    })

    expect(screen.getByText('hello.mdx')).toBeInTheDocument()
    expect(screen.getByText(/blog/)).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: /生成标签/ })).toHaveLength(1)
  })

  it('shows empty state when no articles exist', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ articles: [] }),
    })

    await act(async () => {
      render(<TagsPage />)
    })

    expect(screen.getByText(/暂无文章/)).toBeInTheDocument()
  })

  it('generates tag suggestions when clicking generate button', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            articles: [
              { filename: 'hello.mdx', title: 'Hello', tags: [], content: 'JS content' },
            ],
          }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ tags: ['JavaScript', 'React', 'Next.js'] }),
      })

    await act(async () => {
      render(<TagsPage />)
    })

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /生成标签/ }))
    })

    await waitFor(() => {
      expect(screen.getByText('JavaScript')).toBeInTheDocument()
      expect(screen.getByText('React')).toBeInTheDocument()
      expect(screen.getByText('Next.js')).toBeInTheDocument()
    })
  })

  it('allows toggling tag selection', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            articles: [
              { filename: 'hello.mdx', title: 'Hello', tags: [], content: 'Content' },
            ],
          }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ tags: ['Tag1', 'Tag2'] }),
      })

    await act(async () => {
      render(<TagsPage />)
    })

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /生成标签/ }))
    })

    await waitFor(() => {
      expect(screen.getByText('Tag1')).toBeInTheDocument()
    })

    // Tags should be checkboxes, toggle one off
    const checkboxes = screen.getAllByRole('checkbox')
    expect(checkboxes).toHaveLength(2)
    expect(checkboxes[0]).toBeChecked()

    fireEvent.click(checkboxes[0])
    expect(checkboxes[0]).not.toBeChecked()
  })

  it('writes selected tags to frontmatter', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            articles: [
              { filename: 'hello.mdx', title: 'Hello', tags: [], content: 'Content' },
            ],
          }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ tags: ['Tag1', 'Tag2'] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      })

    await act(async () => {
      render(<TagsPage />)
    })

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /生成标签/ }))
    })

    await waitFor(() => {
      expect(screen.getByText('Tag1')).toBeInTheDocument()
    })

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /写入 frontmatter/ }))
    })

    await waitFor(() => {
      expect(screen.getByText(/标签已写入|成功/)).toBeInTheDocument()
    })

    // Verify the write call
    expect(mockFetch).toHaveBeenCalledWith('/api/admin/tags/write', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filename: 'hello.mdx', tags: ['Tag1', 'Tag2'] }),
    })
  })

  it('shows error when tag generation fails', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            articles: [
              { filename: 'hello.mdx', title: 'Hello', tags: [], content: 'Content' },
            ],
          }),
      })
      .mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: 'AI service error' }),
      })

    await act(async () => {
      render(<TagsPage />)
    })

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /生成标签/ }))
    })

    await waitFor(() => {
      expect(screen.getByText(/错误|error/i)).toBeInTheDocument()
    })
  })
})
