import { readFileSync, writeFileSync, existsSync } from 'fs'
import { join } from 'path'
import OpenAI from 'openai'

const HUNYUAN_API_KEY = process.env.HUNYUAN_API_KEY
const OUTPUT_PATH = join(process.cwd(), 'public', 'embedding-index.json')
const MAX_RETRIES = 3

async function main() {
  if (!HUNYUAN_API_KEY) {
    console.warn('[generate-embeddings] HUNYUAN_API_KEY not set, skipping embedding generation')
    // Write empty index so search gracefully degrades
    writeFileSync(OUTPUT_PATH, JSON.stringify({ articles: [] }))
    return
  }

  const client = new OpenAI({
    apiKey: HUNYUAN_API_KEY,
    baseURL: 'https://api.hunyuan.cloud.tencent.com/v1',
  })

  // Try to load contentlayer generated data
  const dataPath = join(process.cwd(), '.contentlayer', 'generated', 'Blog', '_index.json')
  if (!existsSync(dataPath)) {
    console.warn('[generate-embeddings] No contentlayer data found, skipping')
    writeFileSync(OUTPUT_PATH, JSON.stringify({ articles: [] }))
    return
  }

  const blogs = JSON.parse(readFileSync(dataPath, 'utf-8'))
  console.log(`[generate-embeddings] Processing ${blogs.length} articles...`)

  const articles = []

  for (const blog of blogs) {
    const slug = blog.slug || blog._raw?.flattenedPath
    const title = blog.title || ''
    const summary = blog.summary || ''
    const bodyRaw = blog.body?.raw || ''
    // Include first 500 chars of body for better search quality
    const bodySnippet = bodyRaw.slice(0, 500)
    const text = `${title} ${summary} ${bodySnippet}`.trim()

    if (!text) {
      console.warn(`[generate-embeddings] Skipping article with no title/summary: ${slug}`)
      continue
    }

    let embedding = null
    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        const resp = await client.embeddings.create({
          model: 'hunyuan-embedding',
          input: text,
          encoding_format: 'float',
        })
        embedding = resp.data[0].embedding
        break
      } catch (err) {
        console.warn(
          `[generate-embeddings] Retry ${attempt + 1}/${MAX_RETRIES} for "${slug}": ${err.message}`
        )
        if (attempt < MAX_RETRIES - 1) {
          await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)))
        }
      }
    }

    if (embedding) {
      articles.push({ slug, title, summary, embedding })
      console.log(`[generate-embeddings] ✓ ${slug}`)
    } else {
      console.error(`[generate-embeddings] ✗ Failed to generate embedding for "${slug}"`)
    }
  }

  writeFileSync(OUTPUT_PATH, JSON.stringify({ articles }))
  console.log(`[generate-embeddings] Done. ${articles.length}/${blogs.length} articles indexed.`)
}

main().catch((err) => {
  console.error('[generate-embeddings] Fatal error:', err.message)
  // Don't block build
  writeFileSync(OUTPUT_PATH, JSON.stringify({ articles: [] }))
})
