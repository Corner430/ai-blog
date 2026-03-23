'use client'

import { useEffect, useRef, useState } from 'react'
import { useCompletion } from '@ai-sdk/react'

function djb2Hash(str: string): string {
  let hash = 5381
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 33) ^ str.charCodeAt(i)
  }
  return (hash >>> 0).toString(36)
}

interface AiSummaryProps {
  slug: string
  content: string
}

export default function AiSummary({ slug, content }: AiSummaryProps) {
  const contentHash = djb2Hash(content)
  const cacheKey = `ai-summary-${slug}-${contentHash}`
  const [cachedSummary, setCachedSummary] = useState<string | null>(null)
  const hasTriggered = useRef(false)

  const { completion, complete, isLoading, error } = useCompletion({
    api: '/api/ai/summary',
    streamProtocol: 'text',
    body: { slug },
    onFinish: (_prompt, completionText) => {
      try {
        localStorage.setItem(cacheKey, completionText)
      } catch {
        // localStorage full or not available
      }
    },
  })

  useEffect(() => {
    // Check localStorage cache first
    try {
      const cached = localStorage.getItem(cacheKey)
      if (cached) {
        setCachedSummary(cached)
        return
      }
    } catch {
      // localStorage not available
    }

    // Trigger streaming completion
    if (!hasTriggered.current) {
      hasTriggered.current = true
      complete(content)
    }
  }, [cacheKey, content, complete])

  const displayText = cachedSummary || completion
  const showLoading = !cachedSummary && isLoading && !completion

  return (
    <div
      data-testid="ai-summary"
      className="my-4 rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50"
    >
      <div className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-500 dark:text-gray-400">
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z"
          />
        </svg>
        AI 摘要
      </div>
      {error ? (
        <p className="text-sm text-red-500 dark:text-red-400">AI 摘要生成失败，请稍后刷新重试</p>
      ) : showLoading ? (
        <div data-testid="ai-summary-loading" className="space-y-2">
          <div className="h-3 w-full animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
          <div className="h-3 w-3/4 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
        </div>
      ) : (
        <p className="text-sm leading-relaxed text-gray-700 dark:text-gray-300">{displayText}</p>
      )}
    </div>
  )
}
