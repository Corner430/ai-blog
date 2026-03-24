import { Client } from 'tencentcloud-sdk-nodejs-aiart/tencentcloud/services/aiart/v20221229/aiart_client'

const REGION = 'ap-guangzhou'

export function isImageAiEnabled(): boolean {
  return !!process.env.TENCENT_SECRET_ID && !!process.env.TENCENT_SECRET_KEY
}

function getClient(): Client {
  return new Client({
    credential: {
      secretId: process.env.TENCENT_SECRET_ID!,
      secretKey: process.env.TENCENT_SECRET_KEY!,
    },
    region: REGION,
    profile: {
      httpProfile: {
        endpoint: 'aiart.tencentcloudapi.com',
      },
    },
  })
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

  const client = getClient()
  const resp = await client.SubmitTextToImageJob({
    Prompt: prompt,
    Resolution: '1280:720',
    LogoAdd: 0,
  })

  if (!resp.JobId) {
    throw new Error('Image submit failed: no JobId returned')
  }

  return { jobId: resp.JobId }
}

export async function queryImageJob(
  jobId: string
): Promise<{ status: 'processing' | 'done' | 'failed'; imageUrl?: string; error?: string }> {
  if (!jobId) {
    throw new Error('jobId is required')
  }

  const client = getClient()
  const resp = await client.QueryTextToImageJob({ JobId: jobId })

  const statusCode = resp.JobStatusCode

  if (statusCode === '5') {
    const imageUrl = resp.ResultImage?.[0] || ''
    return { status: 'done', imageUrl }
  } else if (statusCode === '4') {
    return { status: 'failed', error: resp.JobErrorMsg || 'Unknown error' }
  } else {
    return { status: 'processing' }
  }
}
