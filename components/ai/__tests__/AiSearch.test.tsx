/**
 * @jest-environment jsdom
 */
import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import AiSearch from '../AiSearch'

global.fetch = jest.fn()

describe('AiSearch', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders search modal when open', () => {
    render(<AiSearch isOpen={true} onClose={jest.fn()} />)
    expect(screen.getByTestId('ai-search-modal')).toBeInTheDocument()
  })

  it('does not render when closed', () => {
    render(<AiSearch isOpen={false} onClose={jest.fn()} />)
    expect(screen.queryByTestId('ai-search-modal')).not.toBeInTheDocument()
  })

  it('shows empty state when no results', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ results: [] }),
    })

    render(<AiSearch isOpen={true} onClose={jest.fn()} />)
    const input = screen.getByPlaceholderText(/搜索/)
    fireEvent.change(input, { target: { value: 'some query' } })

    // Submit the form
    const form = input.closest('form')!
    fireEvent.submit(form)

    await waitFor(() => {
      expect(screen.getByText(/未找到/)).toBeInTheDocument()
    })
  })
})
