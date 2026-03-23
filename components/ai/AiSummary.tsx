'use client'

import { useEffect, useState } from 'react'

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
  const [summary, setSummary] = useState<string>('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string>('')

  const contentHash = djb2Hash(content)
  const cacheKey = `ai-summary-${slug}-${contentHash}`

  useEffect(() => {
    // Check localStorage cache
    try {
      const cached = localStorage.getItem(cacheKey)
      if (cached) {
        setSummary(cached)
        setIsLoading(false)
        return
      }
    } catch {
      // localStorage not available, continue to fetch
    }

    // Fetch streaming summary
    const abortController = new AbortController()

    async function fetchSummary() {
      try {
        const res = await fetch('/api/ai/summary', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content, slug }),
          signal: abortController.signal,
        })

        if (!res.ok) {
          throw new Error(`API error: ${res.status}`)
        }

        const reader = res.body?.getReader()
        if (!reader) throw new Error('No reader available')

        const decoder = new TextDecoder()
        let fullText = ''

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value, { stream: true })
          // Parse Vercel AI SDK data stream format
          const lines = chunk.split('\n')
          for (const line of lines) {
            if (line.startsWith('0:')) {
              try {
                const text = JSON.parse(line.slice(2))
                fullText += text
                setSummary(fullText)
              } catch {
                // Skip unparseable lines
              }
            }
          }
        }

        // Cache the complete summary
        try {
          localStorage.setItem(cacheKey, fullText)
        } catch {
          // localStorage full or not available
        }
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          setError('AI 摘要生成失败，请稍后刷新重试')
        }
      } finally {
        setIsLoading(false)
      }
    }

    fetchSummary()

    return () => {
      abortController.abort()
    }
  }, [cacheKey, content, slug])

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
        <p className="text-sm text-red-500 dark:text-red-400">{error}</p>
      ) : isLoading && !summary ? (
        <div data-testid="ai-summary-loading" className="space-y-2">
          <div className="h-3 w-full animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
          <div className="h-3 w-3/4 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
        </div>
      ) : (
        <p className="text-sm leading-relaxed text-gray-700 dark:text-gray-300">{summary}</p>
      )}
    </div>
  )
}
