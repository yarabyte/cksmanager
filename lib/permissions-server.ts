import type { Prisma } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { DEFAULT_PERMISSION_MATRIX, hasPermissionWithMatrix } from "@/lib/permissions"
import {
  clonePermissionMatrix,
  normalizeCustomGroup,
  normalizePermissionMatrix,
  parseStoredPermissionsConfig,
  slugifyGroupId,
  type PermissionMatrix,
  type StoredPermissionsConfig,
} from "@/lib/permissions-matrix"
import type { Action, CustomGroup, Module, Role } from "@/lib/types"

function emptyConfig(): StoredPermissionsConfig {
  return { matrix: clonePermissionMatrix(DEFAULT_PERMISSION_MATRIX), customGroups: [] }
}

export async function loadPermissionsConfig(): Promise<StoredPermissionsConfig> {
  const row = await prisma.parametre.findFirst({
    select: { rolePermissions: true },
  })
  if (!row?.rolePermissions) return emptyConfig()
  try {
    return parseStoredPermissionsConfig(row.rolePermissions)
  } catch {
    return emptyConfig()
  }
}

export async function saveStoredPermissionsConfig(
  config: StoredPermissionsConfig,
): Promise<void> {
  const normalized: StoredPermissionsConfig = {
    matrix: normalizePermissionMatrix(config.matrix),
    customGroups: config.customGroups.map(normalizeCustomGroup),
  }
  const rolePermissions = normalized as unknown as Prisma.InputJsonValue
  const existing = await prisma.parametre.findFirst({ select: { id: true } })
  if (existing) {
    await prisma.parametre.update({
      where: { id: existing.id },
      data: { rolePermissions },
    })
    return
  }
  await prisma.parametre.create({
    data: { rolePermissions },
  })
}

export async function loadPermissionMatrix(): Promise<PermissionMatrix> {
  return (await loadPermissionsConfig()).matrix
}

/** @deprecated Préférer saveStoredPermissionsConfig — conserve les groupes personnalisés existants. */
export async function savePermissionMatrixToDb(matrix: PermissionMatrix): Promise<void> {
  const current = await loadPermissionsConfig()
  await saveStoredPermissionsConfig({ matrix, customGroups: current.customGroups })
}

export async function createCustomGroupInDb(input: {
  label: string
  pages: string[]
}): Promise<CustomGroup> {
  const config = await loadPermissionsConfig()
  const id = slugifyGroupId(
    input.label,
    config.customGroups.map((g) => g.id),
  )
  const group: CustomGroup = normalizeCustomGroup({
    id,
    label: input.label.trim(),
    pages: input.pages,
    permissions: {} as Record<Module, Action[]>,
  })
  await saveStoredPermissionsConfig({
    matrix: config.matrix,
    customGroups: [...config.customGroups, group],
  })
  return group
}

export async function updateCustomGroupInDb(
  id: string,
  patch: Partial<Pick<CustomGroup, "label" | "pages" | "permissions">>,
): Promise<CustomGroup> {
  const config = await loadPermissionsConfig()
  const idx = config.customGroups.findIndex((g) => g.id === id)
  if (idx === -1) throw new Error("Groupe introuvable.")
  const merged = normalizeCustomGroup({ ...config.customGroups[idx]!, ...patch })
  const nextGroups = [...config.customGroups]
  nextGroups[idx] = merged
  await saveStoredPermissionsConfig({ matrix: config.matrix, customGroups: nextGroups })
  return merged
}

export async function deleteCustomGroupInDb(id: string): Promise<void> {
  const config = await loadPermissionsConfig()
  await saveStoredPermissionsConfig({
    matrix: config.matrix,
    customGroups: config.customGroups.filter((g) => g.id !== id),
  })
}

export async function countUsersInCustomGroup(id: string): Promise<number> {
  return prisma.user.count({ where: { role: id } })
}

export async function hasPermissionForRole(
  role: Role | null,
  module: Module,
  action: Action,
): Promise<boolean> {
  if (!role) return false
  const matrix = await loadPermissionMatrix()
  return hasPermissionWithMatrix(matrix, role, module, action)
}

export async function hasPermissionForRoles(
  roles: Role[] | null | undefined,
  module: Module,
  action: Action,
): Promise<boolean> {
  if (!roles?.length) return false
  const matrix = await loadPermissionMatrix()
  return roles.some((role) => hasPermissionWithMatrix(matrix, role, module, action))
}
