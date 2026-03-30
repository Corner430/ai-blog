/** @jest-environment jsdom */
import { render, screen } from '@testing-library/react'
import FloatingTOC from '@/components/FloatingTOC'

describe('FloatingTOC', () => {
  const toc = [
    { value: '第一章', url: '#chapter-1', depth: 2 },
    { value: '第一节', url: '#section-1-1', depth: 3 },
    { value: '第二章', url: '#chapter-2', depth: 2 },
  ]

  it('应该渲染所有目录项', () => {
    render(<FloatingTOC toc={toc} />)
    expect(screen.getByText('第一章')).toBeTruthy()
    expect(screen.getByText('第一节')).toBeTruthy()
    expect(screen.getByText('第二章')).toBeTruthy()
  })

  it('空目录不应渲染任何内容', () => {
    const { container } = render(<FloatingTOC toc={[]} />)
    expect(container.innerHTML).toBe('')
  })

  it('应该显示目录标题', () => {
    render(<FloatingTOC toc={toc} />)
    expect(screen.getByText('目录')).toBeTruthy()
  })
})
