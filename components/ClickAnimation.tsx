'use client'

import { useEffect, useCallback, useRef } from 'react'

const COLORS = [
  '#ff2d2d',
  '#ff6b6b',
  '#ee5a24',
  '#f368e0',
  '#ff9ff3',
  '#feca57',
  '#54a0ff',
  '#5f27cd',
  '#01a3a4',
  '#10ac84',
  '#ff6348',
  '#e056fd',
]

export default function ClickAnimation() {
  const colorIndex = useRef(0)

  const handleClick = useCallback((e: MouseEvent) => {
    const heart = document.createElement('span')
    heart.textContent = '\u2764'
    heart.style.cssText = `
      position: fixed;
      left: ${e.clientX - 8}px;
      top: ${e.clientY - 8}px;
      font-size: 16px;
      color: ${COLORS[colorIndex.current % COLORS.length]};
      pointer-events: none;
      z-index: 9999;
      user-select: none;
      animation: clickHeartFloat 1s ease-out forwards;
    `
    colorIndex.current++
    document.body.appendChild(heart)
    setTimeout(() => heart.remove(), 1000)
  }, [])

  useEffect(() => {
    if (!document.getElementById('click-heart-style')) {
      const style = document.createElement('style')
      style.id = 'click-heart-style'
      style.textContent = `
        @keyframes clickHeartFloat {
          0% { opacity: 1; transform: translateY(0) scale(1); }
          100% { opacity: 0; transform: translateY(-60px) scale(1.5); }
        }
      `
      document.head.appendChild(style)
    }

    document.addEventListener('click', handleClick)
    return () => document.removeEventListener('click', handleClick)
  }, [handleClick])

  return null
}
