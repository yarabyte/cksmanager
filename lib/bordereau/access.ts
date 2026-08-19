import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth/session'
import { userHasAnyRole } from '@/lib/user-role'
import type { Role } from '@/lib/types'

const BORDEREAU_ROLES: Role[] = ['Admin', 'Manager']

export async function requireBordereauPageAccess() {
  const user = await getCurrentUser()
  if (!user || !userHasAnyRole(user.roles, BORDEREAU_ROLES)) {
    redirect('/facturation')
  }
  return user
}

export function canManageBordereaux(role: Role | Role[] | null | undefined): boolean {
  const roles = Array.isArray(role) ? role : role ? [role] : []
  return userHasAnyRole(roles, BORDEREAU_ROLES)
}
