import { NextResponse } from 'next/server'
import { isAiEnabled, getHunyuanClient } from '@/lib/hunyuan'
import { searchByEmbedding } from '@/lib/embeddings'
import type { EmbeddingIndex } from '@/lib/embeddings'
import fs from 'fs'
import path from 'path'
import { rateLimit, getClientIp } from '@/lib/rate-limit'

const limiter = rateLimit()

let cachedIndex: EmbeddingIndex | null = null
let cachedIndexMtime: number | null = null

async function loadIndex(request: Request): Promise<EmbeddingIndex> {
  // Try filesystem first (works in dev and some deployment targets)
  const indexPath = path.join(process.cwd(), 'public', 'embedding-index.json')
  try {
    const stat = fs.statSync(indexPath)
    if (cachedIndex && cachedIndexMtime === stat.mtimeMs) return cachedIndex
    const data = fs.readFileSync(indexPath, 'utf-8')
    cachedIndex = JSON.parse(data) as EmbeddingIndex
    cachedIndexMtime = stat.mtimeMs
    return cachedIndex
  } catch {
    // Filesystem access failed (e.g. Vercel serverless) — fetch from public URL
  }

  if (cachedIndex) return cachedIndex

  // Derive the origin from the incoming request
  const url = new URL(request.url)
  const origin = url.origin
  const res = await fetch(`${origin}/embedding-index.json`)
  if (!res.ok) {
    throw new Error(`Failed to fetch embedding index: ${res.status} ${res.statusText}`)
  }
  cachedIndex = (await res.json()) as EmbeddingIndex
  cachedIndexMtime = null
  return cachedIndex
}

export async function POST(request: Request) {
  const ip = getClientIp(request)
  const { success, remaining, limit, resetTime } = limiter.check(ip)
  if (!success) {
    return NextResponse.json(
      { error: '请求过于频繁，请稍后再试' },
      {
        status: 429,
        headers: {
          'X-RateLimit-Limit': String(limit),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(resetTime),
          'Retry-After': String(Math.ceil((resetTime - Date.now()) / 1000)),
        },
      }
    )
  }

  if (!isAiEnabled()) {
    return NextResponse.json({ error: 'AI 功能未启用' }, { status: 503 })
  }

  const body = await request.json()
  const { query } = body

  if (!query) {
    return NextResponse.json({ error: 'query is required' }, { status: 400 })
  }

  try {
    const client = getHunyuanClient()
    const embeddingResp = await client.embeddings.create({
      model: 'hunyuan-embedding',
      input: query,
      encoding_format: 'float',
    })

    const queryEmbedding = embeddingResp.data[0].embedding

    const index = await loadIndex(request)
    const results = searchByEmbedding(queryEmbedding, index)

    return NextResponse.json({ results })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
