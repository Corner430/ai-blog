'use client'

import { useEffect, useState } from 'react'

interface TOCItem {
  value: string
  url: string
  depth: number
}

export default function FloatingTOC({ toc }: { toc: TOCItem[] }) {
  const [activeId, setActiveId] = useState<string>('')

  useEffect(() => {
    const headingElements = toc
      .map(({ url }) => document.getElementById(url.replace('#', '')))
      .filter(Boolean) as HTMLElement[]

    if (headingElements.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id)
          }
        })
      },
      { rootMargin: '-80px 0px -80% 0px' }
    )

    headingElements.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [toc])

  if (!toc.length) return null

  return (
    <div className="fixed top-24 left-[calc(50%+32rem+1rem)] hidden w-56 2xl:block">
      <nav className="max-h-[calc(100vh-10rem)] overflow-y-auto">
        <p className="mb-2 text-sm font-semibold text-gray-900 dark:text-gray-100">目录</p>
        <ul className="space-y-1 text-sm">
          {toc.map(({ value, url, depth }) => (
            <li key={url} style={{ paddingLeft: `${(depth - 2) * 0.75}rem` }}>
              <a
                href={url}
                onClick={(e) => {
                  e.preventDefault()
                  document
                    .getElementById(url.replace('#', ''))
                    ?.scrollIntoView({ behavior: 'smooth' })
                }}
                className={`block py-1 transition-colors ${
                  activeId === url.replace('#', '')
                    ? 'text-primary-500 font-medium'
                    : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200'
                }`}
              >
                {value}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  )
}
