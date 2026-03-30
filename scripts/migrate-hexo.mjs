import fs from 'fs'
import path from 'path'
import TurndownService from 'turndown'

const OLD_BLOG_DIR = path.resolve('../corner430.github.io')
const CONTENT_JSON = path.join(OLD_BLOG_DIR, 'content.json')
const OUTPUT_DIR = path.resolve('data/blog')
const IMAGE_OUTPUT_DIR = path.resolve('public/static/images/blog')

// Tag normalization map (lowercase → canonical form)
const TAG_NORMALIZATION = {
  hexo: 'Hexo',
  wsl: 'WSL',
  windows: 'Windows',
}

// Image filename mapping (Chinese → ASCII-safe)
const IMAGE_RENAME_MAP = {
  'HTML标签验证.png': 'html-tag-verification.png',
  '准入密钥获取.png': 'access-key-acquisition.png',
  '效果图1.png': 'effect-screenshot-1.png',
  '效果图2.png': 'effect-screenshot-2.png',
  '添加CNAME.png': 'add-cname.png',
  '绑定到page.png': 'bindto-page.png',
  '2005哈尔滨工程大学数据库试卷A_1.png': 'heu-2005-db-exam-a1.png',
  '2005哈尔滨工程大学数据库试卷A_2.png': 'heu-2005-db-exam-a2.png',
  'TCP面向流的传输.png': 'tcp-stream-transport.png',
  '传递过程.png': 'delivery-process.png',
  '计算机网络体系结构.png': 'network-architecture.png',
  'PicGo_setting.png': 'PicGo_setting.png',
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function normalizeTag(tagName) {
  const lower = tagName.toLowerCase()
  if (TAG_NORMALIZATION[lower]) return TAG_NORMALIZATION[lower]
  return tagName
}

function extractSlug(postPath) {
  // postPath looks like "2024/08/21/秋招正式批/"
  const segments = postPath.replace(/\/+$/, '').split('/')
  return segments[segments.length - 1]
}

function formatDate(isoDate) {
  return new Date(isoDate).toISOString().split('T')[0]
}

function decodeHtmlEntities(text) {
  const entities = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#39;': "'",
    '&#x27;': "'",
    '&#x2F;': '/',
    '&#x3D;': '=',
    '&#123;': '{',
    '&#125;': '}',
    '&nbsp;': ' ',
  }
  let result = text
  for (const [entity, char] of Object.entries(entities)) {
    result = result.split(entity).join(char)
  }
  // Handle numeric entities
  result = result.replace(/&#(\d+);/g, (_, num) => String.fromCharCode(parseInt(num, 10)))
  result = result.replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
  return result
}

function extractArticleBody(html) {
  const startMarker = '<div class="article-entry" itemprop="articleBody">'
  const endMarker = '<div class="essayending">'
  const startIdx = html.indexOf(startMarker)
  if (startIdx === -1) return null
  const contentStart = startIdx + startMarker.length
  const endIdx = html.indexOf(endMarker, contentStart)
  if (endIdx === -1) return null
  return html.substring(contentStart, endIdx).trim()
}

function generateSummary(markdown) {
  // Strip frontmatter-like content, headings, code blocks, images, links markup
  let text = markdown
    .replace(/```[\s\S]*?```/g, '') // code blocks
    .replace(/!\[.*?\]\(.*?\)/g, '') // images
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1') // links → text
    .replace(/^#{1,6}\s+/gm, '') // headings
    .replace(/[*_~`]/g, '') // bold/italic/strike
    .replace(/\|[^\n]+\|/g, '') // table rows
    .replace(/-{3,}/g, '') // horizontal rules
    .replace(/\n{2,}/g, '\n')
    .trim()

  // Take first ~200 characters, break at word boundary
  if (text.length > 200) {
    text = text.substring(0, 200)
    const lastSpace = text.lastIndexOf(' ')
    const lastChinese = text.search(/[\u4e00-\u9fff][^\u4e00-\u9fff]*$/)
    const breakPoint = Math.max(lastSpace, lastChinese)
    if (breakPoint > 100) text = text.substring(0, breakPoint)
    text += '...'
  }

  return text.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim()
}

function escapeYamlString(str) {
  // If it contains special chars, wrap in single quotes with escaped single quotes
  if (/[:'"\n\r#[\]{}|>&*!?@`]/.test(str) || str.startsWith(' ') || str.endsWith(' ')) {
    return "'" + str.replace(/'/g, "''") + "'"
  }
  return "'" + str + "'"
}

// ---------------------------------------------------------------------------
// Image path mapping: old URL → new path
// ---------------------------------------------------------------------------

function buildImagePathMap(postPath) {
  // For local images like /2021/06/01/Configure-Hexo/xxx.png
  // We need to map them to /static/images/blog/xxx.png (with renamed files)
  const map = {}
  const decodedPath = decodeURIComponent(postPath.replace(/\/+$/, ''))

  // Check if there are actual image files alongside this post's index.html
  const postDir = path.join(OLD_BLOG_DIR, postPath)
  if (fs.existsSync(postDir)) {
    const files = fs.readdirSync(postDir)
    for (const file of files) {
      if (/\.(png|jpg|jpeg|gif|webp|svg)$/i.test(file) && file !== 'index.html') {
        const newName = IMAGE_RENAME_MAP[file] || file
        // The src in HTML will be URL-encoded, like /%E6%B7%BB%E5%8A%A0CNAME.png
        // Build both encoded and decoded forms for matching
        const encodedSrc = '/' + postPath + encodeURIComponent(file)
        const decodedSrc = '/' + postPath + file
        const altDecodedSrc = '/' + decodedPath + '/' + file

        map[encodedSrc] = '/static/images/blog/' + newName
        map[decodedSrc] = '/static/images/blog/' + newName
        map[altDecodedSrc] = '/static/images/blog/' + newName
        // Also store with URL-encoded path segments
        const parts = postPath.split('/')
        const encodedPath = parts.map((p) => encodeURIComponent(p)).join('/')
        map['/' + encodedPath + encodeURIComponent(file)] = '/static/images/blog/' + newName
      }
    }
  }
  return map
}

// ---------------------------------------------------------------------------
// Turndown setup with custom rules
// ---------------------------------------------------------------------------

function createTurndownService() {
  const td = new TurndownService({
    headingStyle: 'atx',
    codeBlockStyle: 'fenced',
    bulletListMarker: '-',
    emDelimiter: '*',
    strongDelimiter: '**',
    hr: '---',
  })

  // Rule: Hexo code blocks (<figure class="highlight {lang}">)
  td.addRule('hexoCodeBlock', {
    filter: function (node) {
      return (
        node.nodeName === 'FIGURE' &&
        node.getAttribute('class') &&
        node.getAttribute('class').startsWith('highlight')
      )
    },
    replacement: function (content, node) {
      const classAttr = node.getAttribute('class') || ''
      // Extract language from class="highlight yml" etc.
      const langMatch = classAttr.match(/highlight\s+(\S+)/)
      const lang = langMatch ? langMatch[1] : ''

      // Extract code from <td class="code"><pre>...</pre></td>
      const codeCell = node.querySelector('td.code pre')
      if (!codeCell) return content

      // Get all <span class="line"> elements and extract their text
      const lines = codeCell.querySelectorAll('span.line')
      let codeText
      if (lines.length > 0) {
        codeText = Array.from(lines)
          .map((line) => extractTextFromNode(line))
          .join('\n')
      } else {
        // Fallback: just get text content
        codeText = extractTextFromNode(codeCell)
      }

      // Decode HTML entities
      codeText = decodeHtmlEntities(codeText)

      return '\n\n```' + lang + '\n' + codeText + '\n```\n\n'
    },
  })

  // Rule: Remove <span id="more"></span> markers
  td.addRule('moreMarker', {
    filter: function (node) {
      return node.nodeName === 'SPAN' && node.getAttribute('id') === 'more'
    },
    replacement: () => '',
  })

  // Rule: Strip Hexo headerlink anchors (e.g. <a href="#xxx" class="headerlink" title="xxx">)
  td.addRule('headerlink', {
    filter: function (node) {
      return (
        node.nodeName === 'A' &&
        node.getAttribute('class') &&
        node.getAttribute('class').includes('headerlink')
      )
    },
    replacement: () => '',
  })

  // Rule: Handle <img> tags — keep as-is for proper alt text handling
  // Turndown handles this by default, but we want to make sure width/height attrs are dropped

  return td
}

/**
 * Recursively extract text from a DOM node, stripping all tags.
 * Handles <br> as newlines but ignores them inside <span class="line"> since
 * we join lines with \n anyway.
 */
function extractTextFromNode(node) {
  let text = ''
  for (const child of node.childNodes) {
    if (child.nodeType === 3) {
      // TEXT_NODE
      text += child.textContent
    } else if (child.nodeName === 'BR') {
      // br inside a line span is a line separator in gutter, skip
      // but if it's outside a line span, it might be meaningful
      // In Hexo code blocks, <br> separates lines in the gutter
      // We skip it because we handle line-by-line via span.line
    } else {
      text += extractTextFromNode(child)
    }
  }
  return text
}

// ---------------------------------------------------------------------------
// Post-process the markdown
// ---------------------------------------------------------------------------

function postProcessMarkdown(md, imagePathMap) {
  let result = md

  // Replace image paths for local images
  for (const [oldSrc, newSrc] of Object.entries(imagePathMap)) {
    // In markdown, images look like ![alt](src) or might be raw <img> tags
    result = result.split(oldSrc).join(newSrc)
    // Also try URL-decoded version
    try {
      const decoded = decodeURIComponent(oldSrc)
      if (decoded !== oldSrc) {
        result = result.split(decoded).join(newSrc)
      }
    } catch (e) {
      /* ignore decode errors */
    }
  }

  // Decode remaining HTML entities that turndown might have left
  result = decodeHtmlEntities(result)

  // Clean up excessive blank lines (more than 2 consecutive)
  result = result.replace(/\n{3,}/g, '\n\n')

  // Remove trailing whitespace on lines
  result = result.replace(/[ \t]+$/gm, '')

  // Ensure file ends with single newline
  result = result.trimEnd() + '\n'

  return result
}

// ---------------------------------------------------------------------------
// Main migration
// ---------------------------------------------------------------------------

async function main() {
  // Load content.json
  const posts = JSON.parse(fs.readFileSync(CONTENT_JSON, 'utf8'))
  console.log(`Found ${posts.length} posts in content.json`)

  // Ensure output directories exist
  fs.mkdirSync(OUTPUT_DIR, { recursive: true })
  fs.mkdirSync(IMAGE_OUTPUT_DIR, { recursive: true })

  // We need JSDOM for turndown to work server-side
  // turndown's Node.js build uses its own minimal DOM parser
  const td = createTurndownService()

  let successCount = 0
  let errorCount = 0
  const errors = []
  const imagesCopied = []

  for (const post of posts) {
    try {
      const slug = extractSlug(post.path)
      const htmlPath = path.join(OLD_BLOG_DIR, post.path, 'index.html')

      if (!fs.existsSync(htmlPath)) {
        throw new Error(`HTML file not found: ${htmlPath}`)
      }

      const html = fs.readFileSync(htmlPath, 'utf8')
      const articleBody = extractArticleBody(html)

      if (!articleBody) {
        throw new Error(`Could not extract article body from: ${htmlPath}`)
      }

      // Build image path map for this post
      const imagePathMap = buildImagePathMap(post.path)

      // Copy local images
      const postDir = path.join(OLD_BLOG_DIR, post.path)
      if (fs.existsSync(postDir)) {
        const files = fs.readdirSync(postDir)
        for (const file of files) {
          if (/\.(png|jpg|jpeg|gif|webp|svg)$/i.test(file)) {
            const newName = IMAGE_RENAME_MAP[file] || file
            const src = path.join(postDir, file)
            const dst = path.join(IMAGE_OUTPUT_DIR, newName)
            fs.copyFileSync(src, dst)
            imagesCopied.push({ from: src, to: dst, original: file, renamed: newName })
          }
        }
      }

      // Convert HTML to Markdown
      let markdown = td.turndown(articleBody)

      // Post-process
      markdown = postProcessMarkdown(markdown, imagePathMap)

      // Build frontmatter
      const tags = post.tags.map((t) => normalizeTag(t.name))
      const date = formatDate(post.date)
      const summary = generateSummary(markdown)
      const title = post.title

      let frontmatter = '---\n'
      frontmatter += `title: ${escapeYamlString(title)}\n`
      frontmatter += `date: '${date}'\n`
      if (tags.length > 0) {
        frontmatter += `tags: [${tags.map((t) => escapeYamlString(t)).join(', ')}]\n`
      } else {
        frontmatter += `tags: []\n`
      }
      frontmatter += `draft: false\n`
      frontmatter += `summary: ${escapeYamlString(summary)}\n`
      frontmatter += '---\n'

      const mdxContent = frontmatter + '\n' + markdown

      // Write MDX file
      const outputPath = path.join(OUTPUT_DIR, `${slug}.mdx`)
      fs.writeFileSync(outputPath, mdxContent, 'utf8')
      successCount++

      if (successCount % 20 === 0) {
        console.log(`  Processed ${successCount}/${posts.length} posts...`)
      }
    } catch (err) {
      errorCount++
      errors.push({ title: post.title, path: post.path, error: err.message })
      console.error(`ERROR processing "${post.title}": ${err.message}`)
    }
  }

  console.log('\n--- Migration Complete ---')
  console.log(`Success: ${successCount}`)
  console.log(`Errors:  ${errorCount}`)

  if (imagesCopied.length > 0) {
    console.log(`\nImages copied: ${imagesCopied.length}`)
    imagesCopied.forEach((img) => {
      console.log(`  ${img.original} → ${img.renamed}`)
    })
  }

  if (errors.length > 0) {
    console.log('\nFailed posts:')
    errors.forEach((e) => console.log(`  - ${e.title}: ${e.error}`))
  }
}

main().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})
