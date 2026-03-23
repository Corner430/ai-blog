'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

type Status = 'idle' | 'submitting' | 'polling' | 'done' | 'failed' | 'timeout'

const MAX_POLLS = 60
const POLL_INTERVAL = 3000

export default function CoverPage() {
  const [title, setTitle] = useState('')
  const [summary, setSummary] = useState('')
  const [status, setStatus] = useState<Status>('idle')
  const [imageUrl, setImageUrl] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [copied, setCopied] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const cancelledRef = useRef(false)

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

  const pollJob = useCallback(
    async (jobId: string, count: number) => {
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
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  )

  const handleGenerate = async () => {
    if (!title.trim()) return

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
        body: JSON.stringify({ title: title.trim(), summary: summary.trim() || undefined }),
      })

      if (!submitRes.ok) {
        const data = await submitRes.json()
        setErrorMsg(data.error || '提交失败')
        setStatus('failed')
        return
      }

      const { jobId } = await submitRes.json()
      setStatus('polling')

      // Start first poll after interval
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
      <h1 className="text-3xl font-bold leading-9 tracking-tight text-gray-900 dark:text-gray-100 sm:text-4xl">
        封面图生成
      </h1>

      <div className="mt-8 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            文章标题 *
          </label>
          <input
            type="text"
            placeholder="请输入文章标题"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={isLoading}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            文章摘要（选填）
          </label>
          <textarea
            placeholder="请输入文章摘要"
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            disabled={isLoading}
            rows={3}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
          />
        </div>

        <button
          onClick={handleGenerate}
          disabled={!title.trim() || isLoading}
          className="rounded-md bg-primary-500 px-4 py-2 text-white transition-colors hover:bg-primary-600 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isLoading ? '生成中...' : '生成封面'}
        </button>
      </div>

      {status === 'timeout' && (
        <p className="mt-4 text-amber-600 dark:text-amber-400">生成超时，请重试</p>
      )}

      {status === 'failed' && (
        <p className="mt-4 text-red-600 dark:text-red-400">{errorMsg}</p>
      )}

      {status === 'done' && imageUrl && (
        <div className="mt-6 space-y-4">
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
