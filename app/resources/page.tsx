import resourcesData from '@/data/resourcesData'
import Card from '@/components/Card'
import { genPageMetadata } from 'app/seo'

export const metadata = genPageMetadata({ title: '推荐资源' })

export default function Resources() {
  return (
    <>
      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        <div className="space-y-2 pt-6 pb-8 md:space-y-5">
          <h1 className="text-3xl leading-9 font-extrabold tracking-tight text-gray-900 sm:text-4xl sm:leading-10 md:text-6xl md:leading-14 dark:text-gray-100">
            推荐资源
          </h1>
          <p className="text-lg leading-7 text-gray-500 dark:text-gray-400">
            精选的学习资源、开发工具和优质内容推荐
          </p>
        </div>
        <div className="container py-12">
          {resourcesData.map((category) => (
            <div key={category.title} className="mb-12 last:mb-0">
              <h2 className="mb-6 text-2xl leading-8 font-bold tracking-tight text-gray-900 dark:text-gray-100">
                {category.icon} {category.title}
              </h2>
              <div className="-m-4 flex flex-wrap">
                {category.items.map((item) => (
                  <Card
                    key={item.title}
                    title={item.title}
                    description={item.description}
                    href={item.url}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
