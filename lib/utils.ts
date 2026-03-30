import { sortPosts } from 'pliny/utils/contentlayer'

/**
 * Sort posts with sticky posts first (by sticky value ascending),
 * then remaining posts by date descending.
 */
export function sortPostsWithSticky<T extends { date: string; sticky?: number | null }>(
  posts: T[]
): T[] {
  const stickyPosts = posts.filter((p) => p.sticky != null).sort((a, b) => a.sticky! - b.sticky!)
  const normalPosts = posts.filter((p) => p.sticky == null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sortedNormal = sortPosts(normalPosts as any)
  return [...stickyPosts, ...sortedNormal] as T[]
}
