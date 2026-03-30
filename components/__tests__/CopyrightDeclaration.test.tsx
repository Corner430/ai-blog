/** @jest-environment jsdom */
import { render, screen } from '@testing-library/react'
import CopyrightDeclaration from '@/components/CopyrightDeclaration'

jest.mock('@/data/siteMetadata', () => ({
  __esModule: true,
  default: {
    author: 'TestAuthor',
    siteUrl: 'https://example.com',
    language: 'en-us',
  },
}))

describe('CopyrightDeclaration', () => {
  it('应该显示作者名和文章标题', () => {
    render(<CopyrightDeclaration title="Test Post" slug="test-post" />)
    expect(screen.getByText('TestAuthor')).toBeTruthy()
    expect(screen.getByText('Test Post')).toBeTruthy()
  })

  it('应该包含 CC BY-NC-SA 4.0 链接', () => {
    render(<CopyrightDeclaration title="Test Post" slug="test-post" />)
    expect(screen.getByText('CC BY-NC-SA 4.0')).toBeTruthy()
  })

  it('应该包含文章链接', () => {
    render(<CopyrightDeclaration title="Test Post" slug="test-post" />)
    expect(screen.getByText('https://example.com/blog/test-post')).toBeTruthy()
  })
})
