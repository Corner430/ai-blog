/** @jest-environment node */
import { sortPostsWithSticky } from '@/lib/utils'

// Mock pliny sortPosts to sort by date descending
jest.mock('pliny/utils/contentlayer', () => ({
  sortPosts: (posts: { date: string }[]) =>
    [...posts].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
}))

describe('sortPostsWithSticky', () => {
  const posts = [
    { date: '2024-01-01', title: 'Old post', sticky: undefined },
    { date: '2024-06-01', title: 'Recent post', sticky: undefined },
    { date: '2024-03-01', title: 'Sticky 2', sticky: 2 },
    { date: '2024-02-01', title: 'Sticky 1', sticky: 1 },
    { date: '2024-05-01', title: 'Middle post', sticky: undefined },
  ]

  it('应该把置顶文章排在最前面', () => {
    const sorted = sortPostsWithSticky(posts)
    expect(sorted[0].title).toBe('Sticky 1')
    expect(sorted[1].title).toBe('Sticky 2')
  })

  it('置顶文章应按 sticky 值升序排列', () => {
    const sorted = sortPostsWithSticky(posts)
    expect(sorted[0].sticky).toBe(1)
    expect(sorted[1].sticky).toBe(2)
  })

  it('非置顶文章应按日期降序排列', () => {
    const sorted = sortPostsWithSticky(posts)
    const normalPosts = sorted.filter((p) => p.sticky == null)
    expect(normalPosts[0].title).toBe('Recent post')
    expect(normalPosts[1].title).toBe('Middle post')
    expect(normalPosts[2].title).toBe('Old post')
  })

  it('没有置顶文章时应正常按日期排序', () => {
    const noPinned = posts.filter((p) => p.sticky == null)
    const sorted = sortPostsWithSticky(noPinned)
    expect(sorted[0].title).toBe('Recent post')
    expect(sorted[sorted.length - 1].title).toBe('Old post')
  })

  it('空数组应返回空数组', () => {
    const sorted = sortPostsWithSticky([])
    expect(sorted).toEqual([])
  })
})
