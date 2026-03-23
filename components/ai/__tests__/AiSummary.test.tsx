/**
 * @jest-environment jsdom
 */
import React from 'react'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import AiSummary from '../AiSummary'

// Mock fetch
global.fetch = jest.fn()

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value
    }),
    clear: jest.fn(() => {
      store = {}
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key]
    }),
  }
})()
Object.defineProperty(window, 'localStorage', { value: localStorageMock })

describe('AiSummary', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    localStorageMock.clear()
  })

  it('renders summary container', () => {
    render(<AiSummary slug="test" content="Test article content" />)
    expect(screen.getByTestId('ai-summary')).toBeInTheDocument()
  })

  it('shows cached summary when available', () => {
    // Pre-populate localStorage with a cached summary
    // We need to match the hash key format used by the component
    localStorageMock.getItem.mockImplementation((key: string) => {
      if (key.startsWith('ai-summary-test-')) {
        return 'This is a cached summary'
      }
      return null
    })

    render(<AiSummary slug="test" content="Test article content" />)
    expect(screen.getByText('This is a cached summary')).toBeInTheDocument()
  })

  it('shows loading state during streaming', () => {
    localStorageMock.getItem.mockReturnValue(null)
    ;(global.fetch as jest.Mock).mockReturnValue(new Promise(() => {})) // Never resolves

    render(<AiSummary slug="test" content="Test article content" />)
    expect(screen.getByTestId('ai-summary-loading')).toBeInTheDocument()
  })
})
