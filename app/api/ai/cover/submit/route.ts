import { NextResponse } from 'next/server'
import { isImageAiEnabled, submitImageJob } from '@/lib/hunyuan-image'

export async function POST(request: Request) {
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
