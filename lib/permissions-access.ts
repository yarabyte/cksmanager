import type { AuthUser } from "@/lib/auth/types"
import type { Action, CustomGroup, Module } from "@/lib/types"
import { userIsAdmin } from "@/lib/user-role"
import { hasPermissionWithMatrixAny } from "@/lib/permissions"
import type { PermissionMatrix } from "@/lib/permissions-matrix"

/** Routes toujours accessibles une fois connecté. */
const OPEN_PATH_PREFIXES = ["/dashboard", "/notifications", "/composants"]

/**
 * Plus long préfixe en premier.
 * Bordereaux / recouvrement assureur → module assurances.
 */
const PATH_MODULES: { prefix: string; module: Module }[] = [
  { prefix: "/facturation/bordereaux", module: "assurances" },
  { prefix: "/assurances", module: "assurances" },
  { prefix: "/configuration", module: "configuration" },
  { prefix: "/facturation", module: "facturation" },
  { prefix: "/pharmacie", module: "pharmacie" },
  { prefix: "/caisse", module: "caisse" },
  { prefix: "/cloture", module: "caisse" },
  { prefix: "/hospitalisation", module: "hospitalisation" },
  { prefix: "/feuilles-circulation", module: "feuilleCirculation" },
  { prefix: "/prescriptions", module: "prescriptions" },
  { prefix: "/patients", module: "patients" },
  { prefix: "/visites", module: "visites" },
  { prefix: "/medical", module: "medical" },
  { prefix: "/rapports", module: "rapports" },
  { prefix: "/planning", module: "planning" },
  { prefix: "/rendez-vous", module: "planning" },
]

/** Gestion des versements sortants : Admin uniquement. */
export function isVersementsManagementPath(pathname: string): boolean {
  const path = pathname.split("?")[0] ?? pathname
  return path === "/caisse/versements" || path.startsWith("/caisse/versements/")
}

export function moduleForPathname(pathname: string): Module | null {
  const path = pathname.split("?")[0] ?? pathname
  if (!path || path === "/") return "dashboard"
  if (OPEN_PATH_PREFIXES.some((p) => path === p || path.startsWith(`${p}/`))) {
    return null
  }
  for (const { prefix, module } of PATH_MODULES) {
    if (path === prefix || path.startsWith(`${prefix}/`)) return module
  }
  return null
}

function customGroupHasAction(
  group: CustomGroup,
  module: Module,
  action: Action,
): boolean {
  const allowed = group.permissions?.[module] ?? []
  if (allowed.includes(action)) return true
  if (action !== "view") return false
  return (group.pages ?? []).some((href) => moduleForPathname(href) === module)
}

function customGroupCanViewPath(group: CustomGroup, pathname: string): boolean {
  const path = pathname.split("?")[0] ?? pathname
  if ((group.pages ?? []).some((href) => path === href || path.startsWith(`${href}/`))) {
    return true
  }
  const module = moduleForPathname(path)
  if (!module) return true
  return customGroupHasAction(group, module, "view")
}

/** Droits effectifs : rôles (union) ou groupe personnalisé. */
export function authUserHasPermission(
  user: Pick<AuthUser, "roles" | "customGroup">,
  matrix: PermissionMatrix,
  module: Module,
  action: Action,
): boolean {
  if (user.customGroup) {
    return customGroupHasAction(user.customGroup, module, action)
  }
  return hasPermissionWithMatrixAny(matrix, user.roles, module, action)
}

export function canViewPathname(
  user: Pick<AuthUser, "roles" | "customGroup">,
  matrix: PermissionMatrix,
  pathname: string,
): boolean {
  const path = pathname.split("?")[0] ?? pathname
  if (!path || OPEN_PATH_PREFIXES.some((p) => path === p || path.startsWith(`${p}/`))) {
    return true
  }
  if (isVersementsManagementPath(path) && !userIsAdmin(user.roles)) {
    return false
  }
  if (user.customGroup) {
    return customGroupCanViewPath(user.customGroup, path)
  }
  const module = moduleForPathname(path)
  if (!module) return true
  return hasPermissionWithMatrixAny(matrix, user.roles, module, "view")
}
