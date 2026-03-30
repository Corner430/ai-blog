import { NextResponse } from 'next/server'
import { streamText } from 'ai'
import { isAiEnabled, getHunyuanModel } from '@/lib/hunyuan'
import { rateLimit, getClientIp } from '@/lib/rate-limit'

const limiter = rateLimit()

const PROMPTS: Record<string, string> = {
  polish:
    '你是一个专业的中文写作编辑。请对以下文章内容进行润色优化，改善表达、修正语法、提升可读性，但保持原意不变。直接返回润色后的文本，不要添加任何解释说明。',
  continue:
    '你是一个专业的中文写作助手。请基于以下文章内容进行续写，保持一致的风格和语调，自然衔接上文。直接返回续写的文本，不要添加任何解释说明。',
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
  const { content, action } = body

  if (!content) {
    return NextResponse.json({ error: 'content is required' }, { status: 400 })
  }

  if (!action || !PROMPTS[action]) {
    return NextResponse.json({ error: 'action must be "polish" or "continue"' }, { status: 400 })
  }

  const result = streamText({
    model: getHunyuanModel(),
    system: PROMPTS[action],
    prompt: content,
  })

  return result.toTextStreamResponse()
}
