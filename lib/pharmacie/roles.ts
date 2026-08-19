import { userHasAnyRole } from '@/lib/user-role'
import type { Role } from '@/lib/types'

export const PHARMACIE_GESTION_ROLES: Role[] = ['Admin', 'Manager', 'Pharmacie']
export const PHARMACIE_SORTIE_ROLES: Role[] = [
  'Admin',
  'Manager',
  'Pharmacie',
  'Commis Pharmacie',
]

export function canGererPharmacie(role: Role | Role[] | null | undefined) {
  const roles = Array.isArray(role) ? role : role ? [role] : []
  return userHasAnyRole(roles, PHARMACIE_GESTION_ROLES)
}

export function canValiderSortie(role: Role | Role[] | null | undefined) {
  const roles = Array.isArray(role) ? role : role ? [role] : []
  return userHasAnyRole(roles, PHARMACIE_SORTIE_ROLES)
}
