import { readFileSync, writeFileSync, existsSync } from 'fs'
import { createHash } from 'crypto'
import { join } from 'path'
import OpenAI from 'openai'

const HUNYUAN_API_KEY = process.env.HUNYUAN_API_KEY
const OUTPUT_PATH = join(process.cwd(), 'public', 'embedding-index.json')
const MAX_RETRIES = 3

/**
 * Compute a short hash for article content to detect changes.
 */
function contentHash(text) {
  return createHash('md5').update(text).digest('hex')
}

/**
 * Generate or incrementally update the embedding index.
 * Accepts an optional allBlogs array (from Contentlayer onSuccess).
 * If not provided, reads from .contentlayer/generated/Blog/_index.json.
 */
export async function generateEmbeddings(allBlogs) {
  if (!HUNYUAN_API_KEY) {
    console.warn('[generate-embeddings] HUNYUAN_API_KEY not set, skipping embedding generation')
    if (!existsSync(OUTPUT_PATH)) {
      writeFileSync(OUTPUT_PATH, JSON.stringify({ articles: [] }))
    }
    return
  }

  // If allBlogs not passed, try loading from contentlayer output
  if (!allBlogs) {
    const dataPath = join(process.cwd(), '.contentlayer', 'generated', 'Blog', '_index.json')
    if (!existsSync(dataPath)) {
      console.warn('[generate-embeddings] No contentlayer data found, skipping')
      if (!existsSync(OUTPUT_PATH)) {
        writeFileSync(OUTPUT_PATH, JSON.stringify({ articles: [] }))
      }
      return
    }
    allBlogs = JSON.parse(readFileSync(dataPath, 'utf-8'))
  }

  // Load existing index for incremental updates
  let existingIndex = { articles: [] }
  if (existsSync(OUTPUT_PATH)) {
    try {
      existingIndex = JSON.parse(readFileSync(OUTPUT_PATH, 'utf-8'))
    } catch {
      existingIndex = { articles: [] }
    }
  }

  // Build a map of existing embeddings by slug (with content hash)
  const existingMap = new Map()
  for (const article of existingIndex.articles) {
    if (article.slug && article.embedding) {
      existingMap.set(article.slug, article)
    }
  }

  const client = new OpenAI({
    apiKey: HUNYUAN_API_KEY,
    baseURL: 'https://api.hunyuan.cloud.tencent.com/v1',
  })

  // Collect current blog slugs for removal detection
  const currentSlugs = new Set()
  const articles = []
  let reused = 0
  let generated = 0
  let failed = 0

  for (const blog of allBlogs) {
    const slug = blog.slug || blog._raw?.flattenedPath?.replace(/^.+?(\/)/, '')
    const title = blog.title || ''
    const summary = blog.summary || ''
    const bodyRaw = blog.body?.raw || ''
    const bodySnippet = bodyRaw.slice(0, 500)
    const text = `${title} ${summary} ${bodySnippet}`.trim()

    if (!text || !slug) {
      continue
    }

    currentSlugs.add(slug)
    const hash = contentHash(text)

    // Check if we can reuse existing embedding (same slug + same content hash)
    const existing = existingMap.get(slug)
    if (existing && existing.contentHash === hash) {
      articles.push(existing)
      reused++
      continue
    }

    // Need to generate new embedding
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
      articles.push({ slug, title, summary, embedding, contentHash: hash })
      generated++
      console.log(`[generate-embeddings] \u2713 ${slug}`)
    } else {
      // Keep old embedding if API fails (graceful degradation)
      if (existing) {
        articles.push(existing)
        console.warn(`[generate-embeddings] API failed for "${slug}", keeping old embedding`)
      } else {
        console.error(`[generate-embeddings] \u2717 Failed to generate embedding for "${slug}"`)
      }
      failed++
    }
  }

  // Detect removed articles
  const removed = existingIndex.articles.filter((a) => !currentSlugs.has(a.slug)).length

  writeFileSync(OUTPUT_PATH, JSON.stringify({ articles }))
  console.log(
    `[generate-embeddings] Done. ${articles.length} articles indexed ` +
      `(${reused} reused, ${generated} new, ${failed} failed, ${removed} removed)`
  )
}

// When run as standalone script (e.g., from package.json build)
const isMainModule =
  process.argv[1] && import.meta.url.endsWith(process.argv[1].replace(/\\/g, '/'))
if (isMainModule || (!process.argv[1] && import.meta.url.includes('generate-embeddings'))) {
  generateEmbeddings(null).catch((err) => {
    console.error('[generate-embeddings] Fatal error:', err.message)
    if (!existsSync(OUTPUT_PATH)) {
      writeFileSync(OUTPUT_PATH, JSON.stringify({ articles: [] }))
    }
  })
}
