'use client'

import { useEffect, useState } from 'react'

export default function PageViewCounter({ slug }: { slug: string }) {
  const [views, setViews] = useState<number | null>(null)

  useEffect(() => {
    fetch(`/api/pageviews/?slug=${encodeURIComponent(slug)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.views > 0) setViews(data.views)
      })
      .catch(() => {})
  }, [slug])

  if (views === null) return null

  return (
    <span className="text-sm text-gray-500 dark:text-gray-400">
      {views.toLocaleString()} 次浏览
    </span>
  )
}
