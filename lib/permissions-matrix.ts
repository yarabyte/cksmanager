import { z } from "zod"
import type { Action, CustomGroup, Module, Role } from "@/lib/types"

export const ALL_ROLES: Role[] = [
  "Admin",
  "Manager",
  "Médecin",
  "Front Office",
  "Caisse",
  "Pharmacie",
  "Commis Pharmacie",
]

export const ALL_MODULES: Module[] = [
  "dashboard",
  "patients",
  "visites",
  "feuilleCirculation",
  "prescriptions",
  "facturation",
  "pharmacie",
  "caisse",
  "configuration",
]

export const ALL_ACTIONS: Action[] = ["view", "create", "edit", "delete"]

export type PermissionMatrix = Record<Role, Record<Module, Action[]>>

/** Configuration complète stockée en base : rôles fixes + groupes personnalisés. */
export type StoredPermissionsConfig = {
  matrix: PermissionMatrix
  customGroups: CustomGroup[]
}

const actionSchema = z.enum(["view", "create", "edit", "delete"])
const moduleSchema = z.enum([
  "dashboard",
  "patients",
  "visites",
  "feuilleCirculation",
  "prescriptions",
  "facturation",
  "pharmacie",
  "caisse",
  "configuration",
])
const roleSchema = z.enum([
  "Admin",
  "Manager",
  "Médecin",
  "Front Office",
  "Caisse",
  "Pharmacie",
  "Commis Pharmacie",
])

const matrixSchema = z.record(
  roleSchema,
  z.record(moduleSchema, z.array(actionSchema)),
)

const customGroupSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  pages: z.array(z.string()),
  permissions: z.record(moduleSchema, z.array(actionSchema)),
})

const storedConfigSchema = z.object({
  matrix: matrixSchema,
  customGroups: z.array(customGroupSchema).optional(),
})

export function clonePermissionMatrix(matrix: PermissionMatrix): PermissionMatrix {
  return structuredClone(matrix)
}

/** Applique les règles de cohérence (dashboard=voir seul, voir auto-ajouté) à un jeu d'actions. */
function normalizeModuleActions(module: Module, actions: Action[]): Action[] {
  const clean = [...new Set(actions)].filter((a) => ALL_ACTIONS.includes(a))
  if (module === "dashboard") {
    return clean.includes("view") ? ["view"] : []
  }
  const withoutView = clean.filter((a) => a !== "view")
  if (withoutView.length > 0) return ["view", ...withoutView] as Action[]
  return clean.includes("view") ? ["view"] : []
}

/** Normalise un jeu de permissions par module (rôle fixe ou groupe personnalisé). */
export function normalizePermissionsRecord(
  record: Partial<Record<Module, Action[]>> | undefined,
): Record<Module, Action[]> {
  const out = {} as Record<Module, Action[]>
  for (const mod of ALL_MODULES) {
    out[mod] = normalizeModuleActions(mod, record?.[mod] ?? [])
  }
  return out
}

export function normalizePermissionMatrix(matrix: PermissionMatrix): PermissionMatrix {
  const out = {} as PermissionMatrix
  for (const role of ALL_ROLES) {
    out[role] = normalizePermissionsRecord(matrix[role])
  }
  return out
}

export function normalizeCustomGroup(group: {
  id: string
  label: string
  pages: string[]
  permissions?: Partial<Record<Module, Action[]>>
}): CustomGroup {
  return {
    id: group.id,
    label: group.label,
    pages: [...new Set(group.pages)],
    permissions: normalizePermissionsRecord(group.permissions),
  }
}

/** Rétro-compatible : accepte l'ancien format (matrice brute) ou le nouveau ({matrix, customGroups}). */
export function parseStoredPermissionsConfig(raw: unknown): StoredPermissionsConfig {
  if (raw && typeof raw === "object" && "matrix" in (raw as Record<string, unknown>)) {
    const parsed = storedConfigSchema.parse(raw)
    return {
      matrix: normalizePermissionMatrix(parsed.matrix as PermissionMatrix),
      customGroups: (parsed.customGroups ?? []).map(normalizeCustomGroup),
    }
  }
  const matrix = matrixSchema.parse(raw) as PermissionMatrix
  return { matrix: normalizePermissionMatrix(matrix), customGroups: [] }
}

/** @deprecated Préférer parseStoredPermissionsConfig — conservé pour compat. */
export function parsePermissionMatrix(raw: unknown): PermissionMatrix {
  return parseStoredPermissionsConfig(raw).matrix
}

export function togglePermission(
  matrix: PermissionMatrix,
  role: Role,
  module: Module,
  action: Action,
  enabled: boolean,
): PermissionMatrix {
  const next = clonePermissionMatrix(matrix)
  next[role][module] = toggleActionSet(next[role][module] ?? [], module, action, enabled)
  return normalizePermissionMatrix(next)
}

/** Bascule une action dans un jeu de permissions (rôle fixe ou groupe personnalisé). */
export function toggleActionSet(
  current: Action[],
  module: Module,
  action: Action,
  enabled: boolean,
): Action[] {
  const set = new Set(current)
  if (module === "dashboard") {
    if (enabled) set.add("view")
    else set.clear()
    return normalizeModuleActions(module, [...set])
  }
  if (enabled) {
    if (action !== "view") set.add("view")
    set.add(action)
  } else if (action === "view") {
    set.clear()
  } else {
    set.delete(action)
  }
  return normalizeModuleActions(module, [...set])
}

export function matricesEqual(a: PermissionMatrix, b: PermissionMatrix): boolean {
  return JSON.stringify(a) === JSON.stringify(b)
}

/** Génère un id de groupe (slug) unique, en évitant les rôles fixes et les groupes existants. */
export function slugifyGroupId(label: string, existingIds: string[]): string {
  const base =
    label
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "groupe"
  const reserved = new Set(ALL_ROLES.map((r) => r.toLowerCase()))
  const taken = new Set([...existingIds, ...reserved])
  if (!taken.has(base)) return base
  let i = 2
  while (taken.has(`${base}-${i}`)) i++
  return `${base}-${i}`
}
