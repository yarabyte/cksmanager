"use client"

import * as React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { PermissionsPanel } from "@/components/configuration/permissions-panel"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { RoleBadge } from "@/components/shared/status-badge"
import {
  Plus, MoreHorizontal, Pencil, Trash2, Key, Shield, Users,
  LayoutList, LayoutGrid, Search, Stethoscope, Hash, Mail, X, Filter,
  UserCheck, UserX, Wallet, Pill, Loader2,
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { deleteUser, createUser, type UserConfigRow } from "@/app/actions/users"
import { getInitialsFromFullName, isMedecinTitre } from "@/lib/user-role"
import { ALL_ROLES } from "@/lib/permissions"
import type { PermissionMatrix } from "@/lib/permissions-matrix"
import type { CustomGroup, Role } from "@/lib/types"
import { cn } from "@/lib/utils"

const cardSurface =
  "rounded-2xl border border-gray-100 bg-white shadow-[0_2px_12px_rgba(0,0,0,0.06)] transition-all duration-200 ease-in-out"

// ─── Constants ────────────────────────────────────────────────────────────────

const TITRES = ["Docteur", "Professeur", "Monsieur", "Madame", "Mademoiselle"]

const roles = ALL_ROLES

// ─── Role styles ──────────────────────────────────────────────────────────────

type RoleStyle = { avatar: string; banner: string; dot: string; light: string }

function roleStyle(role: Role | null): RoleStyle {
  switch (role) {
    case "Admin":      return { avatar: "bg-[#cd3b86]/15 text-[#cd3b86]", banner: "from-[#cd3b86] to-[#b8307a]", dot: "bg-[#cd3b86]", light: "bg-[#cd3b86]/8 text-[#cd3b86] border-[#cd3b86]/20" }
    case "Médecin":    return { avatar: "bg-blue-100 text-blue-700",       banner: "from-blue-500 to-blue-600",   dot: "bg-blue-500",   light: "bg-blue-50 text-blue-700 border-blue-200" }
    case "Sage femme": return { avatar: "bg-rose-100 text-rose-700",       banner: "from-rose-500 to-rose-600",   dot: "bg-rose-500",   light: "bg-rose-50 text-rose-700 border-rose-200" }
    case "Manager":    return { avatar: "bg-violet-100 text-violet-700",   banner: "from-violet-500 to-violet-600", dot: "bg-violet-500", light: "bg-violet-50 text-violet-700 border-violet-200" }
    case "Front Office": return { avatar: "bg-amber-100 text-amber-700",  banner: "from-amber-400 to-amber-500", dot: "bg-amber-400",  light: "bg-amber-50 text-amber-700 border-amber-200" }
    case "Caisse":     return { avatar: "bg-emerald-100 text-emerald-700", banner: "from-emerald-500 to-emerald-600", dot: "bg-emerald-500", light: "bg-emerald-50 text-emerald-700 border-emerald-200" }
    case "Pharmacie":  return { avatar: "bg-cyan-100 text-cyan-700",       banner: "from-cyan-500 to-cyan-600",   dot: "bg-cyan-500",   light: "bg-cyan-50 text-cyan-700 border-cyan-200" }
    case "Commis Pharmacie": return { avatar: "bg-teal-100 text-teal-700", banner: "from-teal-500 to-teal-600", dot: "bg-teal-500", light: "bg-teal-50 text-teal-700 border-teal-200" }
    default:           return { avatar: "bg-gray-100 text-gray-500",       banner: "from-gray-300 to-gray-400",   dot: "bg-gray-400",   light: "bg-gray-100 text-gray-500 border-gray-200" }
  }
}

// ─── Stat card per role ───────────────────────────────────────────────────────

function RoleStatCard({
  role, count, onClick, active,
}: { role: Role | "all"; count: number; onClick: () => void; active: boolean }) {
  const style = role === "all"
    ? { dot: "bg-gray-400", light: "bg-gray-100 text-gray-600 border-gray-200", avatar: "" }
    : roleStyle(role as Role)
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex flex-col items-center gap-1.5 px-3 py-2.5 rounded-xl border transition-all duration-150 min-w-[80px]",
        active
          ? `${style.light} shadow-sm scale-[1.02]`
          : "bg-white border-gray-100 hover:border-gray-200 hover:shadow-sm"
      )}
    >
      <span className={cn("text-xl font-extrabold leading-none", active ? "" : "text-gray-800")}>
        {count}
      </span>
      <span className={cn("text-[10px] font-semibold leading-tight text-center", active ? "" : "text-gray-500")}>
        {role === "all" ? "Tous" : role}
      </span>
    </button>
  )
}

// ─── User card (grid view) ────────────────────────────────────────────────────

function UserCard({
  user,
  customGroups,
  onRequestDelete,
}: {
  user: UserConfigRow
  customGroups: CustomGroup[]
  onRequestDelete: (user: UserConfigRow) => void
}) {
  const style = roleStyle(user.appRole)
  const router = useRouter()
  const editHref = `/configuration/utilisateurs/${user.id}/edit`
  const customGroup = customGroups.find((g) => g.id === user.roleRaw)

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => router.push(editHref)}
      onKeyDown={(e) => e.key === "Enter" && router.push(editHref)}
      className={cn(
        cardSurface,
        "group flex flex-col overflow-hidden cursor-pointer hover:border-gray-200 hover:shadow-[0_4px_16px_rgba(0,0,0,0.05)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#cd3b86]/30",
      )}
    >
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 flex-1 items-start gap-3">
            <Avatar className="h-11 w-11 shrink-0 rounded-xl">
              <AvatarFallback className={cn("rounded-xl text-sm font-bold", style.avatar)}>
                {getInitialsFromFullName(user.name)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="break-words text-sm font-semibold leading-snug text-gray-800">
                {user.name}
              </p>
              <p className="mt-0.5 text-[11px] text-gray-400 break-words">
                {user.titre ?? "Sans titre"}
              </p>
              <div className="mt-1.5 flex flex-wrap gap-1">
                {(user.appRoles?.length ? user.appRoles : user.appRole ? [user.appRole] : []).length >
                0 ? (
                  (user.appRoles?.length ? user.appRoles : [user.appRole!]).map((r) => (
                    <RoleBadge key={r} role={r} />
                  ))
                ) : customGroup ? (
                  <Badge className="h-5 px-1.5 text-[10px] bg-teal-50 text-teal-700 border border-teal-200">
                    {customGroup.label}
                  </Badge>
                ) : (
                  <Badge variant="outline" className="h-5 px-1.5 text-[10px] text-gray-500">
                    Non assigné
                  </Badge>
                )}
              </div>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-0.5" onClick={(e) => e.stopPropagation()}>
            <Tooltip>
              <TooltipTrigger asChild>
                <span
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-lg",
                    user.actif
                      ? "bg-emerald-50 text-emerald-600"
                      : "bg-gray-50 text-gray-400",
                  )}
                  aria-label={user.actif ? "Compte actif" : "Compte inactif"}
                >
                  {user.actif ? (
                    <UserCheck className="h-4 w-4" />
                  ) : (
                    <UserX className="h-4 w-4" />
                  )}
                </span>
              </TooltipTrigger>
              <TooltipContent>
                {user.actif ? "Compte actif" : "Compte inactif"}
              </TooltipContent>
            </Tooltip>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-lg text-gray-400 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-gray-50 hover:text-gray-700"
              onClick={() => router.push(editHref)}
              aria-label={`Modifier ${user.name}`}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-lg text-gray-400 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-gray-50 hover:text-gray-700"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href={editHref} className="gap-2 text-xs">
                    <Pencil className="h-3.5 w-3.5" /> Modifier
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem className="gap-2 text-xs">
                  <Key className="h-3.5 w-3.5" /> Réinitialiser mot de passe
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="gap-2 text-xs text-destructive focus:text-destructive"
                  onSelect={() => onRequestDelete(user)}
                >
                  <Trash2 className="h-3.5 w-3.5" /> Supprimer
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="mt-3 space-y-1.5 text-xs text-gray-500">
          <div className="flex items-center gap-2">
            <Mail className="h-3.5 w-3.5 shrink-0 text-gray-300" />
            <span className="truncate">{user.email}</span>
          </div>
          {user.showMedecinFields ? (
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex min-w-0 flex-1 items-center gap-2">
                <Stethoscope className="h-3.5 w-3.5 shrink-0 text-blue-400" />
                <span
                  className={cn(
                    "truncate",
                    user.specialite?.trim() ? "text-gray-600" : "italic text-gray-300",
                  )}
                >
                  {user.specialite?.trim() || "Spécialité —"}
                </span>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Hash className="h-3.5 w-3.5 shrink-0 text-blue-400" />
                <span
                  className={cn(
                    user.numeroOrdre?.trim()
                      ? "text-gray-600 font-medium"
                      : "italic text-gray-300",
                  )}
                >
                  {user.numeroOrdre?.trim() ? `N° ${user.numeroOrdre}` : "N° ordre —"}
                </span>
              </div>
            </div>
          ) : null}
          {((user.appRoles ?? []).includes("Caisse") || user.appRole === "Caisse") && (
            <div className="flex items-center gap-2">
              <Wallet className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
              <span className={user.caissePosteNom ? "text-gray-600 font-medium" : "italic text-amber-600"}>
                {user.caissePosteNom ?? "Poste non affecté"}
              </span>
            </div>
          )}
          {((user.appRoles ?? []).includes("Commis Pharmacie") ||
            user.appRole === "Commis Pharmacie") && (
            <div className="flex items-center gap-2">
              <Pill className="h-3.5 w-3.5 shrink-0 text-teal-500" />
              <span className={user.pharmacieNom ? "text-gray-600 font-medium" : "italic text-amber-600"}>
                {user.pharmacieNom ?? "Pharmacie non affectée"}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

type Props = {
  initialUsers: UserConfigRow[]
  initialPermissionMatrix: PermissionMatrix
  initialCustomGroups: CustomGroup[]
  canEditPermissions: boolean
}

export function UtilisateursConfigClient({
  initialUsers,
  initialPermissionMatrix,
  initialCustomGroups,
  canEditPermissions,
}: Props) {
  const router = useRouter()
  const [isNewUserOpen, setIsNewUserOpen] = React.useState(false)
  const [createPending, setCreatePending] = React.useState(false)
  const [formFirstName, setFormFirstName] = React.useState("")
  const [formLastName, setFormLastName] = React.useState("")
  const [formEmail, setFormEmail] = React.useState("")
  const [formRole, setFormRole] = React.useState<Role | "">("")
  const [formPassword, setFormPassword] = React.useState("")
  const [formActif, setFormActif] = React.useState(true)
  const [formSpecialite, setFormSpecialite] = React.useState("")
  const [formOrdre, setFormOrdre] = React.useState("")
  const [selectedKey, setSelectedKey] = React.useState<string>("Admin")
  const [activeTab, setActiveTab] = React.useState("users")
  const [formTitre, setFormTitre] = React.useState<string>("")
  const [viewMode, setViewMode] = React.useState<"list" | "grid">("grid")
  const [search, setSearch] = React.useState("")
  const [filterRole, setFilterRole] = React.useState<string>("all")
  const [deleteTarget, setDeleteTarget] = React.useState<UserConfigRow | null>(null)
  const [deletePending, setDeletePending] = React.useState(false)

  const showMedecinForm = isMedecinTitre(formTitre)
  const customGroupIds = initialCustomGroups.map((g) => g.id)

  function resetNewUserForm() {
    setFormTitre("")
    setFormFirstName("")
    setFormLastName("")
    setFormEmail("")
    setFormRole("")
    setFormPassword("")
    setFormActif(true)
    setFormSpecialite("")
    setFormOrdre("")
  }

  async function submitNewUser() {
    if (!formRole) {
      toast.error("Sélectionnez un rôle.")
      return
    }
    setCreatePending(true)
    try {
      const res = await createUser({
        firstName: formFirstName,
        lastName: formLastName,
        titre: formTitre || undefined,
        specialite: formSpecialite || undefined,
        numeroOrdre: formOrdre || undefined,
        email: formEmail,
        role: formRole,
        password: formPassword,
        actif: formActif,
      })
      if (!res.ok) {
        toast.error(res.error)
        return
      }
      toast.success("Utilisateur créé")
      setIsNewUserOpen(false)
      resetNewUserForm()
      router.refresh()
    } finally {
      setCreatePending(false)
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return
    setDeletePending(true)
    try {
      const res = await deleteUser(deleteTarget.id)
      if (res.ok) {
        toast.success("Utilisateur supprimé")
        setDeleteTarget(null)
        router.refresh()
      } else {
        toast.error(res.error)
      }
    } finally {
      setDeletePending(false)
    }
  }

  React.useEffect(() => {
    if (roles.includes(filterRole as Role) || customGroupIds.includes(filterRole)) {
      setSelectedKey(filterRole)
    }
  }, [filterRole]) // eslint-disable-line react-hooks/exhaustive-deps

  function handleManageUsersForKey(key: string) {
    setFilterRole(key)
    setSelectedKey(key)
    setActiveTab("users")
  }

  /** Comptes actifs uniquement — les désactivés n'apparaissent plus dans la liste. */
  const activeUsers = React.useMemo(
    () => initialUsers.filter((u) => u.actif),
    [initialUsers],
  )

  // Stats per role / groupe personnalisé (comptes actifs seulement)
  const roleCounts = React.useMemo(() => {
    const counts: Record<string, number> = {}
    for (const u of activeUsers) {
      const list = u.appRoles?.length
        ? u.appRoles
        : u.appRole
          ? [u.appRole]
          : []
      if (list.length === 0) {
        if (u.roleRaw && customGroupIds.includes(u.roleRaw)) {
          counts[u.roleRaw] = (counts[u.roleRaw] ?? 0) + 1
        } else {
          counts.none = (counts.none ?? 0) + 1
        }
        continue
      }
      for (const r of list) {
        counts[r] = (counts[r] ?? 0) + 1
      }
    }
    return counts
  }, [activeUsers]) // eslint-disable-line react-hooks/exhaustive-deps

  const activeCount = activeUsers.length
  const inactiveCount = initialUsers.length - activeCount

  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase()
    return activeUsers.filter((u) => {
      const matchSearch = !q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || (u.specialite ?? "").toLowerCase().includes(q)
      const userRoles = u.appRoles?.length
        ? u.appRoles
        : u.appRole
          ? [u.appRole]
          : []
      const matchRole =
        filterRole === "all" ||
        (filterRole === "none"
          ? userRoles.length === 0 && !(u.roleRaw && customGroupIds.includes(u.roleRaw))
          : customGroupIds.includes(filterRole)
            ? u.roleRaw === filterRole
            : userRoles.includes(filterRole as Role))
      return matchSearch && matchRole
    })
  }, [activeUsers, search, filterRole]) // eslint-disable-line react-hooks/exhaustive-deps

  const hasFilters = search !== "" || filterRole !== "all"

  return (
    <TooltipProvider>
      <div className="space-y-6 pb-10">

        {/* ── Header ────────────────────────────────────────────────────── */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-2 min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
              Configuration
            </p>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#525252]">
              Utilisateurs
            </h1>
            <p className="max-w-2xl text-sm text-gray-500 leading-relaxed">
              Gérez les comptes, rôles et permissions de l&apos;équipe
            </p>
          </div>

          <Dialog open={isNewUserOpen} onOpenChange={(open) => { setIsNewUserOpen(open); if (!open) resetNewUserForm() }}>
            <DialogTrigger asChild>
              <Button className="gap-2 bg-gradient-to-r from-[#cd3b86] to-[#b8307a] hover:from-[#b8307a] hover:to-[#9b2563] text-white shadow-sm">
                <Plus className="h-4 w-4" />
                Nouvel utilisateur
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[520px] p-0 gap-0 overflow-hidden">
              <div className="bg-gradient-to-r from-[#cd3b86] to-[#9b2563] px-6 py-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20">
                    <Users className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <DialogTitle className="text-white text-lg font-bold">Nouvel utilisateur</DialogTitle>
                    <DialogDescription className="text-white/70 text-xs mt-0.5">
                      Créez un nouveau compte et définissez ses accès
                    </DialogDescription>
                  </div>
                </div>
              </div>

              <div className="px-6 py-5 space-y-5 max-h-[70vh] overflow-y-auto">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-widest text-gray-500 mb-3">Identité</p>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label htmlFor="nf-firstName" className="text-xs font-semibold text-gray-600">Prénom</Label>
                        <Input id="nf-firstName" placeholder="Prénom" value={formFirstName} onChange={(e) => setFormFirstName(e.target.value)} className="h-9 bg-gray-50 border-gray-200" />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="nf-lastName" className="text-xs font-semibold text-gray-600">Nom</Label>
                        <Input id="nf-lastName" placeholder="Nom de famille" value={formLastName} onChange={(e) => setFormLastName(e.target.value)} className="h-9 bg-gray-50 border-gray-200" />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="nf-titre" className="text-xs font-semibold text-gray-600">Titre</Label>
                      <Select value={formTitre} onValueChange={setFormTitre}>
                        <SelectTrigger id="nf-titre" className="h-9 bg-gray-50 border-gray-200">
                          <SelectValue placeholder="Sélectionner un titre…" />
                        </SelectTrigger>
                        <SelectContent>
                          {TITRES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    {showMedecinForm && (
                      <div className="grid grid-cols-2 gap-3 rounded-xl border border-blue-200 bg-blue-50/60 p-3">
                        <div className="col-span-2 flex items-center gap-1.5 mb-0.5">
                          <Stethoscope className="h-3.5 w-3.5 text-blue-500" />
                          <span className="text-xs font-bold text-blue-700">Informations médicales</span>
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="nf-specialite" className="text-xs font-semibold text-blue-700">Spécialité</Label>
                          <Input id="nf-specialite" placeholder="ex. Pédiatre" value={formSpecialite} onChange={(e) => setFormSpecialite(e.target.value)} className="h-9 border-blue-200 bg-white" />
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="nf-ordre" className="text-xs font-semibold text-blue-700">N° d&apos;ordre</Label>
                          <Input id="nf-ordre" placeholder="ex. 7523" value={formOrdre} onChange={(e) => setFormOrdre(e.target.value)} className="h-9 border-blue-200 bg-white" />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="border-t border-dashed border-gray-200" />

                <div>
                  <p className="text-[11px] font-bold uppercase tracking-widest text-gray-500 mb-3">Contact &amp; accès</p>
                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="nf-email" className="text-xs font-semibold text-gray-600">Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
                        <Input id="nf-email" type="email" placeholder="email@cks-clinic.cm" value={formEmail} onChange={(e) => setFormEmail(e.target.value)} className="h-9 pl-8 bg-gray-50 border-gray-200" />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="nf-role" className="text-xs font-semibold text-gray-600">Rôle</Label>
                      <Select value={formRole || undefined} onValueChange={(v) => setFormRole(v as Role)}>
                        <SelectTrigger id="nf-role" className="h-9 bg-gray-50 border-gray-200">
                          <SelectValue placeholder="Sélectionner un rôle…" />
                        </SelectTrigger>
                        <SelectContent>
                          {roles.map((role) => <SelectItem key={role} value={role}>{role}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="nf-password" className="text-xs font-semibold text-gray-600">Mot de passe temporaire</Label>
                      <div className="relative">
                        <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
                        <Input id="nf-password" type="password" placeholder="Min. 8 caractères" value={formPassword} onChange={(e) => setFormPassword(e.target.value)} className="h-9 pl-8 bg-gray-50 border-gray-200" />
                      </div>
                    </div>
                    <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
                      <div>
                        <p className="text-sm font-semibold text-gray-800">Compte actif</p>
                        <p className="text-xs text-gray-500">L&apos;utilisateur peut se connecter immédiatement</p>
                      </div>
                      <Switch id="nf-active" checked={formActif} onCheckedChange={setFormActif} />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 border-t bg-gray-50/60 px-6 py-4">
                <Button variant="ghost" onClick={() => setIsNewUserOpen(false)} disabled={createPending} className="text-gray-500 hover:text-gray-700">
                  Annuler
                </Button>
                <Button
                  className="gap-2 bg-gradient-to-r from-[#cd3b86] to-[#b8307a] hover:from-[#b8307a] hover:to-[#9b2563] text-white px-5"
                  disabled={createPending}
                  onClick={() => void submitNewUser()}
                >
                  {createPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                  Créer l&apos;utilisateur
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* ── Quick stats ──────────────────────────────────────────────── */}
        <div className="flex flex-wrap items-stretch gap-2">
          {/* Total */}
          <Card className="border border-gray-100 shadow-sm rounded-2xl shrink-0">
            <CardContent className="px-4 py-3 flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-[#cd3b86]/10 flex items-center justify-center">
                <Users className="h-4.5 w-4.5 text-[#cd3b86] h-[18px] w-[18px]" />
              </div>
              <div>
                <p className="text-2xl font-extrabold text-gray-900 leading-none">{activeCount}</p>
                <p className="text-[11px] text-gray-500 mt-0.5">Comptes</p>
              </div>
            </CardContent>
          </Card>
          {/* Actif/Inactif */}
          <Card className="border border-gray-100 shadow-sm rounded-2xl shrink-0">
            <CardContent className="px-4 py-3 flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-[#58a639]/10 flex items-center justify-center">
                <UserCheck className="h-[18px] w-[18px] text-[#58a639]" />
              </div>
              <div>
                <p className="text-2xl font-extrabold text-gray-900 leading-none">{activeCount}</p>
                <p className="text-[11px] text-gray-500 mt-0.5">Actifs</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border border-gray-100 shadow-sm rounded-2xl shrink-0">
            <CardContent className="px-4 py-3 flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-gray-100 flex items-center justify-center">
                <UserX className="h-[18px] w-[18px] text-gray-400" />
              </div>
              <div>
                <p className="text-2xl font-extrabold text-gray-900 leading-none">{inactiveCount}</p>
                <p className="text-[11px] text-gray-500 mt-0.5">Inactifs</p>
              </div>
            </CardContent>
          </Card>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Per-role pills */}
          <div className="flex flex-wrap items-center gap-2">
            <RoleStatCard role="all" count={activeCount}
              onClick={() => setFilterRole("all")} active={filterRole === "all"} />
            {roles.map((r) => (roleCounts[r] ?? 0) > 0 ? (
              <RoleStatCard key={r} role={r} count={roleCounts[r] ?? 0}
                onClick={() => setFilterRole(filterRole === r ? "all" : r)}
                active={filterRole === r} />
            ) : null)}
            {initialCustomGroups.map((g) => (roleCounts[g.id] ?? 0) > 0 ? (
              <button
                key={g.id}
                onClick={() => setFilterRole(filterRole === g.id ? "all" : g.id)}
                className={cn(
                  "flex flex-col items-center gap-1.5 px-3 py-2.5 rounded-xl border transition-all duration-150 min-w-[80px]",
                  filterRole === g.id
                    ? "bg-teal-50 text-teal-700 border-teal-200 shadow-sm scale-[1.02]"
                    : "bg-white border-gray-100 hover:border-gray-200 hover:shadow-sm",
                )}
              >
                <span className={cn("text-xl font-extrabold leading-none", filterRole === g.id ? "" : "text-gray-800")}>
                  {roleCounts[g.id] ?? 0}
                </span>
                <span className={cn("text-[10px] font-semibold leading-tight text-center", filterRole === g.id ? "" : "text-gray-500")}>
                  {g.label}
                </span>
              </button>
            ) : null)}
          </div>
        </div>

        {/* ── Tabs ─────────────────────────────────────────────────────── */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <div className="flex items-center justify-between">
            <TabsList className="bg-gray-100 p-1 rounded-xl">
              <TabsTrigger value="users"
                className="gap-2 text-xs rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-[#cd3b86]">
                <Users className="h-3.5 w-3.5" />
                Utilisateurs
              </TabsTrigger>
              <TabsTrigger value="permissions"
                className="gap-2 text-xs rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-[#cd3b86]">
                <Shield className="h-3.5 w-3.5" />
                Permissions
              </TabsTrigger>
            </TabsList>
          </div>

          {/* ── Users tab ──────────────────────────────────────────────── */}
          <TabsContent value="users" className="space-y-4 mt-0">
            {/* Filter bar */}
            <Card className="border border-gray-100 shadow-sm rounded-2xl bg-white">
              <CardContent className="px-4 py-3">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-2 flex-1">
                    <div className="relative flex-1 max-w-xs">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                      <Input placeholder="Rechercher…" value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9 h-9 bg-gray-50 border-gray-200 text-sm" />
                      {search && (
                        <button onClick={() => setSearch("")}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                          <X className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>

                    <Select value={filterRole} onValueChange={setFilterRole}>
                      <SelectTrigger className="h-9 w-[155px] text-xs bg-gray-50 border-gray-200 rounded-lg">
                        <SelectValue placeholder="Tous les rôles" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tous les rôles</SelectItem>
                        {roles.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                        {initialCustomGroups.map((g) => (
                          <SelectItem key={g.id} value={g.id}>{g.label}</SelectItem>
                        ))}
                        <SelectItem value="none">Non assigné</SelectItem>
                      </SelectContent>
                    </Select>

                    {hasFilters && (
                      <button onClick={() => { setSearch(""); setFilterRole("all") }}
                        className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 transition-colors">
                        <X className="h-3.5 w-3.5" /> Effacer
                      </button>
                    )}

                    {hasFilters && (
                      <span className="flex items-center gap-1 text-xs font-semibold text-[#cd3b86] bg-[#cd3b86]/8 border border-[#cd3b86]/20 px-2 py-1 rounded-full">
                        <Filter className="h-3 w-3" />
                        {filtered.length} résultat{filtered.length > 1 ? "s" : ""}
                      </span>
                    )}
                  </div>

                  {/* View toggle */}
                  <div className="flex items-center gap-0.5 bg-gray-100 rounded-lg p-0.5 shrink-0">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button onClick={() => setViewMode("list")}
                          className={cn("h-8 w-8 flex items-center justify-center rounded-md transition-all",
                            viewMode === "list" ? "bg-white shadow-sm text-[#cd3b86]" : "text-gray-500 hover:text-gray-700")}>
                          <LayoutList className="h-4 w-4" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>Vue liste</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button onClick={() => setViewMode("grid")}
                          className={cn("h-8 w-8 flex items-center justify-center rounded-md transition-all",
                            viewMode === "grid" ? "bg-white shadow-sm text-[#cd3b86]" : "text-gray-500 hover:text-gray-700")}>
                          <LayoutGrid className="h-4 w-4" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>Vue cartes</TooltipContent>
                    </Tooltip>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* List view */}
            {viewMode === "list" && (
              <Card className="border border-gray-100 shadow-sm rounded-2xl overflow-hidden">
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-gray-50/80 hover:bg-gray-50/80 border-b border-gray-100">
                          <TableHead className="text-[11px] font-bold text-gray-500 uppercase tracking-wide py-3 pl-4">Utilisateur</TableHead>
                          <TableHead className="hidden sm:table-cell text-[11px] font-bold text-gray-500 uppercase tracking-wide py-3">Email</TableHead>
                          <TableHead className="text-[11px] font-bold text-gray-500 uppercase tracking-wide py-3">Titre</TableHead>
                          <TableHead className="hidden lg:table-cell text-[11px] font-bold text-gray-500 uppercase tracking-wide py-3">Spécialité</TableHead>
                          <TableHead className="hidden xl:table-cell text-[11px] font-bold text-gray-500 uppercase tracking-wide py-3">N° ordre</TableHead>
                          <TableHead className="text-[11px] font-bold text-gray-500 uppercase tracking-wide py-3">Rôles</TableHead>
                          <TableHead className="hidden md:table-cell text-[11px] font-bold text-gray-500 uppercase tracking-wide py-3">Statut</TableHead>
                          <TableHead className="w-[44px]" />
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filtered.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={8} className="h-40 text-center">
                              <div className="flex flex-col items-center gap-2 text-gray-400">
                                <Users className="h-8 w-8 opacity-30" />
                                <p className="text-sm font-medium">Aucun utilisateur trouvé</p>
                              </div>
                            </TableCell>
                          </TableRow>
                        ) : (
                          filtered.map((user, i) => (
                            <TableRow key={user.id}
                              className={cn("group hover:bg-[#cd3b86]/3 transition-colors border-b border-gray-50",
                                i % 2 !== 0 && "bg-gray-50/30")}>
                              <TableCell className="py-3 pl-4">
                                <div className="flex items-center gap-3">
                                  <Avatar className="h-9 w-9 shrink-0">
                                    <AvatarFallback className={cn("text-xs font-bold", roleStyle(user.appRole).avatar)}>
                                      {getInitialsFromFullName(user.name)}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <p className="font-semibold text-sm text-gray-800 leading-tight">{user.name}</p>
                                    <p className="text-[11px] text-gray-400 sm:hidden truncate max-w-[140px]">{user.email}</p>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell className="hidden sm:table-cell py-3 max-w-[200px] truncate text-xs text-gray-500">
                                {user.email}
                              </TableCell>
                              <TableCell className="py-3 text-xs text-gray-500">{user.titre ?? "—"}</TableCell>
                              <TableCell className="hidden lg:table-cell py-3 text-sm">
                                {user.showMedecinFields && user.specialite?.trim() ? (
                                  <span className="flex items-center gap-1.5 text-xs text-blue-700">
                                    <Stethoscope className="h-3.5 w-3.5 text-blue-400" />
                                    {user.specialite}
                                  </span>
                                ) : "—"}
                              </TableCell>
                              <TableCell className="hidden xl:table-cell py-3 text-xs text-gray-500 font-sans">
                                {user.showMedecinFields && user.numeroOrdre?.trim() ? user.numeroOrdre : "—"}
                              </TableCell>
                              <TableCell className="py-3">
                                <div className="space-y-1">
                                  {(user.appRoles?.length
                                    ? user.appRoles
                                    : user.appRole
                                      ? [user.appRole]
                                      : []
                                  ).length > 0 ? (
                                    <div className="flex flex-wrap gap-1">
                                      {(user.appRoles?.length
                                        ? user.appRoles
                                        : [user.appRole!]
                                      ).map((r) => (
                                        <RoleBadge key={r} role={r} />
                                      ))}
                                    </div>
                                  ) : initialCustomGroups.find((g) => g.id === user.roleRaw) ? (
                                    <Badge className="text-xs bg-teal-50 text-teal-700 border border-teal-200">
                                      {initialCustomGroups.find((g) => g.id === user.roleRaw)?.label}
                                    </Badge>
                                  ) : (
                                    <Badge variant="secondary" className="text-xs">
                                      Non assigné
                                    </Badge>
                                  )}
                                  {((user.appRoles ?? []).includes("Caisse") ||
                                    user.appRole === "Caisse") && (
                                    <p className="text-[10px] text-gray-500 flex items-center gap-1">
                                      <Wallet className="h-3 w-3" />
                                      {user.caissePosteNom ?? "Poste non affecté"}
                                    </p>
                                  )}
                                  {((user.appRoles ?? []).includes("Commis Pharmacie") ||
                                    user.appRole === "Commis Pharmacie") && (
                                    <p className="text-[10px] text-gray-500 flex items-center gap-1">
                                      <Pill className="h-3 w-3" />
                                      {user.pharmacieNom ?? "Pharmacie non affectée"}
                                    </p>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="hidden md:table-cell py-3">
                                <span className={cn(
                                  "inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full border",
                                  user.actif
                                    ? "bg-[#58a639]/10 text-[#58a639] border-[#58a639]/20"
                                    : "bg-gray-100 text-gray-400 border-gray-200"
                                )}>
                                  <span className={cn("h-1.5 w-1.5 rounded-full", user.actif ? "bg-[#58a639]" : "bg-gray-300")} />
                                  {user.actif ? "Actif" : "Inactif"}
                                </span>
                              </TableCell>
                              <TableCell className="py-3">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon"
                                      className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-gray-600">
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end" className="w-44">
                                    <DropdownMenuItem asChild>
                                      <Link href={`/configuration/utilisateurs/${user.id}/edit`} className="gap-2 text-xs">
                                        <Pencil className="h-3.5 w-3.5" /> Modifier
                                      </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem className="gap-2 text-xs">
                                      <Key className="h-3.5 w-3.5" /> Réinitialiser mot de passe
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      className="gap-2 text-xs text-destructive focus:text-destructive"
                                      onSelect={() => setDeleteTarget(user)}
                                    >
                                      <Trash2 className="h-3.5 w-3.5" /> Supprimer
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Grid view */}
            {viewMode === "grid" && (
              filtered.length === 0 ? (
                <div className={cn(cardSurface, "flex flex-col items-center justify-center p-12")}>
                  <div className="h-12 w-12 rounded-xl bg-gray-50 flex items-center justify-center mb-3">
                    <Users className="h-6 w-6 text-gray-300" />
                  </div>
                  <p className="text-sm font-semibold text-gray-500">Aucun utilisateur trouvé</p>
                  {hasFilters && (
                    <button
                      type="button"
                      onClick={() => { setSearch(""); setFilterRole("all") }}
                      className="mt-3 text-xs text-[#cd3b86] font-medium hover:underline"
                    >
                      Effacer les filtres
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {filtered.map((user) => (
                    <UserCard
                      key={user.id}
                      user={user}
                      customGroups={initialCustomGroups}
                      onRequestDelete={setDeleteTarget}
                    />
                  ))}
                  <button
                    type="button"
                    onClick={() => setIsNewUserOpen(true)}
                    className={cn(
                      cardSurface,
                      "flex min-h-[180px] flex-col items-center justify-center gap-2 border border-dashed border-gray-200 bg-gray-50/30 p-5 text-gray-400 transition-colors hover:border-[#cd3b86]/25 hover:bg-[#cd3b86]/[0.03] hover:text-[#cd3b86]",
                    )}
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white border border-gray-100">
                      <Plus className="h-5 w-5" />
                    </div>
                    <span className="text-xs font-medium">Nouvel utilisateur</span>
                  </button>
                </div>
              )
            )}
          </TabsContent>

          {/* ── Permissions tab ──────────────────────────────────────────── */}
          <TabsContent value="permissions" className="mt-0">
            <PermissionsPanel
              users={activeUsers}
              initialMatrix={initialPermissionMatrix}
              initialCustomGroups={initialCustomGroups}
              canEdit={canEditPermissions}
              selectedKey={selectedKey}
              onSelectKey={setSelectedKey}
              onManageUsers={handleManageUsersForKey}
            />
          </TabsContent>
        </Tabs>

        <AlertDialog
          open={!!deleteTarget}
          onOpenChange={(open) => {
            if (!open && !deletePending) setDeleteTarget(null)
          }}
        >
          <AlertDialogContent className="rounded-2xl border-gray-100">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-lg font-bold text-gray-900">
                Supprimer cet utilisateur ?
              </AlertDialogTitle>
              <AlertDialogDescription asChild>
                <div className="space-y-2 text-sm text-gray-500">
                  <p>
                    Vous allez supprimer{" "}
                    <strong className="text-foreground">
                      {deleteTarget?.name ?? "cet utilisateur"}
                    </strong>
                    {deleteTarget?.email ? (
                      <>
                        {" "}
                        (<span className="text-gray-400">({deleteTarget.email})</span>
                      </>
                    ) : null}
                    .
                  </p>
                  <p>
                    Cette action est irréversible. Si des données lui sont liées, la
                    suppression sera refusée — désactivez le compte à la place.
                  </p>
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="gap-2">
              <AlertDialogCancel
                className="rounded-xl border-gray-200"
                disabled={deletePending}
              >
                Annuler
              </AlertDialogCancel>
              <AlertDialogAction
                className="rounded-xl bg-red-600 text-white hover:bg-red-700 gap-2"
                disabled={deletePending}
                onClick={(e) => {
                  e.preventDefault()
                  void confirmDelete()
                }}
              >
                {deletePending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
                Supprimer
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </TooltipProvider>
  )
}
