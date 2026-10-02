import { z } from "zod"
import type { Action, CustomGroup, Module, Role } from "@/lib/types"

export const ALL_ROLES: Role[] = [
  "Admin",
  "Manager",
  "Médecin",
  "Sage femme",
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
  "rapports",
  "assurances",
  "medical",
  "planning",
  "hospitalisation",
]

/** Modules en lecture seule : aucune action create/edit/delete n'a de sens pour eux. */
export const VIEW_ONLY_MODULES: Module[] = ["dashboard", "rapports"]

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
  "rapports",
  "assurances",
  "medical",
  "planning",
  "hospitalisation",
])
const roleSchema = z.enum([
  "Admin",
  "Manager",
  "Médecin",
  "Front Office",
  "Caisse",
  "Pharmacie",
  "Commis Pharmacie",
  "Sage femme",
])

const matrixSchema = z.record(
  roleSchema,
  z.record(moduleSchema, z.array(actionSchema)),
)

const customGroupSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  pages: z.array(z.string()),
  permissions: z.record(moduleSchema, z.array(actionSchema)).optional(),
})

const storedConfigSchema = z.object({
  matrix: matrixSchema,
  customGroups: z.array(customGroupSchema).optional(),
})

export function clonePermissionMatrix(matrix: PermissionMatrix): PermissionMatrix {
  return structuredClone(matrix)
}

/** Applique les règles de cohérence (modules en lecture seule, voir auto-ajouté) à un jeu d'actions. */
function normalizeModuleActions(module: Module, actions: Action[]): Action[] {
  const clean = [...new Set(actions)].filter((a) => ALL_ACTIONS.includes(a))
  if (VIEW_ONLY_MODULES.includes(module)) {
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

const HOSPITALISATION_ROLES = new Set<Role>(["Admin", "Manager", "Sage femme"])

const SAGE_FEMME_DEFAULT: Record<Module, Action[]> = {
  dashboard: ["view"],
  patients: ["view", "create", "edit"],
  visites: ["view", "create", "edit"],
  feuilleCirculation: ["view", "create", "edit"],
  prescriptions: ["view", "create", "edit"],
  facturation: ["view"],
  pharmacie: ["view"],
  caisse: [],
  configuration: [],
  rapports: [],
  assurances: [],
  medical: ["view", "create", "edit"],
  planning: ["view", "create", "edit"],
  hospitalisation: ["view", "create", "edit"],
}

/** Modules / rôles ajoutés après coup : si absents d'une config déjà sauvée, on reprend le défaut. */
const ABSENT_MODULE_DEFAULTS: Partial<Record<Role, Partial<Record<Module, Action[]>>>> = {
  Admin: { hospitalisation: ["view", "create", "edit", "delete"] },
  Manager: { hospitalisation: ["view", "create", "edit"] },
  "Sage femme": SAGE_FEMME_DEFAULT,
}

function mergeAbsentModules(matrix: PermissionMatrix): PermissionMatrix {
  const out = {} as PermissionMatrix
  for (const role of ALL_ROLES) {
    const stored = matrix[role]
    const row = {
      ...(role === "Sage femme" && !stored ? SAGE_FEMME_DEFAULT : stored ?? {}),
    } as Record<Module, Action[]>
    const fallbacks = ABSENT_MODULE_DEFAULTS[role]
    if (fallbacks) {
      for (const [mod, actions] of Object.entries(fallbacks) as [Module, Action[]][]) {
        if (!Object.prototype.hasOwnProperty.call(row, mod)) {
          row[mod] = actions
        }
      }
    }
    if (!HOSPITALISATION_ROLES.has(role)) {
      row.hospitalisation = []
    }
    if (role === "Sage femme") {
      for (const [mod, actions] of Object.entries(SAGE_FEMME_DEFAULT) as [
        Module,
        Action[],
      ][]) {
        if (actions.length > 0 && (row[mod]?.length ?? 0) === 0) {
          row[mod] = actions
        }
      }
    }
    if (role === "Front Office") {
      if ((row.patients ?? []).length === 0) {
        row.patients = ["view", "create", "edit"]
      }
      const feuille = row.feuilleCirculation ?? []
      if (feuille.length === 0) {
        row.feuilleCirculation = ["view", "create", "edit"]
      }
    }
    out[role] = row
  }
  return out
}

/** Rétro-compatible : accepte l'ancien format (matrice brute) ou le nouveau ({matrix, customGroups}). */
export function parseStoredPermissionsConfig(raw: unknown): StoredPermissionsConfig {
  if (raw && typeof raw === "object" && "matrix" in (raw as Record<string, unknown>)) {
    const parsed = storedConfigSchema.parse(raw)
    return {
      matrix: normalizePermissionMatrix(
        mergeAbsentModules(parsed.matrix as PermissionMatrix),
      ),
      customGroups: (parsed.customGroups ?? []).map(normalizeCustomGroup),
    }
  }
  const matrix = matrixSchema.parse(raw) as PermissionMatrix
  return {
    matrix: normalizePermissionMatrix(mergeAbsentModules(matrix)),
    customGroups: [],
  }
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
  if (VIEW_ONLY_MODULES.includes(module)) {
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
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "groupe"
  const reserved = new Set(
    ALL_ROLES.flatMap((r) => {
      const lower = r.toLowerCase()
      const slug = lower.replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")
      return [lower, slug, slug.replace(/-/g, "_")]
    }),
  )
  const taken = new Set([...existingIds, ...reserved])
  if (!taken.has(base)) return base
  let i = 2
  while (taken.has(`${base}-${i}`)) i++
  return `${base}-${i}`
}
