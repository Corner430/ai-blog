'use client'

import Link from 'next/link'

const features = [
  {
    name: '封面图生成',
    description: '输入文章标题和摘要，AI 自动生成精美封面图',
    href: '/admin/cover',
  },
  {
    name: '自动标签',
    description: '基于文章内容自动生成标签建议，一键写入 frontmatter',
    href: '/admin/tags',
  },
  {
    name: '写作助手',
    description: 'AI 驱动的文本润色和续写，提升写作效率',
    href: '/admin/writing',
  },
]

export default function AdminPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-3xl leading-9 font-bold tracking-tight text-gray-900 sm:text-4xl sm:leading-10 md:text-5xl md:leading-14 dark:text-gray-100">
        管理中心
      </h1>
      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((feature) => (
          <Link
            key={feature.href}
            href={feature.href}
            className="hover:border-primary-500 dark:hover:border-primary-400 block rounded-lg border border-gray-200 p-6 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
          >
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {feature.name}
            </h2>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{feature.description}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
