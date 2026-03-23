/**
 * @jest-environment jsdom
 */
import React from 'react'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'

// Mock @ai-sdk/react before importing the component
const mockComplete = jest.fn()
const mockUseCompletion = jest.fn(() => ({
  completion: '',
  complete: mockComplete,
  isLoading: false,
  error: undefined,
}))

jest.mock('@ai-sdk/react', () => ({
  useCompletion: (...args: unknown[]) => mockUseCompletion(...args),
}))

import AiSummary from '../AiSummary'

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
    mockUseCompletion.mockReturnValue({
      completion: '',
      complete: mockComplete,
      isLoading: false,
      error: undefined,
    })
  })

  it('renders summary container', () => {
    render(<AiSummary slug="test" content="Test article content" />)
    expect(screen.getByTestId('ai-summary')).toBeInTheDocument()
  })

  it('shows cached summary when available', () => {
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
    mockUseCompletion.mockReturnValue({
      completion: '',
      complete: mockComplete,
      isLoading: true,
      error: undefined,
    })

    render(<AiSummary slug="test" content="Test article content" />)
    expect(screen.getByTestId('ai-summary-loading')).toBeInTheDocument()
  })

  it('shows streaming completion text', () => {
    localStorageMock.getItem.mockReturnValue(null)
    mockUseCompletion.mockReturnValue({
      completion: 'Partial summary text...',
      complete: mockComplete,
      isLoading: true,
      error: undefined,
    })

    render(<AiSummary slug="test" content="Test article content" />)
    expect(screen.getByText('Partial summary text...')).toBeInTheDocument()
  })

  it('shows error message on failure', () => {
    localStorageMock.getItem.mockReturnValue(null)
    mockUseCompletion.mockReturnValue({
      completion: '',
      complete: mockComplete,
      isLoading: false,
      error: new Error('API error'),
    })

    render(<AiSummary slug="test" content="Test article content" />)
    expect(screen.getByText(/摘要生成失败/)).toBeInTheDocument()
  })
})
