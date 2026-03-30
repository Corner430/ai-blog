import { NextResponse } from 'next/server'
import { generateText } from 'ai'
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
  const { content } = body

  if (!content) {
    return NextResponse.json({ error: 'content is required' }, { status: 400 })
  }

  try {
    const result = await generateText({
      model: getHunyuanModel(),
      system:
        '你是一个标签生成助手。根据提供的文章内容，生成3-5个相关的标签。只返回一个JSON数组格式，例如：["标签1", "标签2", "标签3"]。不要返回其他内容。',
      prompt: content,
    })

    let tags: string[]
    try {
      tags = JSON.parse(result.text)
    } catch {
      // Try to extract JSON array from response
      const match = result.text.match(/\[[\s\S]*\]/)
      if (match) {
        tags = JSON.parse(match[0])
      } else {
        tags = result.text
          .split(/[,，、\n]/)
          .map((t) => t.trim().replace(/^["'\s]+|["'\s]+$/g, ''))
          .filter(Boolean)
          .slice(0, 5)
      }
    }

    return NextResponse.json({ tags })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
