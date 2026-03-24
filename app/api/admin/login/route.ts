import { NextResponse } from 'next/server'
import { createHmac } from 'crypto'

function generateToken(password: string): string {
  return createHmac('sha256', password).update('admin-session').digest('hex')
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

  const token = generateToken(adminPassword)
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
