/** @jest-environment jsdom */
import { render, screen, fireEvent } from '@testing-library/react'
import Live2DWidget from '@/components/Live2DWidget'

describe('Live2DWidget', () => {
  beforeEach(() => {
    localStorage.clear()
    // Remove any leftover waifu elements
    const waifu = document.getElementById('waifu')
    if (waifu) waifu.remove()
  })

  it('可见状态时不渲染可见 DOM（脚本由 useEffect 注入）', () => {
    const { container } = render(<Live2DWidget />)
    // When visible, component returns null (script injected via useEffect)
    expect(container.innerHTML).toBe('')
  })

  it('隐藏状态时应显示恢复按钮', () => {
    localStorage.setItem('live2d-hidden', 'true')
    render(<Live2DWidget />)
    expect(screen.getByRole('button', { name: /显示看板娘/i })).toBeTruthy()
  })

  it('点击恢复按钮应移除 localStorage 标记', () => {
    localStorage.setItem('live2d-hidden', 'true')
    render(<Live2DWidget />)
    const button = screen.getByRole('button', { name: /显示看板娘/i })
    fireEvent.click(button)
    expect(localStorage.getItem('live2d-hidden')).toBeNull()
  })

  it('应加载 CDN 脚本到 document.body', () => {
    render(<Live2DWidget />)
    const scripts = document.querySelectorAll('script[src*="live2d-widget"]')
    expect(scripts.length).toBe(1)
  })
})
