'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from '@/components/Link'

interface SearchResult {
  slug: string
  title: string
  summary: string
  score: number
}

interface AiSearchProps {
  isOpen: boolean
  onClose: () => void
}

export default function AiSearch({ isOpen, onClose }: AiSearchProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout>>()

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100)
    } else {
      setQuery('')
      setResults([])
      setHasSearched(false)
    }
  }, [isOpen])

  // Keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  const performSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([])
      setHasSearched(false)
      return
    }

    setIsSearching(true)
    setHasSearched(true)

    try {
      const res = await fetch('/api/ai/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchQuery }),
      })

      if (res.ok) {
        const data = await res.json()
        setResults(data.results || [])
      } else {
        setResults([])
      }
    } catch {
      setResults([])
    } finally {
      setIsSearching(false)
    }
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (debounceRef.current) clearTimeout(debounceRef.current)
    performSearch(query)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setQuery(value)

    // Debounced search
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      performSearch(value)
    }, 300)
  }

  if (!isOpen) return null

  return (
    <div
      data-testid="ai-search-modal"
      className="fixed inset-0 z-[60] flex items-start justify-center pt-[15vh]"
    >
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-lg rounded-lg border border-gray-200 bg-white shadow-2xl dark:border-gray-700 dark:bg-gray-900">
        <form onSubmit={handleSubmit}>
          <div className="flex items-center border-b border-gray-200 px-4 dark:border-gray-700">
            <svg
              className="h-5 w-5 text-gray-400"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
              />
            </svg>
            <input
              ref={inputRef}
              value={query}
              onChange={handleChange}
              placeholder="AI 语义搜索文章..."
              className="w-full border-0 bg-transparent px-3 py-4 text-sm text-gray-900 placeholder-gray-400 focus:ring-0 focus:outline-none dark:text-gray-100"
            />
            <kbd className="rounded border border-gray-200 px-2 py-0.5 text-xs text-gray-400 dark:border-gray-600">
              ESC
            </kbd>
          </div>
        </form>

        {/* Results */}
        <div className="max-h-[50vh] overflow-y-auto px-2 py-2">
          {isSearching && (
            <div className="px-4 py-8 text-center text-sm text-gray-400">
              搜索中...
            </div>
          )}

          {!isSearching && hasSearched && results.length === 0 && (
            <div className="px-4 py-8 text-center text-sm text-gray-400">
              未找到相关文章
            </div>
          )}

          {!isSearching &&
            results.map((result) => (
              <Link
                key={result.slug}
                href={`/blog/${result.slug}`}
                onClick={onClose}
                className="block rounded-md px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {result.title}
                </div>
                <div className="mt-1 line-clamp-2 text-xs text-gray-500 dark:text-gray-400">
                  {result.summary}
                </div>
              </Link>
            ))}
        </div>
      </div>
    </div>
  )
}
