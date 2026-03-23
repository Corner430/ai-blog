/**
 * @jest-environment jsdom
 */
import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import AiChat from '../AiChat'

// Mock ai module to avoid TransformStream not defined in jsdom
jest.mock('ai', () => ({
  DefaultChatTransport: jest.fn(),
}))

// Mock useChat from ai/react
jest.mock('@ai-sdk/react', () => ({
  useChat: jest.fn(() => ({
    messages: [],
    sendMessage: jest.fn(),
    status: 'ready',
    setMessages: jest.fn(),
    error: undefined,
    regenerate: jest.fn(),
  })),
}))

describe('AiChat', () => {
  it('renders chat toggle button', () => {
    render(<AiChat slug="test" articleContent="Test content" />)
    expect(screen.getByTestId('ai-chat-toggle')).toBeInTheDocument()
  })

  it('toggles chat panel on button click', () => {
    render(<AiChat slug="test" articleContent="Test content" />)
    const toggle = screen.getByTestId('ai-chat-toggle')

    // Initially closed
    expect(screen.queryByTestId('ai-chat-panel')).not.toBeInTheDocument()

    // Open
    fireEvent.click(toggle)
    expect(screen.getByTestId('ai-chat-panel')).toBeInTheDocument()

    // Close
    fireEvent.click(toggle)
    expect(screen.queryByTestId('ai-chat-panel')).not.toBeInTheDocument()
  })
})
