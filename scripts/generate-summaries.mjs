import fs from 'fs'
import path from 'path'
import OpenAI from 'openai'

// --- Config ---
const BLOG_DIR = path.resolve(new URL('.', import.meta.url).pathname, '../data/blog')
const ENV_FILE = path.resolve(new URL('.', import.meta.url).pathname, '../.env.local')
const HUNYUAN_BASE_URL = 'https://api.hunyuan.cloud.tencent.com/v1'
const HUNYUAN_MODEL = 'hunyuan-2.0-thinking-20251109'
const SYSTEM_PROMPT =
  '你是一个博客文章摘要助手。请根据提供的文章内容，生成2-3句简洁的中文摘要，概括文章的核心观点和要点。摘要应当精炼、准确，不超过150字。'
const MAX_BODY_CHARS = 3000
const DELAY_MS = 1000
const SKIP_FILES = new Set(['hello-world.mdx'])
const SKIP_FIRST = parseInt(process.env.SKIP_FIRST || '0', 10)

// --- Parse .env.local ---
function loadEnv(filepath) {
  const content = fs.readFileSync(filepath, 'utf-8')
  const env = {}
  for (const line of content.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eqIdx = trimmed.indexOf('=')
    if (eqIdx === -1) continue
    const key = trimmed.slice(0, eqIdx).trim()
    const value = trimmed.slice(eqIdx + 1).trim()
    env[key] = value
  }
  return env
}

// --- Parse frontmatter ---
function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/)
  if (!match) return null
  return { raw: match[1], body: match[2] }
}

// --- Escape summary for YAML single-quoted string ---
function yamlEscape(str) {
  // Remove newlines, trim
  const clean = str.replace(/\n/g, ' ').trim()
  // Double any single quotes for YAML single-quoted scalar
  return clean.replace(/'/g, "''")
}

// --- Replace or add summary in frontmatter ---
function replaceSummary(rawFrontmatter, newSummary) {
  const escaped = yamlEscape(newSummary)
  const summaryLine = `summary: '${escaped}'`

  if (/^summary:.*$/m.test(rawFrontmatter)) {
    return rawFrontmatter.replace(/^summary:.*$/m, summaryLine)
  } else {
    // Add summary before the last line
    return rawFrontmatter + '\n' + summaryLine
  }
}

// --- Main ---
async function main() {
  // Load env
  const env = loadEnv(ENV_FILE)
  const apiKey = env.HUNYUAN_API_KEY
  if (!apiKey) {
    console.error('Error: HUNYUAN_API_KEY not found in .env.local')
    process.exit(1)
  }

  const client = new OpenAI({
    apiKey,
    baseURL: HUNYUAN_BASE_URL,
  })

  // List MDX files
  const allFiles = fs.readdirSync(BLOG_DIR).filter((f) => f.endsWith('.mdx'))
  const files = allFiles.filter((f) => !SKIP_FILES.has(f))
  const total = files.length

  if (SKIP_FIRST > 0) {
    console.log(
      `Found ${allFiles.length} MDX files, processing ${total - SKIP_FIRST} (skipping first ${SKIP_FIRST} already done + ${SKIP_FILES.size} excluded)`
    )
  } else {
    console.log(
      `Found ${allFiles.length} MDX files, processing ${total} (skipping ${SKIP_FILES.size})`
    )
  }
  console.log()

  let succeeded = 0
  let failed = 0
  const failures = []

  for (let i = SKIP_FIRST; i < files.length; i++) {
    const filename = files[i]
    const filepath = path.join(BLOG_DIR, filename)
    const label = filename.replace('.mdx', '')

    try {
      const content = fs.readFileSync(filepath, 'utf-8')
      const parsed = parseFrontmatter(content)

      if (!parsed) {
        console.log(`[${i + 1}/${total}] ${label} — skipped (no frontmatter)`)
        failed++
        failures.push({ file: filename, error: 'No frontmatter found' })
        continue
      }

      // Truncate body for API
      const bodyForApi = parsed.body.slice(0, MAX_BODY_CHARS)

      // Call Hunyuan API
      const response = await client.chat.completions.create({
        model: HUNYUAN_MODEL,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: bodyForApi },
        ],
      })

      const summary = response.choices[0]?.message?.content?.trim()
      if (!summary) {
        console.log(`[${i + 1}/${total}] ${label} — failed (empty response)`)
        failed++
        failures.push({ file: filename, error: 'Empty API response' })
      } else {
        // Replace summary in frontmatter
        const newFrontmatter = replaceSummary(parsed.raw, summary)
        const newContent = `---\n${newFrontmatter}\n---\n${parsed.body}`
        fs.writeFileSync(filepath, newContent, 'utf-8')

        console.log(`[${i + 1}/${total}] ${label} — done (${summary.length} chars)`)
        succeeded++
      }
    } catch (err) {
      console.log(`[${i + 1}/${total}] ${label} — error: ${err.message}`)
      failed++
      failures.push({ file: filename, error: err.message })
    }

    // Delay between API calls
    if (i < files.length - 1) {
      await new Promise((r) => setTimeout(r, DELAY_MS))
    }
  }

  console.log()
  console.log('=== Summary ===')
  console.log(`Total: ${total}`)
  console.log(`Succeeded: ${succeeded}`)
  console.log(`Failed: ${failed}`)

  if (failures.length > 0) {
    console.log('\nFailed files:')
    for (const f of failures) {
      console.log(`  - ${f.file}: ${f.error}`)
    }
  }
}

main().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})
