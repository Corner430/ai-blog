import { ReactNode } from 'react'
import Image from '@/components/Image'
import Bleed from 'pliny/ui/Bleed'
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

export default function PostMinimal({
  content,
  next,
  prev,
  children,
  articleRawContent,
}: LayoutProps) {
  const { slug, title, images, readingTime } = content
  const articleContent = articleRawContent || ''
  const aiEnabled = !!process.env.NEXT_PUBLIC_AI_ENABLED
  const displayImage =
    images && images.length > 0 ? images[0] : 'https://picsum.photos/seed/picsum/800/400'

  return (
    <SectionContainer>
      <ReadingProgressBar />
      <FloatingTOC toc={content.toc} />
      <ScrollTopAndComment />
      <article>
        <div>
          <div className="space-y-1 pb-10 text-center dark:border-gray-700">
            <div className="w-full">
              <Bleed>
                <div className="relative aspect-2/1 w-full">
                  <Image src={displayImage} alt={title} fill className="object-cover" />
                </div>
              </Bleed>
            </div>
            <div className="relative pt-10">
              <PageTitle>{title}</PageTitle>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {readingTime.words} 字 · {Math.ceil(readingTime.minutes)} 分钟
            </p>
            <PageViewCounter slug={slug} />
          </div>
          {aiEnabled && <AiSummary slug={slug} content={articleContent} />}
          <div className="prose dark:prose-invert max-w-none py-4">{children}</div>
          <ImageZoom />
          <CopyrightDeclaration title={title} slug={slug} />
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
      </article>
      {aiEnabled && <AiChat slug={slug} articleContent={articleContent} />}
    </SectionContainer>
  )
}
