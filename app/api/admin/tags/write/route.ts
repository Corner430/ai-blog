import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'

const BLOG_DIR = path.join(process.cwd(), 'data', 'blog')

export async function POST(request: Request) {
  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }
  const { filename, tags } = body

  if (!filename || typeof filename !== 'string') {
    return NextResponse.json({ error: 'filename is required' }, { status: 400 })
  }

  if (!tags || !Array.isArray(tags)) {
    return NextResponse.json({ error: 'tags is required and must be an array' }, { status: 400 })
  }

  // Security: only accept .mdx files without path traversal
  if (!filename.endsWith('.mdx') || filename.includes('/') || filename.includes('\\') || filename.includes('..')) {
    return NextResponse.json({ error: 'Invalid filename. Only .mdx files are accepted.' }, { status: 400 })
  }

  const filePath = path.join(BLOG_DIR, filename)

  if (!fs.existsSync(filePath)) {
    return NextResponse.json({ error: 'File not found' }, { status: 404 })
  }

  try {
    const fileContent = fs.readFileSync(filePath, 'utf-8')
    const { data, content } = matter(fileContent)

    data.tags = tags
    const newContent = matter.stringify(content, data)
    fs.writeFileSync(filePath, newContent, 'utf-8')

    return NextResponse.json({ success: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
