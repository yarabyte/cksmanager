export const AUTH_COOKIE = 'cks-session'
export const AUTH_COOKIE_MAX_AGE = 60 * 60 * 24 * 7 // 7 jours

export function getAuthSecret(): Uint8Array {
  const secret = process.env.AUTH_SECRET
  if (!secret && process.env.NODE_ENV === 'production') {
    throw new Error('AUTH_SECRET doit être défini en production.')
  }
  return new TextEncoder().encode(secret ?? 'dev-secret-change-in-production')
}
