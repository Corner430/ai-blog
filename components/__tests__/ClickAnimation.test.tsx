/** @jest-environment jsdom */
import { render } from '@testing-library/react'
import { fireEvent } from '@testing-library/dom'
import ClickAnimation from '@/components/ClickAnimation'

describe('ClickAnimation', () => {
  it('不应渲染可见 DOM 元素', () => {
    const { container } = render(<ClickAnimation />)
    expect(container.innerHTML).toBe('')
  })

  it('应该注入 keyframe 样式', () => {
    render(<ClickAnimation />)
    expect(document.getElementById('click-heart-style')).toBeTruthy()
  })

  it('点击后应创建爱心元素', () => {
    render(<ClickAnimation />)
    fireEvent.click(document)
    const hearts = document.querySelectorAll('span[style*="clickHeartFloat"]')
    expect(hearts.length).toBe(1)
  })
})
