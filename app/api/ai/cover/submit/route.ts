import { NextResponse } from 'next/server'
import { isImageAiEnabled, submitImageJob } from '@/lib/hunyuan-image'
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

  if (!isImageAiEnabled()) {
    return NextResponse.json({ error: 'AI 生图功能未启用' }, { status: 503 })
  }

  const body = await request.json()
  const { title, summary } = body

  if (!title) {
    return NextResponse.json({ error: 'title is required' }, { status: 400 })
  }

  try {
    const result = await submitImageJob({ title, summary })
    return NextResponse.json({ jobId: result.jobId })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
