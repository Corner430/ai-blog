import Image from '@/components/Image'
import Link from '@/components/Link'
import Tag from '@/components/Tag'
import siteMetadata from '@/data/siteMetadata'
import { formatDate } from 'pliny/utils/formatDate'

const MAX_DISPLAY = 5

export default function Home({ posts }) {
  return (
    <>
      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        <div className="space-y-2 pt-6 pb-8 md:space-y-5">
          <h1 className="text-3xl leading-9 font-extrabold tracking-tight text-gray-900 sm:text-4xl sm:leading-10 md:text-6xl md:leading-14 dark:text-gray-100">
            最新文章
          </h1>
          <p className="text-lg leading-7 text-gray-500 dark:text-gray-400">
            {siteMetadata.description}
          </p>
        </div>
        <ul className="divide-y divide-gray-200 dark:divide-gray-700">
          {!posts.length && '暂无文章'}
          {posts.slice(0, MAX_DISPLAY).map((post) => {
            const { slug, date, title, summary, tags, readingTime, sticky, images } = post
            const coverImage =
              images && Array.isArray(images) && images.length > 0 ? images[0] : null
            return (
              <li key={slug} className="py-12">
                <article>
                  <div className="flex flex-col gap-6 sm:flex-row">
                    <Link href={`/blog/${slug}`} className="shrink-0 self-start" aria-label={title}>
                      {coverImage ? (
                        <Image
                          src={coverImage}
                          alt={title}
                          width={192}
                          height={128}
                          className="h-40 w-full rounded-md object-cover sm:h-32 sm:w-48"
                        />
                      ) : (
                        <div className="flex h-40 w-full items-center justify-center rounded-md bg-gray-100 sm:h-32 sm:w-48 dark:bg-gray-800">
                          <svg
                            className="h-10 w-10 text-gray-300 dark:text-gray-600"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={1.5}
                              d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z"
                            />
                          </svg>
                        </div>
                      )}
                    </Link>
                    <div className="flex flex-1 flex-col justify-between">
                      <div className="space-y-3">
                        <div>
                          <h2 className="text-2xl leading-8 font-bold tracking-tight">
                            {sticky != null && (
                              <span
                                className="text-primary-500 mr-1 inline-flex align-middle"
                                title="置顶"
                              >
                                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                                  <path d="M16 12V4h1V2H7v2h1v8l-2 2v2h5.2v6h1.6v-6H18v-2l-2-2z" />
                                </svg>
                              </span>
                            )}
                            <Link
                              href={`/blog/${slug}`}
                              className="text-gray-900 dark:text-gray-100"
                            >
                              {title}
                            </Link>
                          </h2>
                          <div className="flex flex-wrap">
                            {tags.map((tag) => (
                              <Tag key={tag} text={tag} />
                            ))}
                          </div>
                        </div>
                        <div className="prose max-w-none text-gray-500 dark:text-gray-400">
                          {summary}
                        </div>
                      </div>
                      <div className="mt-3 flex items-center justify-between">
                        <dl>
                          <dt className="sr-only">发布于</dt>
                          <dd className="text-sm leading-6 font-medium text-gray-500 dark:text-gray-400">
                            <time dateTime={date}>{formatDate(date, siteMetadata.locale)}</time>
                            <span className="mx-1">·</span>
                            {readingTime.words} 字 · {Math.ceil(readingTime.minutes)} 分钟
                          </dd>
                        </dl>
                        <Link
                          href={`/blog/${slug}`}
                          className="text-primary-500 hover:text-primary-600 dark:hover:text-primary-400 text-sm font-medium"
                          aria-label={`阅读更多：「${title}」`}
                        >
                          阅读更多 &rarr;
                        </Link>
                      </div>
                    </div>
                  </div>
                </article>
              </li>
            )
          })}
        </ul>
      </div>
      {posts.length > MAX_DISPLAY && (
        <div className="flex justify-end text-base leading-6 font-medium">
          <Link
            href="/blog"
            className="text-primary-500 hover:text-primary-600 dark:hover:text-primary-400"
            aria-label="全部文章"
          >
            全部文章 &rarr;
          </Link>
        </div>
      )}
    </>
  )
}
