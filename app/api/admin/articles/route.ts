import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'

const BLOG_DIR = path.join(process.cwd(), 'data', 'blog')

export async function GET() {
  try {
    const files = fs.readdirSync(BLOG_DIR).filter((f) => f.endsWith('.mdx'))

    const articles = files.map((filename) => {
      const filePath = path.join(BLOG_DIR, filename)
      const fileContent = fs.readFileSync(filePath, 'utf-8')
      const { data, content } = matter(fileContent)

      return {
        filename,
        title: (data.title as string) || '',
        summary: (data.summary as string) || '',
        tags: (data.tags as string[]) || [],
        content,
      }
    })

    return NextResponse.json({ articles })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
