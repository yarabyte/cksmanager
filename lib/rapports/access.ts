import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth/session'
import {
  currentUserHasPermission,
  requirePermission,
} from '@/lib/permissions-guard'
import { hasPermissionWithMatrixAny } from '@/lib/permissions'
import { DEFAULT_PERMISSION_MATRIX } from '@/lib/permissions'
import type { Role } from '@/lib/types'
import type { AuthUser } from '@/lib/auth/types'

export async function requireRapportsPageAccess(): Promise<AuthUser> {
  const user = await getCurrentUser()
  if (!user) redirect('/api/auth/logout')
  if (!(await currentUserHasPermission('rapports', 'view'))) {
    redirect('/dashboard')
  }
  return user
}

export async function requireRapportsManager(): Promise<AuthUser> {
  return requirePermission('rapports', 'view')
}

/** @deprecated Préférer currentUserHasPermission('rapports', 'view') */
export function canAccessRapports(role: Role | Role[] | null | undefined): boolean {
  const roles = Array.isArray(role) ? role : role ? [role] : []
  return hasPermissionWithMatrixAny(DEFAULT_PERMISSION_MATRIX, roles, 'rapports', 'view')
}
