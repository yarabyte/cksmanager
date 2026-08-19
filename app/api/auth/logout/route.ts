import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { AUTH_COOKIE } from '@/lib/auth/config'
import { clearSessionCookie } from '@/lib/auth/session'

function logoutRedirect(request: NextRequest) {
  const response = NextResponse.redirect(new URL('/login', request.url))
  response.cookies.delete(AUTH_COOKIE)
  return response
}

export async function GET(request: NextRequest) {
  return logoutRedirect(request)
}

export async function POST() {
  await clearSessionCookie()
  return NextResponse.json({ ok: true })
}
