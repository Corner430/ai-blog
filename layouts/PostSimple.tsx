import { ReactNode } from 'react'
import { formatDate } from 'pliny/utils/formatDate'
import { CoreContent } from 'pliny/utils/contentlayer'
import type { Blog } from 'contentlayer/generated'
import Comments from '@/components/Comments'
import Link from '@/components/Link'
import PageTitle from '@/components/PageTitle'
import SectionContainer from '@/components/SectionContainer'
import siteMetadata from '@/data/siteMetadata'
import ScrollTopAndComment from '@/components/ScrollTopAndComment'
import ReadingProgressBar from '@/components/ReadingProgressBar'
import FloatingTOC from '@/components/FloatingTOC'
import AiSummary from '@/components/ai/AiSummary'
import AiChat from '@/components/ai/AiChat'
import CopyrightDeclaration from '@/components/CopyrightDeclaration'
import ImageZoom from '@/components/ImageZoom'
import PageViewCounter from '@/components/PageViewCounter'

interface LayoutProps {
  content: CoreContent<Blog>
  children: ReactNode
  next?: { path: string; title: string }
  prev?: { path: string; title: string }
  articleRawContent?: string
}

export default function PostLayout({
  content,
  next,
  prev,
  children,
  articleRawContent,
}: LayoutProps) {
  const { path, slug, date, title, readingTime } = content
  const articleContent = articleRawContent || ''
  const aiEnabled = !!process.env.NEXT_PUBLIC_AI_ENABLED

  return (
    <SectionContainer>
      <ReadingProgressBar />
      <FloatingTOC toc={content.toc} />
      <ScrollTopAndComment />
      <article>
        <div>
          <header>
            <div className="space-y-1 border-b border-gray-200 pb-10 text-center dark:border-gray-700">
              <dl>
                <div>
                  <dt className="sr-only">发布于</dt>
                  <dd className="text-base leading-6 font-medium text-gray-500 dark:text-gray-400">
                    <time dateTime={date}>{formatDate(date, siteMetadata.locale)}</time>
                  </dd>
                </div>
              </dl>
              <dd className="text-sm leading-6 text-gray-500 dark:text-gray-400">
                {readingTime.words} 字 · {Math.ceil(readingTime.minutes)} 分钟
              </dd>
              <PageViewCounter slug={slug} />
              <div>
                <PageTitle>{title}</PageTitle>
              </div>
            </div>
          </header>
          {aiEnabled && <AiSummary slug={slug} content={articleContent} />}
          <div className="grid-rows-[auto_1fr] divide-y divide-gray-200 pb-8 xl:divide-y-0 dark:divide-gray-700">
            <div className="divide-y divide-gray-200 xl:col-span-3 xl:row-span-2 xl:pb-0 dark:divide-gray-700">
              <div className="prose dark:prose-invert max-w-none pt-10 pb-8">{children}</div>
              <ImageZoom />
              <CopyrightDeclaration title={title} slug={slug} />
            </div>
            {siteMetadata.comments && (
              <div className="pt-6 pb-6 text-center text-gray-700 dark:text-gray-300" id="comment">
                <Comments slug={slug} />
              </div>
            )}
            <footer>
              <div className="flex flex-col text-sm font-medium sm:flex-row sm:justify-between sm:text-base">
                {prev && prev.path && (
                  <div className="pt-4 xl:pt-8">
                    <Link
                      href={`/${prev.path}`}
                      className="text-primary-500 hover:text-primary-600 dark:hover:text-primary-400"
                      aria-label={`上一篇：${prev.title}`}
                    >
                      &larr; {prev.title}
                    </Link>
                  </div>
                )}
                {next && next.path && (
                  <div className="pt-4 xl:pt-8">
                    <Link
                      href={`/${next.path}`}
                      className="text-primary-500 hover:text-primary-600 dark:hover:text-primary-400"
                      aria-label={`下一篇：${next.title}`}
                    >
                      {next.title} &rarr;
                    </Link>
                  </div>
                )}
              </div>
            </footer>
          </div>
        </div>
      </article>
      {aiEnabled && <AiChat slug={slug} articleContent={articleContent} />}
    </SectionContainer>
  )
}
