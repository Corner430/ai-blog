'use client'

import { useEffect, useRef, useState, FormEvent } from 'react'
import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'

interface AiChatProps {
  slug: string
  articleContent: string
}

export default function AiChat({ slug, articleContent }: AiChatProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [input, setInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const { messages, sendMessage, status, setMessages, error, regenerate } = useChat({
    transport: new DefaultChatTransport({
      api: '/api/ai/chat',
      body: { articleContent },
    }),
  })

  const isLoading = status === 'streaming' || status === 'submitted'

  // Reset messages when slug changes
  useEffect(() => {
    setMessages([])
  }, [slug, setMessages])

  // Auto-scroll to bottom
  useEffect(() => {
    if (typeof messagesEndRef.current?.scrollIntoView === 'function') {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    const text = input.trim()
    if (!text || isLoading) return
    setInput('')
    sendMessage({ text })
  }

  return (
    <>
      {/* Toggle button */}
      <button
        data-testid="ai-chat-toggle"
        onClick={() => setIsOpen(!isOpen)}
        className="bg-primary-500 hover:bg-primary-600 fixed right-8 bottom-32 z-50 rounded-full p-3 text-white shadow-lg transition-all md:bottom-36"
        aria-label="AI 问答"
      >
        {isOpen ? (
          <svg
            className="h-6 w-6"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg
            className="h-6 w-6"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z"
            />
          </svg>
        )}
      </button>

      {/* Chat panel */}
      {isOpen && (
        <div
          data-testid="ai-chat-panel"
          className="fixed right-4 bottom-48 z-50 flex h-[480px] w-[360px] flex-col rounded-lg border border-gray-200 bg-white shadow-xl md:right-8 md:bottom-52 dark:border-gray-700 dark:bg-gray-900"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3 dark:border-gray-700">
            <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">AI 问答助手</h3>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <svg
                className="h-4 w-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-3">
            {messages.length === 0 && (
              <p className="text-center text-sm text-gray-400">针对这篇文章提问吧</p>
            )}
            {messages.map((msg) => {
              const text =
                msg.parts
                  ?.filter((p) => p.type === 'text')
                  .map((p) => p.text)
                  .join('') || ''
              if (!text) return null
              return (
                <div
                  key={msg.id}
                  className={`mb-3 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}
                >
                  <div
                    className={`inline-block max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                      msg.role === 'user'
                        ? 'bg-primary-500 text-white'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
                    }`}
                  >
                    {text}
                  </div>
                </div>
              )
            })}
            {isLoading && (
              <div className="mb-3 text-left">
                <div className="inline-block rounded-lg bg-gray-100 px-3 py-2 text-sm dark:bg-gray-800">
                  <span className="animate-pulse">...</span>
                </div>
              </div>
            )}
            {error && (
              <div className="mb-3 text-center">
                <p className="mb-2 text-xs text-red-500">服务异常，请重试</p>
                <button
                  onClick={() => regenerate()}
                  className="rounded-md bg-gray-100 px-3 py-1 text-xs text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                  重试
                </button>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form
            onSubmit={handleSubmit}
            className="border-t border-gray-200 px-4 py-3 dark:border-gray-700"
          >
            <div className="flex gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="输入你的问题..."
                className="focus:border-primary-500 focus:ring-primary-500 flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:ring-1 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="bg-primary-500 hover:bg-primary-600 rounded-md px-3 py-2 text-sm text-white disabled:opacity-50"
              >
                发送
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  )
}
