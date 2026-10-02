import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'
import {
  builtinRoleFromCustomGroup,
  mapLegacyRoleStringToAppRole,
  mapLegacyRoleStringToAppRoles,
} from '@/lib/user-role'
import { loadPermissionsConfig } from '@/lib/permissions-server'
import type { Role } from '@/lib/types'
import { AUTH_COOKIE } from './config'
import { createSessionToken, verifySessionToken } from './jwt'
import type { AuthUser, SessionPayload } from './types'

const DEFAULT_ROLE: Role = 'Front Office'

export { createSessionToken, verifySessionToken }

export async function setSessionCookie(token: string) {
  const jar = await cookies()
  jar.set(AUTH_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  })
}

export async function clearSessionCookie() {
  const jar = await cookies()
  jar.delete(AUTH_COOKIE)
}

export async function getSession(): Promise<SessionPayload | null> {
  const jar = await cookies()
  const token = jar.get(AUTH_COOKIE)?.value
  if (!token) return null
  return verifySessionToken(token)
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const session = await getSession()
  if (!session) return null

  const user = await prisma.user.findUnique({
    where: { id: BigInt(session.userId) },
    select: { id: true, email: true, name: true, role: true, actif: true },
  })
  if (!user || !user.actif) return null

  const roles = mapLegacyRoleStringToAppRoles(user.role)
  const rawRole = (user.role ?? '').trim()

  if (roles.length === 0 && rawRole) {
    const { customGroups } = await loadPermissionsConfig()
    const group = customGroups.find((g) => g.id === rawRole)
    if (group) {
      const builtin = builtinRoleFromCustomGroup(group)
      if (builtin) {
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: builtin,
          roles: [builtin],
          legacyRole: user.role,
          customGroup: null,
        }
      }
      return {
        id: user.id,
        email: user.email,
        name: user.name,
        role: DEFAULT_ROLE,
        roles: [],
        legacyRole: user.role,
        customGroup: group,
      }
    }
  }

  const appRoles = roles.length > 0 ? roles : [session.role ?? DEFAULT_ROLE]
  const appRole =
    mapLegacyRoleStringToAppRole(user.role) ?? session.role ?? DEFAULT_ROLE

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: appRole,
    roles: appRoles,
    legacyRole: user.role,
    customGroup: null,
  }
}

export async function requireUser(): Promise<AuthUser> {
  const user = await getCurrentUser()
  if (!user) throw new Error('Non authentifié.')
  return user
}

export async function requireUserId(): Promise<bigint> {
  const user = await requireUser()
  return user.id
}
