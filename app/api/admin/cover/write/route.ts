import { NextResponse } from 'next/server'
import matter from 'gray-matter'

const GITHUB_OWNER = 'Corner430'
const GITHUB_REPO = 'ai-blog'
const BLOG_PATH_PREFIX = 'data/blog'

export async function POST(request: Request) {
  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }
  const { filename, imageUrl } = body

  if (!filename || typeof filename !== 'string') {
    return NextResponse.json({ error: 'filename is required' }, { status: 400 })
  }

  if (!imageUrl || typeof imageUrl !== 'string') {
    return NextResponse.json({ error: 'imageUrl is required' }, { status: 400 })
  }

  if (
    !filename.endsWith('.mdx') ||
    filename.includes('/') ||
    filename.includes('\\') ||
    filename.includes('..')
  ) {
    return NextResponse.json(
      { error: 'Invalid filename. Only .mdx files are accepted.' },
      { status: 400 }
    )
  }

  const githubToken = process.env.GITHUB_TOKEN
  if (!githubToken) {
    return NextResponse.json({ error: 'GITHUB_TOKEN not configured' }, { status: 500 })
  }

  const filePath = `${BLOG_PATH_PREFIX}/${filename}`
  const apiUrl = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${filePath}`

  try {
    // Get the current file from GitHub
    const getRes = await fetch(apiUrl, {
      headers: {
        Authorization: `Bearer ${githubToken}`,
        Accept: 'application/vnd.github.v3+json',
      },
    })

    if (!getRes.ok) {
      if (getRes.status === 404) {
        return NextResponse.json({ error: 'File not found' }, { status: 404 })
      }
      const text = await getRes.text()
      throw new Error(`GitHub API error (${getRes.status}): ${text}`)
    }

    const fileData = await getRes.json()
    const fileContent = Buffer.from(fileData.content, 'base64').toString('utf-8')
    const sha = fileData.sha

    // Update the images field in frontmatter
    const { data, content } = matter(fileContent)
    data.images = [imageUrl]
    const newContent = matter.stringify(content, data)

    // Commit the updated file via GitHub API
    const putRes = await fetch(apiUrl, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${githubToken}`,
        Accept: 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: `feat: set cover image for ${filename}`,
        content: Buffer.from(newContent).toString('base64'),
        sha,
      }),
    })

    if (!putRes.ok) {
      const text = await putRes.text()
      throw new Error(`GitHub commit failed (${putRes.status}): ${text}`)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
