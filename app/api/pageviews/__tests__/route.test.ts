import { NextRequest } from 'next/server'

// Save original env
const originalEnv = { ...process.env }

beforeEach(() => {
  jest.restoreAllMocks()
  process.env.UMAMI_API_URL = 'https://analytics.example.com'
  process.env.UMAMI_API_TOKEN = 'test-token'
  process.env.NEXT_UMAMI_ID = 'test-site-id'
})

afterEach(() => {
  process.env = { ...originalEnv }
})

// Re-import per test to pick up env changes
async function importGET() {
  // Clear module cache so env vars are re-read
  jest.resetModules()
  const mod = await import('../route')
  return mod.GET
}

describe('GET /api/pageviews', () => {
  it('缺少 slug 时返回 views: 0', async () => {
    const GET = await importGET()
    const req = new NextRequest('http://localhost/api/pageviews/')
    const res = await GET(req)
    const data = await res.json()
    expect(data).toEqual({ views: 0 })
  })

  it('缺少环境变量时返回 views: 0', async () => {
    delete process.env.UMAMI_API_TOKEN
    const GET = await importGET()
    const req = new NextRequest('http://localhost/api/pageviews/?slug=test')
    const res = await GET(req)
    const data = await res.json()
    expect(data).toEqual({ views: 0 })
  })

  it('成功获取访问量时返回正确数字', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve([
          { x: '/blog/test/', y: 123 },
          { x: '/blog/other/', y: 50 },
        ]),
    }) as jest.Mock
    const GET = await importGET()
    const req = new NextRequest('http://localhost/api/pageviews/?slug=test')
    const res = await GET(req)
    const data = await res.json()
    expect(data).toEqual({ views: 123 })
  })

  it('Umami API 返回错误时返回 views: 0', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
    }) as jest.Mock
    const GET = await importGET()
    const req = new NextRequest('http://localhost/api/pageviews/?slug=test')
    const res = await GET(req)
    const data = await res.json()
    expect(data).toEqual({ views: 0 })
  })

  it('fetch 抛出异常时返回 views: 0', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('network error')) as jest.Mock
    const GET = await importGET()
    const req = new NextRequest('http://localhost/api/pageviews/?slug=test')
    const res = await GET(req)
    const data = await res.json()
    expect(data).toEqual({ views: 0 })
  })
})
