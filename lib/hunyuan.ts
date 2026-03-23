import OpenAI from 'openai'
import { createOpenAI } from '@ai-sdk/openai'

const HUNYUAN_BASE_URL = 'https://api.hunyuan.cloud.tencent.com/v1'
const HUNYUAN_MODEL = 'hunyuan-2.0-thinking-20251109'

export function isAiEnabled(): boolean {
  return !!process.env.HUNYUAN_API_KEY
}

export function getHunyuanClient(): OpenAI {
  return new OpenAI({
    apiKey: process.env.HUNYUAN_API_KEY,
    baseURL: HUNYUAN_BASE_URL,
  })
}

export function getHunyuanProvider() {
  return createOpenAI({
    apiKey: process.env.HUNYUAN_API_KEY,
    baseURL: HUNYUAN_BASE_URL,
  })
}

export function getHunyuanModel() {
  return getHunyuanProvider().chat(HUNYUAN_MODEL)
}

export { HUNYUAN_MODEL }
