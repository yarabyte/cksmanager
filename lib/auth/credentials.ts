import { compare } from 'bcrypt'
import { prisma } from '@/lib/prisma'
import { loadPermissionsConfig } from '@/lib/permissions-server'
import {
  customGroupLooksLikeSageFemme,
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

  let roles = mapLegacyRoleStringToAppRoles(user.role)
  if (roles.length === 0 && user.role?.trim()) {
    const { customGroups } = await loadPermissionsConfig()
    const group = customGroups.find((g) => g.id === user.role!.trim())
    if (group && customGroupLooksLikeSageFemme(group)) {
      roles = ['Sage femme']
    }
  }
  const appRoles = roles.length > 0 ? roles : [DEFAULT_ROLE]
  const appRole = mapLegacyRoleStringToAppRole(user.role) ?? (roles[0] ?? DEFAULT_ROLE)
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
