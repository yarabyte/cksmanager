import { SignJWT, jwtVerify } from 'jose'
import { AUTH_COOKIE_MAX_AGE, getAuthSecret } from './config'
import type { SessionPayload } from './types'

export async function createSessionToken(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${AUTH_COOKIE_MAX_AGE}s`)
    .sign(getAuthSecret())
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getAuthSecret())
    const userId = payload.userId
    const email = payload.email
    const name = payload.name
    const role = payload.role
    if (
      typeof userId !== 'string' ||
      typeof email !== 'string' ||
      typeof name !== 'string' ||
      typeof role !== 'string'
    ) {
      return null
    }
    return {
      userId,
      email,
      name,
      role: role as SessionPayload['role'],
      legacyRole: typeof payload.legacyRole === 'string' ? payload.legacyRole : null,
    }
  } catch {
    return null
  }
}
