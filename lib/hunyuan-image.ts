import * as tencentcloud from 'tencentcloud-sdk-nodejs-hunyuan'

const HunyuanClient = tencentcloud.hunyuan.v20230901.Client

export function isImageAiEnabled(): boolean {
  return !!process.env.TENCENT_SECRET_ID && !!process.env.TENCENT_SECRET_KEY
}

function getImageClient() {
  return new HunyuanClient({
    credential: {
      secretId: process.env.TENCENT_SECRET_ID!,
      secretKey: process.env.TENCENT_SECRET_KEY!,
    },
    region: '',
    profile: {
      httpProfile: {
        endpoint: 'hunyuan.tencentcloudapi.com',
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

  const client = getImageClient()
  const resp = await client.SubmitHunyuanImageJob({
    Prompt: prompt,
    Resolution: '1024:576',
  })

  return { jobId: resp.JobId! }
}

export async function queryImageJob(
  jobId: string
): Promise<{ status: 'processing' | 'done' | 'failed'; imageUrl?: string; error?: string }> {
  if (!jobId) {
    throw new Error('jobId is required')
  }

  const client = getImageClient()
  const resp = await client.QueryHunyuanImageJob({
    JobId: jobId,
  })

  const status = resp.JobStatusCode
  if (status === '1' || status === '2') {
    return { status: 'processing' }
  } else if (status === '5') {
    const imageUrl = resp.ResultImage?.[0] || ''
    return { status: 'done', imageUrl }
  } else {
    return { status: 'failed', error: resp.JobErrorMsg || 'Unknown error' }
  }
}
