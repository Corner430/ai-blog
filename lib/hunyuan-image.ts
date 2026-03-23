const IMAGE_API_BASE = 'https://api.cloudai.tencent.com'
const IMAGE_MODEL = 'HY-Image-V3.0'

export function isImageAiEnabled(): boolean {
  return !!process.env.HUNYUAN_API_KEY
}

function getHeaders() {
  return {
    Authorization: process.env.HUNYUAN_API_KEY!,
    'Content-Type': 'application/json',
  }
}

export interface SubmitImageJobParams {
  title: string
  summary?: string
}

export async function submitImageJob(params: SubmitImageJobParams): Promise<{ jobId: string }> {
  if (!params.title) {
    throw new Error('title is required')
  }

  const prompt = `为博客文章生成一张封面图。文章标题：${params.title}${params.summary ? `。文章摘要：${params.summary}` : ''}。要求：现代设计风格，适合技术博客，色彩鲜明，简洁大气。`

  const resp = await fetch(`${IMAGE_API_BASE}/v1/aiart/submit`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({
      model: IMAGE_MODEL,
      prompt,
      size: '1024:576',
    }),
  })

  if (!resp.ok) {
    const text = await resp.text()
    throw new Error(`Image submit failed (${resp.status}): ${text}`)
  }

  const data = await resp.json()
  return { jobId: data.job_id }
}

export async function queryImageJob(
  jobId: string
): Promise<{ status: 'processing' | 'done' | 'failed'; imageUrl?: string; error?: string }> {
  if (!jobId) {
    throw new Error('jobId is required')
  }

  const resp = await fetch(`${IMAGE_API_BASE}/v1/aiart/query`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ job_id: jobId }),
  })

  if (!resp.ok) {
    const text = await resp.text()
    throw new Error(`Image query failed (${resp.status}): ${text}`)
  }

  const data = await resp.json()
  const status = data.status

  if (status === '5') {
    const imageUrl = data.data?.[0]?.url || ''
    return { status: 'done', imageUrl }
  } else if (status === '4' || status === '6') {
    return { status: 'failed', error: data.error_message || 'Unknown error' }
  } else {
    return { status: 'processing' }
  }
}
