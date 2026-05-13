// src/middleware.ts

import { NextResponse, type NextRequest } from 'next/server'

const PUBLIC_PATHS = [
  '/admin/login',
  '/admin/setup-admin',
  '/api/auth/login',
  '/api/auth/logout'
]

const AUTH_COOKIE_NAME = 'auth_token'

function redirectToLogin(req: NextRequest) {
  const url = req.nextUrl.clone()
  url.pathname = '/admin/login'
  url.search = ''
  return NextResponse.redirect(url)
}

export function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname

  // libera tudo fora do admin/api admin
  if (!pathname.startsWith('/admin') && !pathname.startsWith('/api/admin')) {
    return NextResponse.next()
  }

  // libera rotas públicas
  if (PUBLIC_PATHS.includes(pathname)) {
    return NextResponse.next()
  }

  // só verifica existência do cookie (SEM JWT VERIFY AQUI)
  const token = req.cookies.get(AUTH_COOKIE_NAME)?.value


  if (!token) {
    return redirectToLogin(req)
  }

  // não valida assinatura aqui (Edge incompatível com jsonwebtoken)
  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*']
}