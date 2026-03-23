interface Project {
  title: string
  description: string
  href?: string
  imgSrc?: string
}

const projectsData: Project[] = [
  {
    title: 'AI Blog',
    description: `A modern blog powered by Next.js and Tencent Hunyuan AI, featuring AI-generated summaries, semantic search, Q&A, and auto-generated cover images.`,
    href: 'https://github.com/Corner430/ai-blog',
  },
]

export default projectsData
