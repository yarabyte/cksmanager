import { compare } from 'bcrypt'
import { prisma } from '@/lib/prisma'
import {
  mapLegacyRoleStringToAppRole,
  mapLegacyRoleStringToAppRoles,
} from '@/lib/user-role'
import type { Role } from '@/lib/types'
import { createSessionToken, setSessionCookie } from './session'
import type { SessionPayload } from './types'

const DEFAULT_ROLE: Role = 'Front Office'

export async function authenticateUser(
  email: string,
  password: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const user = await prisma.user.findFirst({
    where: { email: { equals: email.trim(), mode: 'insensitive' } },
    select: { id: true, email: true, name: true, password: true, role: true, actif: true },
  })

  if (!user || !user.actif) {
    return { ok: false, error: 'Identifiants incorrects.' }
  }

  const valid = await compare(password, user.password)
  if (!valid) {
    return { ok: false, error: 'Identifiants incorrects.' }
  }

  const roles = mapLegacyRoleStringToAppRoles(user.role)
  const appRoles = roles.length > 0 ? roles : [DEFAULT_ROLE]
  const appRole = mapLegacyRoleStringToAppRole(user.role) ?? DEFAULT_ROLE
  const payload: SessionPayload = {
    userId: user.id.toString(),
    email: user.email,
    name: user.name,
    role: appRole,
    roles: appRoles,
    legacyRole: user.role,
  }

  const token = await createSessionToken(payload)
  await setSessionCookie(token)
  return { ok: true }
}
