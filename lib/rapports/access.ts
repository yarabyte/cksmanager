import { redirect } from 'next/navigation'
import { getCurrentUser, requireUser } from '@/lib/auth/session'
import { userHasAnyRole } from '@/lib/user-role'
import type { Role } from '@/lib/types'

const RAPPORTS_ROLES: Role[] = ['Admin', 'Manager']

export async function requireRapportsPageAccess() {
  const user = await getCurrentUser()
  if (!user || !userHasAnyRole(user.roles, RAPPORTS_ROLES)) {
    redirect('/dashboard')
  }
  return user
}

export async function requireRapportsManager() {
  const user = await requireUser()
  if (!userHasAnyRole(user.roles, RAPPORTS_ROLES)) {
    throw new Error('Accès réservé au Manager et à l’Admin.')
  }
  return user
}

export function canAccessRapports(role: Role | Role[] | null | undefined): boolean {
  const roles = Array.isArray(role) ? role : role ? [role] : []
  return userHasAnyRole(roles, RAPPORTS_ROLES)
}
