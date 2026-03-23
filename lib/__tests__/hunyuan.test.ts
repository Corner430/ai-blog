import { getHunyuanClient, isAiEnabled } from '../hunyuan'

describe('lib/hunyuan', () => {
  const originalEnv = process.env

  beforeEach(() => {
    jest.resetModules()
    process.env = { ...originalEnv }
  })

  afterAll(() => {
    process.env = originalEnv
  })

  describe('isAiEnabled', () => {
    it('returns false when HUNYUAN_API_KEY is not set', () => {
      delete process.env.HUNYUAN_API_KEY
      expect(isAiEnabled()).toBe(false)
    })

    it('returns false when HUNYUAN_API_KEY is empty string', () => {
      process.env.HUNYUAN_API_KEY = ''
      expect(isAiEnabled()).toBe(false)
    })

    it('returns true when HUNYUAN_API_KEY is set', () => {
      process.env.HUNYUAN_API_KEY = 'test-api-key'
      expect(isAiEnabled()).toBe(true)
    })
  })

  describe('getHunyuanClient', () => {
    it('returns an OpenAI-compatible client instance', () => {
      process.env.HUNYUAN_API_KEY = 'test-api-key'
      const client = getHunyuanClient()
      expect(client).toBeDefined()
      expect(client.chat).toBeDefined()
      expect(client.chat.completions).toBeDefined()
    })

    it('uses the Hunyuan-compatible base URL', () => {
      process.env.HUNYUAN_API_KEY = 'test-api-key'
      const client = getHunyuanClient()
      expect(client.baseURL).toBe('https://api.hunyuan.cloud.tencent.com/v1')
    })
  })
})
