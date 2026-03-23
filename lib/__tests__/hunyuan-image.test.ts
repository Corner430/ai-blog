import { submitImageJob, queryImageJob, isImageAiEnabled } from '../hunyuan-image'

describe('lib/hunyuan-image', () => {
  const originalEnv = process.env

  beforeEach(() => {
    jest.resetModules()
    process.env = { ...originalEnv }
  })

  afterAll(() => {
    process.env = originalEnv
  })

  describe('isImageAiEnabled', () => {
    it('returns false when HUNYUAN_API_KEY is not set', () => {
      delete process.env.HUNYUAN_API_KEY
      expect(isImageAiEnabled()).toBe(false)
    })

    it('returns true when HUNYUAN_API_KEY is set', () => {
      process.env.HUNYUAN_API_KEY = 'test-key'
      expect(isImageAiEnabled()).toBe(true)
    })
  })

  describe('submitImageJob', () => {
    it('rejects when title is missing', async () => {
      process.env.HUNYUAN_API_KEY = 'test-key'
      await expect(submitImageJob({ title: '', summary: 'test' })).rejects.toThrow(
        'title is required'
      )
    })
  })

  describe('queryImageJob', () => {
    it('rejects when jobId is missing', async () => {
      process.env.HUNYUAN_API_KEY = 'test-key'
      await expect(queryImageJob('')).rejects.toThrow('jobId is required')
    })
  })
})
