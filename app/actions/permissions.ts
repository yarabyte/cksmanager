'use server'

import { revalidatePath } from 'next/cache'
import { requireUser } from '@/lib/auth/session'
import {
  DEFAULT_PERMISSION_MATRIX,
  hasPermissionWithMatrixAny,
} from '@/lib/permissions'
import {
  loadPermissionMatrix,
  savePermissionMatrixToDb,
} from '@/lib/permissions-server'
import {
  clonePermissionMatrix,
  normalizePermissionMatrix,
  parsePermissionMatrix,
  type PermissionMatrix,
} from '@/lib/permissions-matrix'
import type { Role } from '@/lib/types'

export type PermissionsConfigData = {
  matrix: PermissionMatrix
  canEdit: boolean
}

export async function getPermissionsConfig(): Promise<PermissionsConfigData> {
  const user = await requireUser()
  const matrix = await loadPermissionMatrix()
  const canEdit =
    user.roles.includes('Admin') ||
    hasPermissionWithMatrixAny(matrix, user.roles, 'configuration', 'edit')
  return { matrix, canEdit }
}

/** @deprecated Utiliser getPermissionsConfig */
export async function getPermissionMatrixForConfig(): Promise<PermissionMatrix> {
  const { matrix } = await getPermissionsConfig()
  return matrix
}

async function assertCanManagePermissions() {
  const { canEdit } = await getPermissionsConfig()
  if (!canEdit) {
    throw new Error('Accès refusé.')
  }
}

export async function savePermissionMatrix(
  data: unknown,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await assertCanManagePermissions()
    const matrix = parsePermissionMatrix(data)
    await savePermissionMatrixToDb(matrix)
    revalidatePath('/configuration/utilisateurs')
    return { ok: true }
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : 'Erreur lors de la sauvegarde.',
    }
  }
}

export async function resetPermissionMatrixToDefaults(): Promise<
  { ok: true; matrix: PermissionMatrix } | { ok: false; error: string }
> {
  try {
    await assertCanManagePermissions()
    const matrix = clonePermissionMatrix(DEFAULT_PERMISSION_MATRIX)
    await savePermissionMatrixToDb(matrix)
    revalidatePath('/configuration/utilisateurs')
    return { ok: true, matrix: normalizePermissionMatrix(matrix) }
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : 'Erreur lors de la réinitialisation.',
    }
  }
}

export async function updateRolePermissions(
  role: Role,
  data: unknown,
): Promise<{ ok: true; matrix: PermissionMatrix } | { ok: false; error: string }> {
  try {
    await assertCanManagePermissions()
    const matrix = await loadPermissionMatrix()
    const rolePerms = parsePermissionMatrix({ [role]: data })[role]
    matrix[role] = rolePerms
    const normalized = normalizePermissionMatrix(matrix)
    await savePermissionMatrixToDb(normalized)
    revalidatePath('/configuration/utilisateurs')
    return { ok: true, matrix: normalized }
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : 'Erreur lors de la mise à jour.',
    }
  }
}
