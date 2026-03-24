import { NextResponse } from 'next/server'

async function generateToken(password: string): Promise<string> {
  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode('admin-session'))
  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

export async function POST(request: Request) {
  const adminPassword = process.env.ADMIN_PASSWORD
  if (!adminPassword) {
    return NextResponse.json({ error: '管理后台未配置密码' }, { status: 403 })
  }

  const body = await request.json()
  const { password } = body

  if (!password || password !== adminPassword) {
    return NextResponse.json({ error: '密码错误' }, { status: 401 })
  }

  const token = await generateToken(adminPassword)
  const response = NextResponse.json({ success: true })
  response.cookies.set('admin-token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24, // 24 hours
  })

  return response
}
