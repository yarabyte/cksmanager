import type { Role, Module, Action } from "./types"
import {
  ALL_ACTIONS,
  ALL_MODULES,
  ALL_ROLES,
  normalizePermissionMatrix,
  type PermissionMatrix,
} from "./permissions-matrix"

export { ALL_ROLES, ALL_MODULES, ALL_ACTIONS }
export type { PermissionMatrix }

export const DEFAULT_PERMISSION_MATRIX: PermissionMatrix = normalizePermissionMatrix({
  Admin: {
    dashboard: ["view"],
    patients: ["view", "create", "edit", "delete"],
    visites: ["view", "create", "edit", "delete"],
    prescriptions: ["view", "create", "edit", "delete"],
    facturation: ["view", "create", "edit", "delete"],
    pharmacie: ["view", "create", "edit", "delete"],
    caisse: ["view", "create", "edit", "delete"],
    configuration: ["view", "create", "edit", "delete"],
  },
  Manager: {
    dashboard: ["view"],
    patients: ["view", "create", "edit"],
    visites: ["view", "create", "edit"],
    prescriptions: ["view", "create", "edit"],
    facturation: ["view", "create", "edit"],
    pharmacie: ["view", "create", "edit"],
    caisse: ["view"],
    configuration: ["view", "create", "edit"],
  },
  Médecin: {
    dashboard: ["view"],
    patients: ["view", "edit"],
    visites: ["view", "create", "edit"],
    prescriptions: ["view", "create", "edit"],
    facturation: ["view"],
    pharmacie: ["view"],
    caisse: [],
    configuration: [],
  },
  "Front Office": {
    dashboard: ["view"],
    patients: ["view", "create", "edit"],
    visites: ["view", "create"],
    prescriptions: [],
    facturation: ["view"],
    pharmacie: [],
    caisse: [],
    configuration: [],
  },
  Caisse: {
    dashboard: ["view"],
    patients: ["view"],
    visites: ["view"],
    prescriptions: ["view"],
    facturation: ["view", "create", "edit"],
    pharmacie: [],
    caisse: ["view", "create", "edit"],
    configuration: [],
  },
  Pharmacie: {
    dashboard: ["view"],
    patients: ["view"],
    visites: ["view"],
    prescriptions: ["view"],
    facturation: [],
    pharmacie: ["view", "create", "edit"],
    caisse: [],
    configuration: [],
  },
  "Commis Pharmacie": {
    dashboard: ["view"],
    patients: ["view"],
    visites: [],
    prescriptions: ["view"],
    facturation: ["view"],
    pharmacie: ["view", "create", "edit"],
    caisse: [],
    configuration: [],
  },
})

export function hasPermissionWithMatrix(
  matrix: PermissionMatrix,
  role: Role,
  module: Module,
  action: Action,
): boolean {
  const moduleActions = matrix[role]?.[module]
  if (!moduleActions) return false
  return moduleActions.includes(action)
}

/** Permission accordée si au moins un des rôles l’autorise. */
export function hasPermissionWithMatrixAny(
  matrix: PermissionMatrix,
  roles: Role[],
  module: Module,
  action: Action,
): boolean {
  return roles.some((role) => hasPermissionWithMatrix(matrix, role, module, action))
}

/** @deprecated Préférer hasPermissionWithMatrix avec la matrice chargée côté serveur */
export function hasPermission(role: Role, module: Module, action: Action): boolean {
  return hasPermissionWithMatrix(DEFAULT_PERMISSION_MATRIX, role, module, action)
}

export function canAccessModuleWithMatrix(
  matrix: PermissionMatrix,
  role: Role,
  module: Module,
): boolean {
  const moduleActions = matrix[role]?.[module]
  return Boolean(moduleActions && moduleActions.length > 0)
}

export function getPermissionsForRoleFromMatrix(
  matrix: PermissionMatrix,
  role: Role,
): Record<Module, Action[]> {
  return matrix[role] ?? ({} as Record<Module, Action[]>)
}

export function getPermissionsForRole(role: Role): Record<Module, Action[]> {
  return getPermissionsForRoleFromMatrix(DEFAULT_PERMISSION_MATRIX, role)
}

export function getAccessibleModulesFromMatrix(
  matrix: PermissionMatrix,
  role: Role,
): Module[] {
  return ALL_MODULES.filter((mod) => canAccessModuleWithMatrix(matrix, role, mod))
}

export function countRolePermissionsFromMatrix(
  matrix: PermissionMatrix,
  role: Role,
): { moduleCount: number; actionCount: number } {
  const perms = getPermissionsForRoleFromMatrix(matrix, role)
  let actionCount = 0
  let moduleCount = 0
  for (const mod of ALL_MODULES) {
    const actions = perms[mod] ?? []
    if (actions.length > 0) {
      moduleCount += 1
      actionCount += actions.length
    }
  }
  return { moduleCount, actionCount }
}

export function countRolePermissions(role: Role): {
  moduleCount: number
  actionCount: number
} {
  return countRolePermissionsFromMatrix(DEFAULT_PERMISSION_MATRIX, role)
}

export function getPermissionMatrixSnapshot(matrix: PermissionMatrix): PermissionMatrix {
  return normalizePermissionMatrix(matrix)
}
