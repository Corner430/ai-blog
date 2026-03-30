import Link from '@/components/Link'
import siteMetadata from '@/data/siteMetadata'

interface CopyrightDeclarationProps {
  title: string
  slug: string
}

const isZh = siteMetadata.language?.startsWith('zh')

const i18n = {
  heading: isZh ? '版权声明' : 'Copyright Notice',
  author: isZh ? '作者' : 'Author',
  titleLabel: isZh ? '标题' : 'Title',
  link: isZh ? '链接' : 'Link',
  license: isZh ? '许可协议' : 'License',
  notice: isZh
    ? '除非另有说明，本文内容采用 CC BY-NC-SA 4.0 许可协议。转载请注明出处。'
    : 'Unless otherwise noted, this content is licensed under CC BY-NC-SA 4.0. Please attribute when sharing.',
}

export default function CopyrightDeclaration({ title, slug }: CopyrightDeclarationProps) {
  const postUrl = `${siteMetadata.siteUrl}/blog/${slug}`

  return (
    <div className="mt-8 rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600 dark:border-gray-700 dark:bg-gray-800/50 dark:text-gray-400">
      <p className="font-medium text-gray-900 dark:text-gray-100">{i18n.heading}</p>
      <ul className="mt-2 space-y-1">
        <li>
          <strong>{i18n.author}:</strong> {siteMetadata.author}
        </li>
        <li>
          <strong>{i18n.titleLabel}:</strong> {title}
        </li>
        <li>
          <strong>{i18n.link}:</strong>{' '}
          <Link
            href={postUrl}
            className="text-primary-500 hover:text-primary-600 dark:hover:text-primary-400 break-all"
          >
            {postUrl}
          </Link>
        </li>
        <li>
          <strong>{i18n.license}:</strong>{' '}
          <Link
            href="https://creativecommons.org/licenses/by-nc-sa/4.0/"
            className="text-primary-500 hover:text-primary-600 dark:hover:text-primary-400"
          >
            CC BY-NC-SA 4.0
          </Link>
        </li>
      </ul>
      <p className="mt-2 text-xs">{i18n.notice}</p>
    </div>
  )
}
