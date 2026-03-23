/**
 * @jest-environment jsdom
 */
import React from 'react'
import { render, screen, fireEvent, act, cleanup } from '@testing-library/react'
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

// Helper: advance one poll cycle (advance timer + flush async)
async function advanceOnePoll() {
  await act(async () => {
    jest.advanceTimersByTime(3000)
  })
  // Flush microtask queue for async fetch in poll callback
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

  it('renders title input, summary input, and generate button', () => {
    render(<CoverPage />)
    expect(screen.getByPlaceholderText(/文章标题/)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/文章摘要/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /生成封面/ })).toBeInTheDocument()
  })

  it('disables generate button when title is empty', () => {
    render(<CoverPage />)
    const btn = screen.getByRole('button', { name: /生成封面/ })
    expect(btn).toBeDisabled()
  })

  it('enables generate button when title is filled', () => {
    render(<CoverPage />)
    const input = screen.getByPlaceholderText(/文章标题/)
    fireEvent.change(input, { target: { value: 'Test Title' } })
    const btn = screen.getByRole('button', { name: /生成封面/ })
    expect(btn).not.toBeDisabled()
  })

  it('shows loading state after clicking generate', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ jobId: 'job-123' }),
    })

    render(<CoverPage />)
    fireEvent.change(screen.getByPlaceholderText(/文章标题/), { target: { value: 'Test Title' } })

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /生成封面/ }))
    })

    expect(screen.getByText(/生成中/)).toBeInTheDocument()
  })

  it('shows image preview after polling completes', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ jobId: 'job-123' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ status: 'done', imageUrl: 'https://example.com/img.png' }),
      })

    render(<CoverPage />)
    fireEvent.change(screen.getByPlaceholderText(/文章标题/), { target: { value: 'Test' } })

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /生成封面/ }))
    })

    await advanceOnePoll()

    expect(screen.getByRole('img')).toHaveAttribute('src', 'https://example.com/img.png')
  })

  it('shows download and copy URL buttons after generation completes', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ jobId: 'job-123' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ status: 'done', imageUrl: 'https://example.com/img.png' }),
      })

    render(<CoverPage />)
    fireEvent.change(screen.getByPlaceholderText(/文章标题/), { target: { value: 'Test' } })

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /生成封面/ }))
    })

    await advanceOnePoll()

    expect(screen.getByRole('button', { name: /下载图片/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /复制 URL/ })).toBeInTheDocument()
  })

  it('copies URL to clipboard when copy button is clicked', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ jobId: 'job-123' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ status: 'done', imageUrl: 'https://example.com/img.png' }),
      })

    render(<CoverPage />)
    fireEvent.change(screen.getByPlaceholderText(/文章标题/), { target: { value: 'Test' } })

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
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ jobId: 'job-123' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ status: 'failed', error: 'Generation failed' }),
      })

    render(<CoverPage />)
    fireEvent.change(screen.getByPlaceholderText(/文章标题/), { target: { value: 'Test' } })

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /生成封面/ }))
    })

    await advanceOnePoll()

    expect(screen.getByText(/Generation failed/)).toBeInTheDocument()
  })

  it('shows timeout message after max polls', async () => {
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

    render(<CoverPage />)
    fireEvent.change(screen.getByPlaceholderText(/文章标题/), { target: { value: 'Test' } })

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /生成封面/ }))
    })

    for (let i = 0; i < 65; i++) {
      await advanceOnePoll()
    }

    expect(screen.getByText(/超时/)).toBeInTheDocument()
  }, 15000)
})
