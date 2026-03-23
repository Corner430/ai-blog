import OpenAI from 'openai'
import { createOpenAI } from '@ai-sdk/openai'

const HUNYUAN_BASE_URL = 'https://api.hunyuan.cloud.tencent.com/v1'
const HUNYUAN_MODEL = 'hunyuan-turbos-latest'

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

export { HUNYUAN_MODEL }
