import { redirect } from "next/navigation"
import { getCurrentUser, requireUser } from "@/lib/auth/session"
import type { AuthUser } from "@/lib/auth/types"
import { authUserHasPermission, canViewPathname } from "@/lib/permissions-access"
import { loadPermissionsConfig } from "@/lib/permissions-server"
import type { Action, CustomGroup, Module } from "@/lib/types"

function resolveAuthUserGroups(user: AuthUser, customGroups: CustomGroup[]): AuthUser {
  if (!user.customGroup) return user
  const fresh = customGroups.find((g) => g.id === user.customGroup!.id)
  return fresh ? { ...user, customGroup: fresh } : user
}

export async function currentUserHasPermission(
  module: Module,
  action: Action,
): Promise<boolean> {
  const user = await getCurrentUser()
  if (!user) return false
  const { matrix, customGroups } = await loadPermissionsConfig()
  return authUserHasPermission(resolveAuthUserGroups(user, customGroups), matrix, module, action)
}

export async function requirePermission(
  module: Module,
  action: Action,
): Promise<AuthUser> {
  const user = await requireUser()
  const { matrix, customGroups } = await loadPermissionsConfig()
  const resolved = resolveAuthUserGroups(user, customGroups)
  if (!authUserHasPermission(resolved, matrix, module, action)) {
    throw new Error("Accès refusé.")
  }
  return resolved
}

/** Contrôle d'accès page : redirige vers le dashboard si le module n'est pas autorisé. */
export async function requirePageView(pathname: string): Promise<AuthUser> {
  const user = await getCurrentUser()
  if (!user) redirect("/api/auth/logout")
  const { matrix, customGroups } = await loadPermissionsConfig()
  const resolved = resolveAuthUserGroups(user, customGroups)
  if (!canViewPathname(resolved, matrix, pathname)) {
    redirect("/dashboard")
  }
  return resolved
}
