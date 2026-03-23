/**
 * @jest-environment jsdom
 */
import React from 'react'
import { render, screen, fireEvent, act, cleanup } from '@testing-library/react'
import '@testing-library/jest-dom'

// Mock useCompletion from @ai-sdk/react
const mockComplete = jest.fn()
let mockCompletion = ''
let mockIsLoading = false
let mockError: Error | undefined

jest.mock('@ai-sdk/react', () => ({
  useCompletion: jest.fn(() => ({
    completion: mockCompletion,
    complete: mockComplete,
    isLoading: mockIsLoading,
    error: mockError,
    setCompletion: jest.fn((val: string) => {
      mockCompletion = val
    }),
  })),
}))

import WritingPage from '../writing/page'

// Mock clipboard
Object.assign(navigator, {
  clipboard: { writeText: jest.fn().mockResolvedValue(undefined) },
})

describe('Writing Assistant Page', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockCompletion = ''
    mockIsLoading = false
    mockError = undefined
  })

  afterEach(() => {
    cleanup()
  })

  it('renders input area, polish button, and continue button', () => {
    render(<WritingPage />)
    expect(screen.getByPlaceholderText(/输入.*文本|请输入/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /润色/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /续写/ })).toBeInTheDocument()
  })

  it('disables buttons when input is empty', () => {
    render(<WritingPage />)
    expect(screen.getByRole('button', { name: /润色/ })).toBeDisabled()
    expect(screen.getByRole('button', { name: /续写/ })).toBeDisabled()
  })

  it('enables buttons when input has text', () => {
    render(<WritingPage />)
    const textarea = screen.getByPlaceholderText(/输入.*文本|请输入/)
    fireEvent.change(textarea, { target: { value: 'Some text' } })

    expect(screen.getByRole('button', { name: /润色/ })).not.toBeDisabled()
    expect(screen.getByRole('button', { name: /续写/ })).not.toBeDisabled()
  })

  it('calls complete with polish action when polish is clicked', async () => {
    render(<WritingPage />)
    const textarea = screen.getByPlaceholderText(/输入.*文本|请输入/)
    fireEvent.change(textarea, { target: { value: 'Test text' } })

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /润色/ }))
    })

    expect(mockComplete).toHaveBeenCalledWith('Test text', { body: { action: 'polish' } })
  })

  it('calls complete with continue action when continue is clicked', async () => {
    render(<WritingPage />)
    const textarea = screen.getByPlaceholderText(/输入.*文本|请输入/)
    fireEvent.change(textarea, { target: { value: 'Test text' } })

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /续写/ }))
    })

    expect(mockComplete).toHaveBeenCalledWith('Test text', { body: { action: 'continue' } })
  })

  it('shows copy and replace buttons when completion is available', () => {
    mockCompletion = 'AI result text'
    render(<WritingPage />)

    expect(screen.getByRole('button', { name: /复制结果/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /替换原文/ })).toBeInTheDocument()
  })

  it('copies result to clipboard when copy button is clicked', async () => {
    mockCompletion = 'AI result text'
    render(<WritingPage />)

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /复制结果/ }))
    })

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('AI result text')
  })

  it('replaces input with result when replace button is clicked', async () => {
    mockCompletion = 'AI result text'
    render(<WritingPage />)

    const textarea = screen.getByPlaceholderText(/输入.*文本|请输入/) as HTMLTextAreaElement
    fireEvent.change(textarea, { target: { value: 'Original' } })

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /替换原文/ }))
    })

    // After replace, input should have the AI result
    expect(textarea.value).toBe('AI result text')
  })

  it('shows error when AI service returns an error', () => {
    mockError = new Error('Service unavailable')
    render(<WritingPage />)

    expect(screen.getByText(/Service unavailable|错误/)).toBeInTheDocument()
  })
})
