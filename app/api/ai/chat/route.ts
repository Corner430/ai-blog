import { NextResponse } from 'next/server'
import { streamText } from 'ai'
import { isAiEnabled, getHunyuanProvider, HUNYUAN_MODEL } from '@/lib/hunyuan'

export async function POST(request: Request) {
  if (!isAiEnabled()) {
    return NextResponse.json({ error: 'AI 功能未启用' }, { status: 503 })
  }

  const body = await request.json()
  const { messages, articleContent } = body

  if (!messages || !Array.isArray(messages)) {
    return NextResponse.json({ error: 'messages is required' }, { status: 400 })
  }

  if (!articleContent) {
    return NextResponse.json({ error: 'articleContent is required' }, { status: 400 })
  }

  const result = streamText({
    model: getHunyuanProvider()(HUNYUAN_MODEL),
    system: `你是一个博客文章阅读助手。基于以下文章内容回答用户的问题。如果问题与文章内容无关，请礼貌地告知用户你只能回答与文章相关的问题。

文章内容：
${articleContent}`,
    messages,
  })

  return result.toDataStreamResponse()
}
