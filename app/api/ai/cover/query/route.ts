import { NextResponse } from 'next/server'
import { isImageAiEnabled, queryImageJob } from '@/lib/hunyuan-image'

export async function GET(request: Request) {
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
