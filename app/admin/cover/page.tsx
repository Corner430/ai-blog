'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

interface Article {
  filename: string
  title: string
  summary: string
}

type Status = 'idle' | 'submitting' | 'polling' | 'done' | 'failed' | 'timeout'

const MAX_POLLS = 60
const POLL_INTERVAL = 3000

export default function CoverPage() {
  const [articles, setArticles] = useState<Article[]>([])
  const [loadingArticles, setLoadingArticles] = useState(true)
  const [selectedFilename, setSelectedFilename] = useState('')
  const [summary, setSummary] = useState('')
  const [status, setStatus] = useState<Status>('idle')
  const [imageUrl, setImageUrl] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [copied, setCopied] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const cancelledRef = useRef(false)

  useEffect(() => {
    fetch('/api/admin/articles')
      .then((res) => res.json())
      .then((data) => setArticles(data.articles || []))
      .catch(() => setArticles([]))
      .finally(() => setLoadingArticles(false))
  }, [])

  const selectedArticle = articles.find((a) => a.filename === selectedFilename)
  const title = selectedArticle?.title || ''

  const handleArticleChange = (filename: string) => {
    setSelectedFilename(filename)
    const article = articles.find((a) => a.filename === filename)
    setSummary(article?.summary || '')
  }

  const cleanup = useCallback(() => {
    cancelledRef.current = true
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }, [])

  useEffect(() => {
    return cleanup
  }, [cleanup])

  const pollJob = useCallback(async (jobId: string, count: number) => {
    if (cancelledRef.current) return

    if (count >= MAX_POLLS) {
      setStatus('timeout')
      return
    }

    try {
      const queryRes = await fetch(`/api/ai/cover/query?jobId=${jobId}`)
      const result = await queryRes.json()

      if (cancelledRef.current) return

      if (result.status === 'done' && result.imageUrl) {
        setImageUrl(result.imageUrl)
        setStatus('done')
      } else if (result.status === 'failed') {
        setErrorMsg(result.error || '生成失败')
        setStatus('failed')
      } else {
        timerRef.current = setTimeout(() => pollJob(jobId, count + 1), POLL_INTERVAL)
      }
    } catch {
      if (!cancelledRef.current) {
        setErrorMsg('查询失败')
        setStatus('failed')
      }
    }
  }, [])

  const handleGenerate = async () => {
    if (!title) return

    setStatus('submitting')
    setImageUrl('')
    setErrorMsg('')
    setCopied(false)
    cleanup()
    cancelledRef.current = false

    try {
      const submitRes = await fetch('/api/ai/cover/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, summary: summary.trim() || undefined }),
      })

      if (!submitRes.ok) {
        const data = await submitRes.json()
        setErrorMsg(data.error || '提交失败')
        setStatus('failed')
        return
      }

      const { jobId } = await submitRes.json()
      setStatus('polling')

      timerRef.current = setTimeout(() => pollJob(jobId, 0), POLL_INTERVAL)
    } catch {
      setErrorMsg('提交失败')
      setStatus('failed')
    }
  }

  const handleDownload = async () => {
    try {
      const res = await fetch(imageUrl)
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `cover-${Date.now()}.png`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch {
      window.open(imageUrl)
    }
  }

  const handleCopyUrl = async () => {
    await navigator.clipboard.writeText(imageUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const isLoading = status === 'submitting' || status === 'polling'

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-3xl leading-9 font-bold tracking-tight text-gray-900 sm:text-4xl dark:text-gray-100">
        封面图生成
      </h1>

      <div className="mt-8 space-y-4">
        <div>
          <label
            htmlFor="cover-article"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            选择文章 *
          </label>
          {loadingArticles ? (
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">加载文章列表...</p>
          ) : (
            <select
              id="cover-article"
              value={selectedFilename}
              onChange={(e) => handleArticleChange(e.target.value)}
              disabled={isLoading}
              className="focus:border-primary-500 focus:ring-primary-500 mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:ring-1 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
            >
              <option value="">-- 请选择文章 --</option>
              {articles.map((article) => (
                <option key={article.filename} value={article.filename}>
                  {article.title || article.filename}
                </option>
              ))}
            </select>
          )}
        </div>

        <div>
          <label
            htmlFor="cover-summary"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            文章摘要（可编辑）
          </label>
          <textarea
            id="cover-summary"
            placeholder="选择文章后自动填充，也可手动修改"
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            disabled={isLoading}
            rows={3}
            className="focus:border-primary-500 focus:ring-primary-500 mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:ring-1 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
          />
        </div>

        <button
          onClick={handleGenerate}
          disabled={!title || isLoading}
          className="bg-primary-500 hover:bg-primary-600 rounded-md px-4 py-2 text-white transition-colors disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isLoading ? '生成中...' : '生成封面'}
        </button>
      </div>

      {status === 'timeout' && (
        <p className="mt-4 text-amber-600 dark:text-amber-400">生成超时，请重试</p>
      )}

      {status === 'failed' && <p className="mt-4 text-red-600 dark:text-red-400">{errorMsg}</p>}

      {status === 'done' && imageUrl && (
        <div className="mt-6 space-y-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={imageUrl} alt="封面图预览" className="w-full rounded-lg shadow-md" />
          <div className="flex gap-3">
            <button
              onClick={handleDownload}
              className="rounded-md bg-green-600 px-4 py-2 text-white transition-colors hover:bg-green-700"
            >
              下载图片
            </button>
            <button
              onClick={handleCopyUrl}
              className="rounded-md bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700"
            >
              {copied ? '已复制' : '复制 URL'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
