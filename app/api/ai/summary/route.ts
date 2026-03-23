import { NextResponse } from 'next/server'
import { streamText } from 'ai'
import { isAiEnabled, getHunyuanModel } from '@/lib/hunyuan'

export async function POST(request: Request) {
  if (!isAiEnabled()) {
    return NextResponse.json({ error: 'AI 功能未启用' }, { status: 503 })
  }

  const body = await request.json()
  const { prompt, content, slug } = body
  const articleContent = prompt || content

  if (!articleContent) {
    return NextResponse.json({ error: 'content is required' }, { status: 400 })
  }

  const result = streamText({
    model: getHunyuanModel(),
    system:
      '你是一个博客文章摘要助手。请根据提供的文章内容，生成2-3句简洁的中文摘要，概括文章的核心观点和要点。摘要应当精炼、准确，不超过150字。',
    prompt: articleContent,
  })

  return result.toTextStreamResponse()
}
