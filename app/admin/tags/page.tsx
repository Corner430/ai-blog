'use client'

import { useState, useEffect } from 'react'

interface Article {
  filename: string
  title: string
  tags: string[]
  content: string
}

interface ArticleState {
  suggestedTags: string[]
  selectedTags: boolean[]
  loading: boolean
  error: string
  writeSuccess: boolean
}

export default function TagsPage() {
  const [articles, setArticles] = useState<Article[]>([])
  const [articleStates, setArticleStates] = useState<Record<string, ArticleState>>({})
  const [loadingArticles, setLoadingArticles] = useState(true)
  const [emptyState, setEmptyState] = useState(false)

  useEffect(() => {
    fetchArticles()
  }, [])

  const fetchArticles = async () => {
    try {
      const res = await fetch('/api/admin/articles')
      const data = await res.json()
      setArticles(data.articles || [])
      setEmptyState((data.articles || []).length === 0)
    } catch {
      setArticles([])
      setEmptyState(true)
    } finally {
      setLoadingArticles(false)
    }
  }

  const getState = (filename: string): ArticleState =>
    articleStates[filename] || {
      suggestedTags: [],
      selectedTags: [],
      loading: false,
      error: '',
      writeSuccess: false,
    }

  const updateState = (filename: string, update: Partial<ArticleState>) => {
    setArticleStates((prev) => ({
      ...prev,
      [filename]: { ...getState(filename), ...update },
    }))
  }

  const handleGenerateTags = async (article: Article) => {
    updateState(article.filename, {
      loading: true,
      error: '',
      suggestedTags: [],
      writeSuccess: false,
    })

    try {
      const res = await fetch('/api/ai/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: article.content }),
      })

      if (!res.ok) {
        const data = await res.json()
        updateState(article.filename, { loading: false, error: data.error || '生成标签错误' })
        return
      }

      const data = await res.json()
      const tags = data.tags || []
      updateState(article.filename, {
        loading: false,
        suggestedTags: tags,
        selectedTags: tags.map(() => true),
      })
    } catch {
      updateState(article.filename, { loading: false, error: '生成标签错误' })
    }
  }

  const handleToggleTag = (filename: string, index: number) => {
    const state = getState(filename)
    const newSelected = [...state.selectedTags]
    newSelected[index] = !newSelected[index]
    updateState(filename, { selectedTags: newSelected })
  }

  const handleWriteTags = async (filename: string) => {
    const state = getState(filename)
    const tagsToWrite = state.suggestedTags.filter((_, i) => state.selectedTags[i])

    updateState(filename, { loading: true, writeSuccess: false })

    try {
      await fetch('/api/admin/tags/write', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename, tags: tagsToWrite }),
      })

      updateState(filename, { loading: false, writeSuccess: true })
    } catch {
      updateState(filename, { loading: false, error: '写入失败' })
    }
  }

  if (loadingArticles) {
    return (
      <div className="mx-auto max-w-3xl">
        <h1 className="text-3xl leading-9 font-bold tracking-tight text-gray-900 sm:text-4xl dark:text-gray-100">
          自动标签管理
        </h1>
        <p className="mt-4 text-gray-600 dark:text-gray-400">加载中...</p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-3xl leading-9 font-bold tracking-tight text-gray-900 sm:text-4xl dark:text-gray-100">
        自动标签管理
      </h1>

      {emptyState ? (
        <p className="mt-8 text-gray-600 dark:text-gray-400">暂无文章</p>
      ) : (
        <div className="mt-8 space-y-6">
          {articles.map((article) => {
            const state = getState(article.filename)
            return (
              <div
                key={article.filename}
                className="rounded-lg border border-gray-200 p-4 dark:border-gray-700"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      {article.title}
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{article.filename}</p>
                    {article.tags.length > 0 && (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {article.tags.map((tag) => (
                          <span
                            key={tag}
                            className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => handleGenerateTags(article)}
                    disabled={state.loading}
                    className="bg-primary-500 hover:bg-primary-600 rounded-md px-3 py-1.5 text-sm text-white transition-colors disabled:opacity-50"
                  >
                    {state.loading ? '生成中...' : '生成标签'}
                  </button>
                </div>

                {state.error && (
                  <p className="mt-2 text-sm text-red-600 dark:text-red-400">{state.error}</p>
                )}

                {state.writeSuccess && (
                  <p className="mt-2 text-sm text-green-600 dark:text-green-400">标签已写入</p>
                )}

                {state.suggestedTags.length > 0 && (
                  <div className="mt-3">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      建议标签：
                    </p>
                    <div className="mt-1 flex flex-wrap gap-2">
                      {state.suggestedTags.map((tag, index) => (
                        <label
                          key={tag}
                          className="flex cursor-pointer items-center gap-1 rounded border border-gray-300 px-2 py-1 text-sm dark:border-gray-600"
                        >
                          <input
                            type="checkbox"
                            checked={state.selectedTags[index]}
                            onChange={() => handleToggleTag(article.filename, index)}
                          />
                          {tag}
                        </label>
                      ))}
                    </div>
                    <button
                      onClick={() => handleWriteTags(article.filename)}
                      disabled={state.loading || !state.selectedTags.some(Boolean)}
                      className="mt-2 rounded-md bg-green-600 px-3 py-1.5 text-sm text-white transition-colors hover:bg-green-700 disabled:opacity-50"
                    >
                      写入 frontmatter
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
