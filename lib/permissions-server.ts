import { prisma } from "@/lib/prisma"
import { DEFAULT_PERMISSION_MATRIX, hasPermissionWithMatrix } from "@/lib/permissions"
import {
  clonePermissionMatrix,
  normalizePermissionMatrix,
  parsePermissionMatrix,
  type PermissionMatrix,
} from "@/lib/permissions-matrix"
import type { Action, Module, Role } from "@/lib/types"

export async function loadPermissionMatrix(): Promise<PermissionMatrix> {
  const row = await prisma.parametre.findFirst({
    select: { rolePermissions: true },
  })
  if (!row?.rolePermissions) {
    return clonePermissionMatrix(DEFAULT_PERMISSION_MATRIX)
  }
  try {
    return parsePermissionMatrix(row.rolePermissions)
  } catch {
    return clonePermissionMatrix(DEFAULT_PERMISSION_MATRIX)
  }
}

export async function savePermissionMatrixToDb(matrix: PermissionMatrix): Promise<void> {
  const normalized = normalizePermissionMatrix(matrix)
  const existing = await prisma.parametre.findFirst({ select: { id: true } })
  if (existing) {
    await prisma.parametre.update({
      where: { id: existing.id },
      data: { rolePermissions: normalized },
    })
    return
  }
  await prisma.parametre.create({
    data: { rolePermissions: normalized },
  })
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
