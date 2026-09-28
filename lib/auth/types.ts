import type { CustomGroup, Role } from '@/lib/types'

export type AuthUser = {
  id: bigint
  email: string
  name: string
  /** Rôle principal (affichage). */
  role: Role
  /** Tous les rôles de l’utilisateur. */
  roles: Role[]
  legacyRole: string | null
  /** Défini si le compte appartient à un groupe personnalisé plutôt qu'à un rôle fixe. */
  customGroup?: CustomGroup | null
}

export type SessionPayload = {
  userId: string
  email: string
  name: string
  role: Role
  roles?: Role[]
  legacyRole: string | null
}

export type SidebarUser = {
  id: string
  firstName: string
  lastName: string
  email: string
  role: Role
  roles: Role[]
  customGroup?: { id: string; label: string; pages: string[] } | null
}

export function splitUserName(name: string): { firstName: string; lastName: string } {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return { firstName: 'Utilisateur', lastName: '' }
  if (parts.length === 1) return { firstName: parts[0]!, lastName: '' }
  return {
    firstName: parts.slice(0, -1).join(' '),
    lastName: parts[parts.length - 1]!,
  }
}

export function toSidebarUser(user: AuthUser): SidebarUser {
  const { firstName, lastName } = splitUserName(user.name)
  return {
    id: user.id.toString(),
    firstName,
    lastName,
    email: user.email,
    role: user.role,
    roles: user.roles,
    customGroup: user.customGroup
      ? { id: user.customGroup.id, label: user.customGroup.label, pages: user.customGroup.pages }
      : null,
  }
}
