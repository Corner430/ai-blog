import { NextResponse } from 'next/server'
import { isAiEnabled, getHunyuanClient } from '@/lib/hunyuan'
import { searchByEmbedding } from '@/lib/embeddings'
import type { EmbeddingIndex } from '@/lib/embeddings'
import fs from 'fs'
import path from 'path'

let cachedIndex: EmbeddingIndex | null = null

async function loadIndex(): Promise<EmbeddingIndex> {
  if (cachedIndex) return cachedIndex
  const indexPath = path.join(process.cwd(), 'public', 'embedding-index.json')
  const data = fs.readFileSync(indexPath, 'utf-8')
  cachedIndex = JSON.parse(data) as EmbeddingIndex
  return cachedIndex
}

export async function POST(request: Request) {
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
    })

    const queryEmbedding = embeddingResp.data[0].embedding

    const index = await loadIndex()
    const results = searchByEmbedding(queryEmbedding, index)

    return NextResponse.json({ results })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
