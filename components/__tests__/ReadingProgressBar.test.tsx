/** @jest-environment jsdom */
import { render } from '@testing-library/react'
import ReadingProgressBar from '@/components/ReadingProgressBar'

describe('ReadingProgressBar', () => {
  it('应该渲染进度条容器', () => {
    const { container } = render(<ReadingProgressBar />)
    const outer = container.firstChild as HTMLElement
    expect(outer).toBeTruthy()
    expect(outer.className).toContain('fixed')
    expect(outer.className).toContain('top-0')
  })

  it('初始宽度应该为 0%', () => {
    const { container } = render(<ReadingProgressBar />)
    const inner = (container.firstChild as HTMLElement).firstChild as HTMLElement
    expect(inner.style.width).toBe('0%')
  })
})
