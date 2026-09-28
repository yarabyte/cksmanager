'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { requireUser } from '@/lib/auth/session'
import {
  DEFAULT_PERMISSION_MATRIX,
  hasPermissionWithMatrixAny,
} from '@/lib/permissions'
import {
  countUsersInCustomGroup,
  createCustomGroupInDb,
  deleteCustomGroupInDb,
  loadPermissionsConfig,
  savePermissionMatrixToDb,
  updateCustomGroupInDb,
} from '@/lib/permissions-server'
import {
  clonePermissionMatrix,
  normalizePermissionMatrix,
  normalizePermissionsRecord,
  parsePermissionMatrix,
  type PermissionMatrix,
} from '@/lib/permissions-matrix'
import type { Action, CustomGroup, Module, Role } from '@/lib/types'

export type PermissionsConfigData = {
  matrix: PermissionMatrix
  customGroups: CustomGroup[]
  canEdit: boolean
}

export async function getPermissionsConfig(): Promise<PermissionsConfigData> {
  const user = await requireUser()
  const { matrix, customGroups } = await loadPermissionsConfig()
  const canEdit =
    user.roles.includes('Admin') ||
    hasPermissionWithMatrixAny(matrix, user.roles, 'configuration', 'edit')
  return { matrix, customGroups, canEdit }
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
    const matrix = await loadPermissionsConfig().then((c) => c.matrix)
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

const customGroupInputSchema = z.object({
  id: z.string().optional(),
  label: z.string().trim().min(1, 'Nom du groupe requis.').max(80),
  pages: z.array(z.string()),
  permissions: z.record(z.string(), z.array(z.string())).optional(),
})

/** Crée un nouveau groupe personnalisé, ou met à jour un groupe existant (label/pages/permissions). */
export async function saveCustomGroup(
  data: unknown,
): Promise<{ ok: true; group: CustomGroup } | { ok: false; error: string }> {
  try {
    await assertCanManagePermissions()
    const parsed = customGroupInputSchema.parse(data)
    const permissions = normalizePermissionsRecord(
      (parsed.permissions ?? {}) as Partial<Record<Module, Action[]>>,
    )

    let group: CustomGroup
    if (parsed.id) {
      group = await updateCustomGroupInDb(parsed.id, {
        label: parsed.label,
        pages: parsed.pages,
        permissions,
      })
    } else {
      group = await createCustomGroupInDb({ label: parsed.label, pages: parsed.pages })
      const hasPermissions = Object.values(permissions).some((actions) => actions.length > 0)
      if (hasPermissions) {
        group = await updateCustomGroupInDb(group.id, { permissions })
      }
    }

    revalidatePath('/configuration/utilisateurs')
    return { ok: true, group }
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Erreur lors de l'enregistrement du groupe.",
    }
  }
}

export async function deleteCustomGroup(
  id: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await assertCanManagePermissions()
    const usersCount = await countUsersInCustomGroup(id)
    if (usersCount > 0) {
      return {
        ok: false,
        error: `Ce groupe est assigné à ${usersCount} utilisateur${usersCount > 1 ? 's' : ''}. Réassignez-les avant de le supprimer.`,
      }
    }
    await deleteCustomGroupInDb(id)
    revalidatePath('/configuration/utilisateurs')
    return { ok: true }
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : 'Erreur lors de la suppression du groupe.',
    }
  }
}
