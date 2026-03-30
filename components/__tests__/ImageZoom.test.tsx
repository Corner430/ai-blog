/** @jest-environment jsdom */
import { render } from '@testing-library/react'
import ImageZoom from '@/components/ImageZoom'

// Mock medium-zoom
const detachMock = jest.fn()
const zoomMock = jest.fn(() => ({ detach: detachMock }))
jest.mock('medium-zoom', () => ({
  __esModule: true,
  default: (...args: unknown[]) => zoomMock(...args),
}))

describe('ImageZoom', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('不应渲染可见 DOM 元素', () => {
    const { container } = render(<ImageZoom />)
    expect(container.innerHTML).toBe('')
  })

  it('应使用正确的选择器和选项调用 mediumZoom', () => {
    render(<ImageZoom />)
    expect(zoomMock).toHaveBeenCalledWith('.prose img', {
      margin: 24,
      background: 'rgba(0, 0, 0, 0.85)',
    })
  })

  it('卸载时应调用 detach', () => {
    const { unmount } = render(<ImageZoom />)
    unmount()
    expect(detachMock).toHaveBeenCalled()
  })
})
