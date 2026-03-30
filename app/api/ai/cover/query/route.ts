import { NextResponse } from 'next/server'
import { isImageAiEnabled, queryImageJob } from '@/lib/hunyuan-image'
import { rateLimit, getClientIp } from '@/lib/rate-limit'

const limiter = rateLimit()

export async function GET(request: Request) {
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

  const { searchParams } = new URL(request.url)
  const jobId = searchParams.get('jobId')

  if (!jobId) {
    return NextResponse.json({ error: 'jobId is required' }, { status: 400 })
  }

  try {
    const result = await queryImageJob(jobId)
    return NextResponse.json(result)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
