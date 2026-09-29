import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { AUTH_COOKIE } from '@/lib/auth/config'
import { verifySessionToken } from '@/lib/auth/jwt'

const PUBLIC_PATHS = ['/login']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.match(/\.(jpg|jpeg|png|gif|svg|ico|webp)$/)
  ) {
    return NextResponse.next()
  }

  if (PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    const token = request.cookies.get(AUTH_COOKIE)?.value
    if (token) {
      const session = await verifySessionToken(token)
      if (session && pathname.startsWith('/login')) {
        return NextResponse.redirect(new URL('/dashboard', request.url))
      }
    }
    return NextResponse.next()
  }

  if (pathname.startsWith('/api/auth')) {
    return NextResponse.next()
  }

  const token = request.cookies.get(AUTH_COOKIE)?.value
  if (!token) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })
    }
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('from', pathname)
    return NextResponse.redirect(loginUrl)
  }

  const session = await verifySessionToken(token)
  if (!session) {
    const response = pathname.startsWith('/api/')
      ? NextResponse.json({ error: 'Session invalide.' }, { status: 401 })
      : NextResponse.redirect(new URL('/login', request.url))
    response.cookies.delete(AUTH_COOKIE)
    return response
  }

  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-pathname', pathname)
  return NextResponse.next({ request: { headers: requestHeaders } })
}

export const config = {
  matcher: ['/((?!_next/static|_next/image).*)'],
}
