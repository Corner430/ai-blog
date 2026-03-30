'use client'

import { useEffect, useState } from 'react'

export default function Live2DWidget() {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const hidden = localStorage.getItem('live2d-hidden')
    if (hidden === 'true') {
      setVisible(false)
      return
    }

    // Load L2Dwidget from CDN
    const script = document.createElement('script')
    script.src = 'https://fastly.jsdelivr.net/gh/stevenjoezhang/live2d-widget@latest/autoload.js'
    script.async = true
    document.body.appendChild(script)

    return () => {
      // Cleanup live2d elements
      const waifu = document.getElementById('waifu')
      if (waifu) waifu.remove()
      script.remove()
    }
  }, [visible])

  if (!visible) {
    return (
      <button
        onClick={() => {
          setVisible(true)
          localStorage.removeItem('live2d-hidden')
        }}
        className="fixed bottom-4 left-4 z-50 rounded-full bg-gray-200 p-2 text-gray-500 transition-all hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-400 dark:hover:bg-gray-600"
        aria-label="显示看板娘"
        title="显示看板娘"
      >
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
        </svg>
      </button>
    )
  }

  return null
}
