/**
 * @jest-environment jsdom
 */
import React from 'react'
import { render, screen, fireEvent, act, cleanup, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import CoverPage from '../cover/page'

// Mock global fetch
const mockFetch = jest.fn()
global.fetch = mockFetch

// Mock URL.createObjectURL and URL.revokeObjectURL
global.URL.createObjectURL = jest.fn(() => 'blob:http://localhost/fake-blob-url')
global.URL.revokeObjectURL = jest.fn()

// Mock clipboard
Object.assign(navigator, {
  clipboard: { writeText: jest.fn().mockResolvedValue(undefined) },
})

const mockArticles = [
  {
    filename: 'post-1.mdx',
    title: 'First Post',
    summary: 'Summary of first post',
    tags: [],
    content: '',
  },
  {
    filename: 'post-2.mdx',
    title: 'Second Post',
    summary: '',
    tags: [],
    content: '',
  },
]

// Helper: render with articles loaded
async function renderWithArticles() {
  mockFetch.mockResolvedValueOnce({
    ok: true,
    json: () => Promise.resolve({ articles: mockArticles }),
  })
  render(<CoverPage />)
  await waitFor(() => {
    expect(screen.getByRole('combobox')).toBeInTheDocument()
  })
}

// Helper: select an article from the dropdown
function selectArticle(filename: string) {
  fireEvent.change(screen.getByRole('combobox'), { target: { value: filename } })
}

// Helper: advance one poll cycle (advance timer + flush async)
async function advanceOnePoll() {
  await act(async () => {
    jest.advanceTimersByTime(3000)
  })
  for (let i = 0; i < 5; i++) {
    await act(async () => {
      await Promise.resolve()
    })
  }
}

describe('Cover Image Generation Page', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()
  })

  afterEach(() => {
    cleanup()
    jest.runOnlyPendingTimers()
    jest.useRealTimers()
  })

  it('renders article selector, summary input, and generate button', async () => {
    await renderWithArticles()
    expect(screen.getByRole('combobox')).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/选择文章后自动填充/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /生成封面/ })).toBeInTheDocument()
  })

  it('disables generate button when no article is selected', async () => {
    await renderWithArticles()
    const btn = screen.getByRole('button', { name: /生成封面/ })
    expect(btn).toBeDisabled()
  })

  it('enables generate button when an article is selected', async () => {
    await renderWithArticles()
    selectArticle('post-1.mdx')
    const btn = screen.getByRole('button', { name: /生成封面/ })
    expect(btn).not.toBeDisabled()
  })

  it('auto-fills summary when selecting an article', async () => {
    await renderWithArticles()
    selectArticle('post-1.mdx')
    const textarea = screen.getByPlaceholderText(/选择文章后自动填充/) as HTMLTextAreaElement
    expect(textarea.value).toBe('Summary of first post')
  })

  it('shows loading state after clicking generate', async () => {
    await renderWithArticles()
    selectArticle('post-1.mdx')

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ jobId: 'job-123' }),
    })

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /生成封面/ }))
    })

    expect(screen.getByText(/生成中/)).toBeInTheDocument()
  })

  it('shows image preview after polling completes', async () => {
    await renderWithArticles()
    selectArticle('post-1.mdx')

    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ jobId: 'job-123' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ status: 'done', imageUrl: 'https://example.com/img.png' }),
      })

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /生成封面/ }))
    })

    await advanceOnePoll()

    expect(screen.getByRole('img')).toHaveAttribute('src', 'https://example.com/img.png')
  })

  it('shows download and copy URL buttons after generation completes', async () => {
    await renderWithArticles()
    selectArticle('post-1.mdx')

    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ jobId: 'job-123' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ status: 'done', imageUrl: 'https://example.com/img.png' }),
      })

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /生成封面/ }))
    })

    await advanceOnePoll()

    expect(screen.getByRole('button', { name: /下载图片/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /复制 URL/ })).toBeInTheDocument()
  })

  it('copies URL to clipboard when copy button is clicked', async () => {
    await renderWithArticles()
    selectArticle('post-1.mdx')

    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ jobId: 'job-123' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ status: 'done', imageUrl: 'https://example.com/img.png' }),
      })

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /生成封面/ }))
    })

    await advanceOnePoll()

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /复制 URL/ }))
    })

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('https://example.com/img.png')
  })

  it('shows error when query returns failed status', async () => {
    await renderWithArticles()
    selectArticle('post-1.mdx')

    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ jobId: 'job-123' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ status: 'failed', error: 'Generation failed' }),
      })

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /生成封面/ }))
    })

    await advanceOnePoll()

    expect(screen.getByText(/Generation failed/)).toBeInTheDocument()
  })

  it('shows timeout message after max polls', async () => {
    await renderWithArticles()
    selectArticle('post-1.mdx')

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ jobId: 'job-123' }),
    })

    for (let i = 0; i < 65; i++) {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ status: 'pending' }),
      })
    }

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /生成封面/ }))
    })

    for (let i = 0; i < 65; i++) {
      await advanceOnePoll()
    }

    expect(screen.getByText(/超时/)).toBeInTheDocument()
  }, 15000)
})
