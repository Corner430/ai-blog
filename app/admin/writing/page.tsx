'use client'

import { useState } from 'react'
import { useCompletion } from '@ai-sdk/react'

export default function WritingPage() {
  const [input, setInput] = useState('')
  const [copied, setCopied] = useState(false)

  const { completion, complete, isLoading, error, setCompletion } = useCompletion({
    api: '/api/ai/writing',
  })

  const handlePolish = async () => {
    if (!input.trim()) return
    await complete(input, { body: { action: 'polish' } })
  }

  const handleContinue = async () => {
    if (!input.trim()) return
    await complete(input, { body: { action: 'continue' } })
  }

  const handleCopy = async () => {
    await navigator.clipboard.writeText(completion)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleReplace = () => {
    setInput(completion)
    setCompletion('')
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-3xl font-bold leading-9 tracking-tight text-gray-900 dark:text-gray-100 sm:text-4xl">
        写作助手
      </h1>

      <div className="mt-8 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            输入文本
          </label>
          <textarea
            placeholder="请输入或粘贴文本"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            rows={8}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
          />
        </div>

        <div className="flex gap-3">
          <button
            onClick={handlePolish}
            disabled={!input.trim() || isLoading}
            className="rounded-md bg-primary-500 px-4 py-2 text-white transition-colors hover:bg-primary-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            润色
          </button>
          <button
            onClick={handleContinue}
            disabled={!input.trim() || isLoading}
            className="rounded-md bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            续写
          </button>
        </div>
      </div>

      {error && (
        <p className="mt-4 text-red-600 dark:text-red-400">{error.message}</p>
      )}

      {completion && (
        <div className="mt-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              AI 结果
            </label>
            <div className="mt-1 whitespace-pre-wrap rounded-md border border-gray-200 bg-gray-50 p-3 text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100">
              {completion}
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleCopy}
              className="rounded-md bg-green-600 px-4 py-2 text-white transition-colors hover:bg-green-700"
            >
              {copied ? '已复制' : '复制结果'}
            </button>
            <button
              onClick={handleReplace}
              className="rounded-md bg-amber-600 px-4 py-2 text-white transition-colors hover:bg-amber-700"
            >
              替换原文
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
