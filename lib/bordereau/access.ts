import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth/session'
import type { AuthUser } from '@/lib/auth/types'
import {
  authUserHasPermission,
  rolesAlwaysCanManageBordereaux,
} from '@/lib/permissions-access'
import { loadPermissionsConfig } from '@/lib/permissions-server'
import type { Role } from '@/lib/types'

/** Admin et Manager : toujours. Autres rôles : droit « Assurances : voir ». */
export async function userCanManageBordereaux(
  user: Pick<AuthUser, 'roles' | 'customGroup'>,
): Promise<boolean> {
  if (rolesAlwaysCanManageBordereaux(user.roles)) return true
  const { matrix, customGroups } = await loadPermissionsConfig()
  const customGroup = user.customGroup
    ? (customGroups.find((g) => g.id === user.customGroup!.id) ?? user.customGroup)
    : null
  return authUserHasPermission({ ...user, customGroup }, matrix, 'assurances', 'view')
}

export async function requireBordereauPageAccess() {
  const user = await getCurrentUser()
  if (!user || !(await userCanManageBordereaux(user))) {
    redirect('/facturation')
  }
  return user
}

export function canManageBordereaux(role: Role | Role[] | null | undefined): boolean {
  const roles = Array.isArray(role) ? role : role ? [role] : []
  return rolesAlwaysCanManageBordereaux(roles)
}
