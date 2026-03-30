/** @jest-environment jsdom */
import { render, screen, waitFor } from '@testing-library/react'
import PageViewCounter from '@/components/PageViewCounter'

describe('PageViewCounter', () => {
  beforeEach(() => {
    jest.restoreAllMocks()
  })

  it('有访问量时应该显示数字', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      json: () => Promise.resolve({ views: 42 }),
    })
    render(<PageViewCounter slug="test" />)
    await waitFor(() => {
      expect(screen.getByText(/42/)).toBeTruthy()
    })
  })

  it('访问量为 0 时不应渲染', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      json: () => Promise.resolve({ views: 0 }),
    })
    const { container } = render(<PageViewCounter slug="test" />)
    await waitFor(() => {
      expect(container.textContent).toBe('')
    })
  })

  it('请求失败时不应渲染', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('fail'))
    const { container } = render(<PageViewCounter slug="test" />)
    await waitFor(() => {
      expect(container.textContent).toBe('')
    })
  })
})
