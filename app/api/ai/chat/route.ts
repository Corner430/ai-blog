import { NextResponse } from 'next/server'
import { streamText, convertToModelMessages } from 'ai'
import { isAiEnabled, getHunyuanModel } from '@/lib/hunyuan'
import { rateLimit, getClientIp } from '@/lib/rate-limit'

const limiter = rateLimit()

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
  const { messages, articleContent } = body

  if (!messages || !Array.isArray(messages)) {
    return NextResponse.json({ error: 'messages is required' }, { status: 400 })
  }

  if (!articleContent) {
    return NextResponse.json({ error: 'articleContent is required' }, { status: 400 })
  }

  const modelMessages = await convertToModelMessages(messages)

  const result = streamText({
    model: getHunyuanModel(),
    system: `你是一个博客文章阅读助手。基于以下文章内容回答用户的问题。如果问题与文章内容无关，请礼貌地告知用户你只能回答与文章相关的问题。

文章内容：
${articleContent}`,
    messages: modelMessages,
  })

  return result.toUIMessageStreamResponse()
}
