"use client"

import * as React from "react"
import Link from "next/link"
import { toast } from "sonner"
import {
  Shield,
  LayoutGrid,
  Table2,
  Users,
  Check,
  Minus,
  Info,
  ArrowRight,
  ChevronRight,
  UserCog,
  Stethoscope,
  Headphones,
  Wallet,
  Pill,
  Loader2,
  Save,
  RotateCcw,
  Pencil,
  Lock,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  resetPermissionMatrixToDefaults,
  savePermissionMatrix,
} from "@/app/actions/permissions"
import {
  ALL_ACTIONS,
  ALL_MODULES,
  ALL_ROLES,
  countRolePermissionsFromMatrix,
  getPermissionsForRoleFromMatrix,
} from "@/lib/permissions"
import { ACTION_META, MODULE_META } from "@/lib/permissions-meta"
import {
  matricesEqual,
  togglePermission,
  type PermissionMatrix,
} from "@/lib/permissions-matrix"
import { getInitialsFromFullName } from "@/lib/user-role"
import type { UserConfigRow } from "@/app/actions/users"
import type { Action, Module, Role } from "@/lib/types"
import { cn } from "@/lib/utils"

const cardSurface =
  "rounded-2xl border border-gray-100 bg-white shadow-[0_2px_12px_rgba(0,0,0,0.06)] transition-all duration-200 ease-in-out"

type PermissionsPanelProps = {
  users: UserConfigRow[]
  initialMatrix: PermissionMatrix
  canEdit: boolean
  selectedRole: Role
  onSelectRole: (role: Role) => void
  onManageUsers: (role: Role) => void
}

function roleAccent(role: Role): string {
  switch (role) {
    case "Admin":
      return "#cd3b86"
    case "Manager":
      return "#7c3aed"
    case "Médecin":
      return "#2563eb"
    case "Front Office":
      return "#d97706"
    case "Caisse":
      return "#059669"
    case "Pharmacie":
      return "#0891b2"
    case "Commis Pharmacie":
      return "#0d9488"
    default:
      return "#6b7280"
  }
}

const ROLE_VISUAL: Record<
  Role,
  { icon: LucideIcon; chipBg: string; chipText: string; chipBorder: string }
> = {
  Admin: {
    icon: Shield,
    chipBg: "bg-[#cd3b86]/10",
    chipText: "text-[#b8307a]",
    chipBorder: "border-[#cd3b86]/20",
  },
  Manager: {
    icon: UserCog,
    chipBg: "bg-violet-50",
    chipText: "text-violet-700",
    chipBorder: "border-violet-200",
  },
  Médecin: {
    icon: Stethoscope,
    chipBg: "bg-blue-50",
    chipText: "text-blue-700",
    chipBorder: "border-blue-200",
  },
  "Front Office": {
    icon: Headphones,
    chipBg: "bg-amber-50",
    chipText: "text-amber-700",
    chipBorder: "border-amber-200",
  },
  Caisse: {
    icon: Wallet,
    chipBg: "bg-emerald-50",
    chipText: "text-emerald-700",
    chipBorder: "border-emerald-200",
  },
  Pharmacie: {
    icon: Pill,
    chipBg: "bg-cyan-50",
    chipText: "text-cyan-700",
    chipBorder: "border-cyan-200",
  },
  "Commis Pharmacie": {
    icon: Pill,
    chipBg: "bg-teal-50",
    chipText: "text-teal-700",
    chipBorder: "border-teal-200",
  },
}

function RoleSelectCard({
  role,
  userCount,
  selected,
  matrix,
  onSelect,
}: {
  role: Role
  userCount: number
  selected: boolean
  matrix: PermissionMatrix
  onSelect: () => void
}) {
  const color = roleAccent(role)
  const visual = ROLE_VISUAL[role]
  const Icon = visual.icon
  const stats = countRolePermissionsFromMatrix(matrix, role)

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        cardSurface,
        "relative flex w-full flex-col gap-3 p-4 text-left transition-all hover:border-gray-200 hover:shadow-[0_4px_16px_rgba(0,0,0,0.05)]",
        selected && "shadow-[0_4px_16px_rgba(0,0,0,0.08)] ring-2",
      )}
      style={
        selected
          ? ({ borderColor: `${color}50`, "--tw-ring-color": `${color}30` } as React.CSSProperties)
          : undefined
      }
    >
      <div className="flex items-start justify-between gap-2">
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
          style={{ backgroundColor: `${color}14`, color }}
        >
          <Icon className="h-5 w-5" />
        </div>
        <div
          className={cn(
            "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors",
            selected ? "border-transparent text-white" : "border-gray-200 bg-white",
          )}
          style={selected ? { backgroundColor: color } : undefined}
        >
          {selected && <Check className="h-3 w-3" />}
        </div>
      </div>

      <div className="space-y-2">
        <span
          className={cn(
            "inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-semibold",
            visual.chipBg,
            visual.chipText,
            visual.chipBorder,
          )}
        >
          {role}
        </span>
        <div>
          <p className="text-2xl font-extrabold tabular-nums leading-none text-gray-900">
            {userCount}
            <span className="ml-1.5 text-xs font-medium text-gray-400">
              utilisateur{userCount > 1 ? "s" : ""}
            </span>
          </p>
          <p className="mt-1.5 text-[11px] text-gray-500">
            {stats.moduleCount} module{stats.moduleCount > 1 ? "s" : ""} · {stats.actionCount}{" "}
            action{stats.actionCount > 1 ? "s" : ""}
          </p>
        </div>
      </div>
    </button>
  )
}

function ModulePermissionCard({
  module,
  grantedActions,
  editable,
  onToggle,
}: {
  module: Module
  grantedActions: Action[]
  editable: boolean
  onToggle: (action: Action, enabled: boolean) => void
}) {
  const meta = MODULE_META[module]
  const Icon = meta.icon
  const hasAccess = grantedActions.length > 0
  const actions = module === "dashboard" ? (["view"] as Action[]) : ALL_ACTIONS

  return (
    <div
      className={cn(
        cardSurface,
        "flex flex-col p-4",
        !hasAccess && "bg-gray-50/50",
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
          style={{ backgroundColor: `${meta.color}14`, color: meta.color }}
        >
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-gray-800">{meta.label}</p>
          <p className="mt-0.5 text-[11px] text-gray-500 leading-relaxed">
            {meta.description}
          </p>
        </div>
      </div>

      <div className="mt-4 space-y-2">
        {actions.map((action) => {
          const granted = grantedActions.includes(action)
          const actionMeta = ACTION_META[action]
          const ActionIcon = actionMeta.icon
          return (
            <div
              key={action}
              className={cn(
                "flex items-center justify-between gap-2 rounded-lg border px-2.5 py-1.5",
                granted
                  ? "border-emerald-100 bg-emerald-50/50"
                  : "border-gray-100 bg-gray-50/50",
              )}
            >
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 text-[11px] font-medium",
                  granted ? "text-emerald-800" : "text-gray-500",
                )}
              >
                <ActionIcon className="h-3.5 w-3.5" />
                {actionMeta.label}
              </span>
              {editable ? (
                <Switch
                  checked={granted}
                  onCheckedChange={(checked) => onToggle(action, checked)}
                  className="scale-90"
                />
              ) : (
                <span
                  className={cn(
                    "text-[10px] font-semibold uppercase tracking-wide",
                    granted ? "text-emerald-600" : "text-gray-300",
                  )}
                >
                  {granted ? "Oui" : "Non"}
                </span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function ComparisonMatrix({ matrix }: { matrix: PermissionMatrix }) {
  return (
    <div className={cn(cardSurface, "overflow-hidden")}>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/80">
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                Module
              </th>
              {ALL_ROLES.map((role) => (
                <th
                  key={role}
                  className="px-2 py-3 text-center text-[10px] font-semibold text-gray-500"
                >
                  <span className="line-clamp-2 leading-tight">{role}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ALL_MODULES.map((module, i) => {
              const meta = MODULE_META[module]
              const Icon = meta.icon
              return (
                <tr
                  key={module}
                  className={cn(
                    "border-b border-gray-50",
                    i % 2 !== 0 && "bg-gray-50/40",
                  )}
                >
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-2 text-xs font-medium text-gray-700">
                      <Icon className="h-4 w-4 shrink-0" style={{ color: meta.color }} />
                      {meta.label}
                    </span>
                  </td>
                  {ALL_ROLES.map((role) => {
                    const actions = matrix[role][module] ?? []
                    const full = actions.length === ALL_ACTIONS.length
                    const partial = actions.length > 0 && !full
                    return (
                      <td key={role} className="px-2 py-3 text-center">
                        {actions.length === 0 ? (
                          <Minus className="mx-auto h-4 w-4 text-gray-300" />
                        ) : (
                          <span
                            className={cn(
                              "inline-flex h-6 min-w-[1.5rem] items-center justify-center rounded-full text-[10px] font-bold",
                              full
                                ? "bg-emerald-100 text-emerald-700"
                                : partial
                                  ? "bg-amber-50 text-amber-700"
                                  : "bg-gray-100 text-gray-500",
                            )}
                            title={actions
                              .map((a) => ACTION_META[a].label)
                              .join(", ")}
                          >
                            {full ? (
                              <Check className="h-3.5 w-3.5" />
                            ) : (
                              actions.length
                            )}
                          </span>
                        )}
                      </td>
                    )
                  })}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <div className="flex flex-wrap gap-4 border-t border-gray-100 bg-gray-50/50 px-4 py-3 text-[10px] text-gray-500">
        <span className="flex items-center gap-1.5">
          <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
            <Check className="h-3 w-3" />
          </span>
          Accès complet (4 actions)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-amber-50 px-1 text-amber-700 font-bold">
            n
          </span>
          Accès partiel
        </span>
        <span className="flex items-center gap-1.5">
          <Minus className="h-4 w-4 text-gray-300" />
          Aucun accès
        </span>
      </div>
    </div>
  )
}

export function PermissionsPanel({
  users,
  initialMatrix,
  canEdit,
  selectedRole,
  onSelectRole,
  onManageUsers,
}: PermissionsPanelProps) {
  const [view, setView] = React.useState<"role" | "matrix">("role")
  const [matrix, setMatrix] = React.useState<PermissionMatrix>(initialMatrix)
  const [savedMatrix, setSavedMatrix] = React.useState<PermissionMatrix>(initialMatrix)
  const [pending, setPending] = React.useState(false)

  React.useEffect(() => {
    setMatrix(initialMatrix)
    setSavedMatrix(initialMatrix)
  }, [initialMatrix])

  const dirty = !matricesEqual(matrix, savedMatrix)
  const rolePermissions = getPermissionsForRoleFromMatrix(matrix, selectedRole)
  const stats = countRolePermissionsFromMatrix(matrix, selectedRole)
  const roleUsers = users.filter((u) =>
    (u.appRoles?.length ? u.appRoles : u.appRole ? [u.appRole] : []).includes(
      selectedRole,
    ),
  )
  const color = roleAccent(selectedRole)

  const usersByRole = React.useMemo(() => {
    const counts: Record<string, number> = {}
    for (const u of users) {
      const list = u.appRoles?.length
        ? u.appRoles
        : u.appRole
          ? [u.appRole]
          : []
      if (list.length === 0) {
        counts.none = (counts.none ?? 0) + 1
        continue
      }
      for (const r of list) {
        counts[r] = (counts[r] ?? 0) + 1
      }
    }
    return counts
  }, [users])

  function handleToggle(module: Module, action: Action, enabled: boolean) {
    if (!canEdit) return
    setMatrix((prev) => togglePermission(prev, selectedRole, module, action, enabled))
  }

  async function handleSave() {
    setPending(true)
    try {
      const res = await savePermissionMatrix(matrix)
      if (res.ok) {
        setSavedMatrix(matrix)
        toast.success("Permissions enregistrées")
      } else {
        toast.error(res.error)
      }
    } finally {
      setPending(false)
    }
  }

  async function handleReset() {
    setPending(true)
    try {
      const res = await resetPermissionMatrixToDefaults()
      if (res.ok) {
        setMatrix(res.matrix)
        setSavedMatrix(res.matrix)
        toast.success("Permissions réinitialisées aux valeurs par défaut")
      } else {
        toast.error(res.error)
      }
    } finally {
      setPending(false)
    }
  }

  function handleDiscard() {
    setMatrix(savedMatrix)
    toast.message("Modifications annulées")
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-1">
          <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <Shield className="h-5 w-5 text-[#cd3b86]" />
            Gestion des permissions
          </h2>
          <p className="text-sm text-gray-500 max-w-2xl leading-relaxed">
            Sélectionnez un rôle, puis utilisez les interrupteurs pour définir ses droits par module.
            Cliquez sur <strong>Enregistrer</strong> pour appliquer les changements.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {canEdit ? (
            <Badge className="gap-1 rounded-lg border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-50">
              <Pencil className="h-3 w-3" />
              Mode édition
            </Badge>
          ) : (
            <Badge variant="outline" className="gap-1 rounded-lg text-gray-500">
              <Lock className="h-3 w-3" />
              Lecture seule
            </Badge>
          )}
          <div className="flex items-center gap-1 rounded-xl bg-gray-100 p-1">
            <button
              type="button"
              onClick={() => setView("role")}
              className={cn(
                "flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-all",
                view === "role"
                  ? "bg-white text-[#cd3b86] shadow-sm"
                  : "text-gray-500 hover:text-gray-700",
              )}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              Par rôle
            </button>
            <button
              type="button"
              onClick={() => setView("matrix")}
              className={cn(
                "flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-all",
                view === "matrix"
                  ? "bg-white text-[#cd3b86] shadow-sm"
                  : "text-gray-500 hover:text-gray-700",
              )}
            >
              <Table2 className="h-3.5 w-3.5" />
              Vue comparative
            </button>
          </div>
        </div>
      </div>

      <div className="flex items-start gap-2 rounded-xl border border-amber-100 bg-amber-50/60 px-4 py-3 text-xs text-amber-900/90">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
        <p>
          Activer <strong>Créer</strong>, <strong>Modifier</strong> ou <strong>Supprimer</strong>{" "}
          active automatiquement <strong>Voir</strong>. Retirer <strong>Voir</strong> retire toutes
          les actions du module.
        </p>
      </div>

      {canEdit ? (
        <div
          className={cn(
            cardSurface,
            "flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between",
            dirty && "border-[#cd3b86]/20 bg-[#cd3b86]/[0.03]",
          )}
        >
          <p className="text-sm font-medium text-gray-700">
            {dirty ? (
              "Modifications non enregistrées"
            ) : (
              <>
                Utilisez les interrupteurs ci-dessous pour modifier les droits du rôle{" "}
                <span className="font-semibold" style={{ color }}>
                  {selectedRole}
                </span>
                .
              </>
            )}
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-xl"
              disabled={pending || !dirty}
              onClick={() => void handleDiscard()}
            >
              Annuler
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-2 rounded-xl"
              disabled={pending}
              onClick={() => void handleReset()}
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Défauts
            </Button>
            <Button
              type="button"
              size="sm"
              className="gap-2 rounded-xl bg-[#cd3b86] hover:bg-[#b8307a] text-white"
              disabled={pending || !dirty}
              onClick={() => void handleSave()}
            >
              {pending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Save className="h-3.5 w-3.5" />
              )}
              Enregistrer
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex items-start gap-2 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-xs text-gray-600">
          <Lock className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
          <p>
            Vous pouvez consulter les permissions mais pas les modifier. Connectez-vous avec un
            compte <strong>Admin</strong> pour les éditer.
          </p>
        </div>
      )}

      {view === "matrix" ? (
        <ComparisonMatrix matrix={matrix} />
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {ALL_ROLES.map((role) => (
              <RoleSelectCard
                key={role}
                role={role}
                matrix={matrix}
                userCount={usersByRole[role] ?? 0}
                selected={selectedRole === role}
                onSelect={() => onSelectRole(role)}
              />
            ))}
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className={cn(cardSurface, "px-5 py-4")}>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-1">
                Modules accessibles
              </p>
              <p className="text-2xl font-extrabold tabular-nums text-gray-800">
                {stats.moduleCount}
                <span className="text-sm font-medium text-gray-400">
                  {" "}
                  / {ALL_MODULES.length}
                </span>
              </p>
            </div>
            <div className={cn(cardSurface, "px-5 py-4")}>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-1">
                Actions autorisées
              </p>
              <p className="text-2xl font-extrabold tabular-nums" style={{ color }}>
                {stats.actionCount}
              </p>
            </div>
            <div className={cn(cardSurface, "px-5 py-4")}>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-1">
                Comptes assignés
              </p>
              <p className="text-2xl font-extrabold tabular-nums text-gray-800">
                {roleUsers.length}
              </p>
            </div>
          </div>

          <div>
            <div className="mb-3 flex items-center justify-between gap-3">
              <h3 className="text-sm font-semibold text-gray-800">
                Droits du rôle{" "}
                <span style={{ color }}>{selectedRole}</span>
              </h3>
              {canEdit && (
                <p className="text-[11px] text-gray-400">
                  Activez ou désactivez chaque action avec les interrupteurs
                </p>
              )}
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {ALL_MODULES.map((module) => (
                <ModulePermissionCard
                  key={module}
                  module={module}
                  grantedActions={rolePermissions[module] ?? []}
                  editable={canEdit}
                  onToggle={(action, enabled) => handleToggle(module, action, enabled)}
                />
              ))}
            </div>
          </div>

          <div className={cn(cardSurface, "p-5")}>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                  <Users className="h-4 w-4 text-gray-400" />
                  Utilisateurs avec ce rôle
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  {roleUsers.length === 0
                    ? "Aucun compte n'utilise ce rôle actuellement."
                    : `${roleUsers.length} compte${roleUsers.length > 1 ? "s" : ""} — changez le rôle depuis la fiche utilisateur.`}
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-2 rounded-xl shrink-0"
                onClick={() => onManageUsers(selectedRole)}
              >
                Gérer les comptes
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </div>

            {roleUsers.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">
                Assignez ce rôle depuis l&apos;onglet Utilisateurs.
              </p>
            ) : (
              <div className="divide-y divide-gray-50 rounded-xl border border-gray-100 overflow-hidden">
                {roleUsers.slice(0, 8).map((user) => (
                  <Link
                    key={user.id}
                    href={`/configuration/utilisateurs/${user.id}/edit`}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50/80 transition-colors group"
                  >
                    <Avatar className="h-9 w-9 rounded-lg">
                      <AvatarFallback className="rounded-lg text-xs font-bold bg-gray-100 text-gray-600">
                        {getInitialsFromFullName(user.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-800 break-words">
                        {user.name}
                      </p>
                      <p className="text-xs text-gray-400 truncate">{user.email}</p>
                    </div>
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-[10px] shrink-0",
                        user.actif
                          ? "border-emerald-100 text-emerald-700"
                          : "text-gray-400",
                      )}
                    >
                      {user.actif ? "Actif" : "Inactif"}
                    </Badge>
                    <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-[#cd3b86] shrink-0" />
                  </Link>
                ))}
                {roleUsers.length > 8 && (
                  <button
                    type="button"
                    onClick={() => onManageUsers(selectedRole)}
                    className="w-full px-4 py-3 text-xs font-medium text-[#cd3b86] hover:bg-pink-50/50 transition-colors"
                  >
                    Voir les {roleUsers.length - 8} autres utilisateurs
                  </button>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
