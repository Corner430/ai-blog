import { allCoreContent } from 'pliny/utils/contentlayer'
import { sortPostsWithSticky } from '@/lib/utils'
import { allBlogs } from 'contentlayer/generated'
import Main from './Main'

export default async function Page() {
  const sortedPosts = sortPostsWithSticky(allBlogs)
  const posts = allCoreContent(sortedPosts)
  return <Main posts={posts} />
}
