import { NextRequest, NextResponse } from 'next/server'
import { createHmac } from 'crypto'

function generateToken(password: string): string {
  return createHmac('sha256', password).update('admin-session').digest('hex')
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow login page and login API through
  if (pathname === '/admin/login' || pathname === '/api/admin/login') {
    return NextResponse.next()
  }

  const adminPassword = process.env.ADMIN_PASSWORD
  if (!adminPassword) {
    return new NextResponse('管理后台未配置 ADMIN_PASSWORD', { status: 403 })
  }

  const token = request.cookies.get('admin-token')?.value
  const expectedToken = generateToken(adminPassword)

  if (!token || token !== expectedToken) {
    // API routes return 401 JSON; page routes redirect to login
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
