import { NextRequest, NextResponse } from 'next/server'

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

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow login page and login API through
  if (pathname.startsWith('/admin/login') || pathname.startsWith('/api/admin/login')) {
    return NextResponse.next()
  }

  const adminPassword = process.env.ADMIN_PASSWORD
  if (!adminPassword) {
    return new NextResponse('管理后台未配置 ADMIN_PASSWORD', { status: 403 })
  }

  const token = request.cookies.get('admin-token')?.value
  const expectedToken = await generateToken(adminPassword)

  if (!token || token !== expectedToken) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: '未授权' }, { status: 401 })
    }
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = '/admin/login'
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
}
