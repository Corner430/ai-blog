/**
 * @jest-environment jsdom
 */
import React from 'react'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import '@testing-library/jest-dom'
import AiSearch from '../AiSearch'

global.fetch = jest.fn()

describe('AiSearch', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Default: resolve search.json with empty array (for fallback loading)
    ;(global.fetch as jest.Mock).mockImplementation((url: string) => {
      if (url === '/search.json') {
        return Promise.resolve({
          ok: true,
          json: async () => [],
        })
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({ results: [] }),
      })
    })
  })

  it('renders search modal when open', async () => {
    await act(async () => {
      render(<AiSearch isOpen={true} onClose={jest.fn()} />)
    })
    expect(screen.getByTestId('ai-search-modal')).toBeInTheDocument()
  })

  it('does not render when closed', async () => {
    await act(async () => {
      render(<AiSearch isOpen={false} onClose={jest.fn()} />)
    })
    expect(screen.queryByTestId('ai-search-modal')).not.toBeInTheDocument()
  })

  it('shows empty state when no results', async () => {
    await act(async () => {
      render(<AiSearch isOpen={true} onClose={jest.fn()} />)
    })
    const input = screen.getByPlaceholderText(/搜索/)

    await act(async () => {
      fireEvent.change(input, { target: { value: 'some query' } })
    })

    // Submit the form
    const form = input.closest('form')!
    await act(async () => {
      fireEvent.submit(form)
    })

    await waitFor(() => {
      expect(screen.getByText(/未找到/)).toBeInTheDocument()
    })
  })
})
