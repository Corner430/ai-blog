import { NextResponse } from 'next/server'
import { streamText } from 'ai'
import { isAiEnabled, getHunyuanProvider, HUNYUAN_MODEL } from '@/lib/hunyuan'

const PROMPTS: Record<string, string> = {
  polish:
    '你是一个专业的中文写作编辑。请对以下文章内容进行润色优化，改善表达、修正语法、提升可读性，但保持原意不变。直接返回润色后的文本，不要添加任何解释说明。',
  continue:
    '你是一个专业的中文写作助手。请基于以下文章内容进行续写，保持一致的风格和语调，自然衔接上文。直接返回续写的文本，不要添加任何解释说明。',
}

export async function POST(request: Request) {
  if (!isAiEnabled()) {
    return NextResponse.json({ error: 'AI 功能未启用' }, { status: 503 })
  }

  const body = await request.json()
  const { content, action } = body

  if (!content) {
    return NextResponse.json({ error: 'content is required' }, { status: 400 })
  }

  if (!action || !PROMPTS[action]) {
    return NextResponse.json({ error: 'action must be "polish" or "continue"' }, { status: 400 })
  }

  const result = streamText({
    model: getHunyuanProvider()(HUNYUAN_MODEL),
    system: PROMPTS[action],
    prompt: content,
  })

  return result.toDataStreamResponse()
}
