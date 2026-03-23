/**
 * @jest-environment node
 */

jest.mock('@/lib/hunyuan-image', () => ({
  isImageAiEnabled: jest.fn(),
  submitImageJob: jest.fn(),
  queryImageJob: jest.fn(),
}))

import { POST as submitPOST } from '../cover/submit/route'
import { GET as queryGET } from '../cover/query/route'
import { isImageAiEnabled, submitImageJob, queryImageJob } from '@/lib/hunyuan-image'

const mockIsImageAiEnabled = isImageAiEnabled as jest.Mock
const mockSubmitImageJob = submitImageJob as jest.Mock
const mockQueryImageJob = queryImageJob as jest.Mock

function createPostRequest(body: Record<string, unknown>): Request {
  return new Request('http://localhost:3000/api/ai/cover/submit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('POST /api/ai/cover/submit', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns 400 when title is missing', async () => {
    mockIsImageAiEnabled.mockReturnValue(true)
    const res = await submitPOST(createPostRequest({ summary: 'test' }))
    expect(res.status).toBe(400)
  })

  it('returns 503 when image AI is not enabled', async () => {
    mockIsImageAiEnabled.mockReturnValue(false)
    const res = await submitPOST(createPostRequest({ title: 'test', summary: 'test' }))
    expect(res.status).toBe(503)
  })

  it('returns jobId for valid request', async () => {
    mockIsImageAiEnabled.mockReturnValue(true)
    mockSubmitImageJob.mockResolvedValue({ jobId: 'job-123' })

    const res = await submitPOST(
      createPostRequest({ title: 'Test Article', summary: 'A test summary' })
    )
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.jobId).toBe('job-123')
  })
})

describe('GET /api/ai/cover/query', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns 400 when jobId is missing', async () => {
    mockIsImageAiEnabled.mockReturnValue(true)
    const req = new Request('http://localhost:3000/api/ai/cover/query')
    const res = await queryGET(req)
    expect(res.status).toBe(400)
  })

  it('returns status for valid jobId', async () => {
    mockIsImageAiEnabled.mockReturnValue(true)
    mockQueryImageJob.mockResolvedValue({ status: 'processing' })

    const req = new Request('http://localhost:3000/api/ai/cover/query?jobId=job-123')
    const res = await queryGET(req)
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.status).toBe('processing')
  })
})
