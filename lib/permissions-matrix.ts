import { z } from "zod"
import type { Action, Module, Role } from "@/lib/types"

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
  "prescriptions",
  "facturation",
  "pharmacie",
  "caisse",
  "configuration",
]

export const ALL_ACTIONS: Action[] = ["view", "create", "edit", "delete"]

export type PermissionMatrix = Record<Role, Record<Module, Action[]>>

const actionSchema = z.enum(["view", "create", "edit", "delete"])
const moduleSchema = z.enum([
  "dashboard",
  "patients",
  "visites",
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

export function clonePermissionMatrix(matrix: PermissionMatrix): PermissionMatrix {
  return structuredClone(matrix)
}

export function parsePermissionMatrix(raw: unknown): PermissionMatrix {
  const parsed = matrixSchema.parse(raw) as PermissionMatrix
  return normalizePermissionMatrix(parsed)
}

export function normalizePermissionMatrix(matrix: PermissionMatrix): PermissionMatrix {
  const out = {} as PermissionMatrix
  for (const role of ALL_ROLES) {
    out[role] = {} as Record<Module, Action[]>
    for (const mod of ALL_MODULES) {
      const actions = [...new Set(matrix[role]?.[mod] ?? [])].filter((a) =>
        ALL_ACTIONS.includes(a),
      )
      if (mod === "dashboard") {
        out[role][mod] = actions.includes("view") ? ["view"] : []
        continue
      }
      const withoutView = actions.filter((a) => a !== "view")
      out[role][mod] =
        withoutView.length > 0
          ? (["view", ...withoutView] as Action[])
          : actions.includes("view")
            ? ["view"]
            : []
    }
  }
  return out
}

export function togglePermission(
  matrix: PermissionMatrix,
  role: Role,
  module: Module,
  action: Action,
  enabled: boolean,
): PermissionMatrix {
  const next = clonePermissionMatrix(matrix)
  const current = new Set(next[role][module] ?? [])

  if (module === "dashboard") {
    if (enabled) current.add("view")
    else current.clear()
    next[role][module] = [...current]
    return normalizePermissionMatrix(next)
  }

  if (enabled) {
    if (action !== "view") current.add("view")
    current.add(action)
  } else if (action === "view") {
    current.clear()
  } else {
    current.delete(action)
  }

  next[role][module] = [...current]
  return normalizePermissionMatrix(next)
}

export function matricesEqual(a: PermissionMatrix, b: PermissionMatrix): boolean {
  return JSON.stringify(a) === JSON.stringify(b)
}
