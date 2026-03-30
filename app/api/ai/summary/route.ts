import { NextResponse } from 'next/server'
import { streamText } from 'ai'
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
