"use client"

import * as React from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { RoleBadge } from "@/components/shared/status-badge"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  ArrowLeft,
  Save,
  Loader2,
  UserCog,
  AtSign,
  Phone,
  Stethoscope,
  Hash,
  ShieldCheck,
  Wallet,
  Mail,
  Shield,
  ChevronRight,
  UserCheck,
  UserX,
  LayoutGrid,
  Pill,
} from "lucide-react"
import { toast } from "sonner"
import { Layers } from "lucide-react"
import { useUser, useUserMutations } from "@/hooks/use-users"
import { usePermissionsConfig } from "@/hooks/use-permissions-config"
import { listCaissePostesForAssignment } from "@/app/actions/caisse-postes"
import { listPharmaciesForAssignment } from "@/app/actions/pharmacie-ops"
import {
  getInitialsFromFullName,
  isCaisseLegacyRole,
  isMedecinTitre,
  isPharmacieLegacyRole,
  mapLegacyRoleStringToAppRole,
  mapLegacyRoleStringToAppRoles,
  parseLegacyRoleTokens,
  serializeLegacyRoleTokens,
} from "@/lib/user-role"
import type { UserUpdateValues } from "@/lib/validations/user"
import type { Role } from "@/lib/types"
import { cn } from "@/lib/utils"

/* ------------------------------------------------------------------ */
/* Constantes & styles                                                  */
/* ------------------------------------------------------------------ */

const cardSurface =
  "rounded-2xl border border-gray-100 bg-white shadow-[0_2px_12px_rgba(0,0,0,0.06)]"

const inputClass = "h-10 bg-gray-50 border-gray-200 rounded-xl text-sm"
const selectTriggerClass = "h-10 bg-gray-50 border-gray-200 rounded-xl text-sm"

const TITRES = ["Docteur", "Professeur", "Monsieur", "Madame", "Mademoiselle"]

const ROLES_APP = [
  { label: "Admin", value: "admin", icon: ShieldCheck },
  { label: "Médecin", value: "medecins", icon: Stethoscope },
  { label: "Manager", value: "manager", icon: UserCog },
  { label: "Front Office", value: "front_office", icon: LayoutGrid },
  { label: "Caisse", value: "caisse", icon: Wallet },
  { label: "Pharmacie", value: "pharmacie", icon: Shield },
  { label: "Commis Pharmacie", value: "commis_pharmacie", icon: Pill },
] as const

type RoleStyle = { avatar: string; banner: string; light: string; wash: string }

function roleStyle(role: Role | null): RoleStyle {
  switch (role) {
    case "Admin":
      return {
        avatar: "bg-[#cd3b86]/12 text-[#cd3b86]",
        banner: "from-[#cd3b86] to-[#b8307a]",
        light: "bg-[#cd3b86]/8 text-[#cd3b86] border-[#cd3b86]/15",
        wash: "from-[#cd3b86]/20 via-[#cd3b86]/8 to-transparent",
      }
    case "Médecin":
      return {
        avatar: "bg-blue-50 text-blue-600",
        banner: "from-blue-500 to-blue-600",
        light: "bg-blue-50/80 text-blue-600 border-blue-100",
        wash: "from-blue-200/50 via-blue-50/40 to-transparent",
      }
    case "Manager":
      return {
        avatar: "bg-violet-50 text-violet-600",
        banner: "from-violet-500 to-violet-600",
        light: "bg-violet-50/80 text-violet-600 border-violet-100",
        wash: "from-violet-200/50 via-violet-50/40 to-transparent",
      }
    case "Front Office":
      return {
        avatar: "bg-amber-50 text-amber-600",
        banner: "from-amber-400 to-amber-500",
        light: "bg-amber-50/80 text-amber-600 border-amber-100",
        wash: "from-amber-200/50 via-amber-50/40 to-transparent",
      }
    case "Caisse":
      return {
        avatar: "bg-emerald-50 text-emerald-600",
        banner: "from-emerald-500 to-emerald-600",
        light: "bg-emerald-50/80 text-emerald-600 border-emerald-100",
        wash: "from-emerald-200/50 via-emerald-50/40 to-transparent",
      }
    case "Pharmacie":
      return {
        avatar: "bg-cyan-50 text-cyan-600",
        banner: "from-cyan-500 to-cyan-600",
        light: "bg-cyan-50/80 text-cyan-600 border-cyan-100",
        wash: "from-cyan-200/50 via-cyan-50/40 to-transparent",
      }
    case "Commis Pharmacie":
      return {
        avatar: "bg-teal-50 text-teal-600",
        banner: "from-teal-500 to-teal-600",
        light: "bg-teal-50/80 text-teal-600 border-teal-100",
        wash: "from-teal-200/50 via-teal-50/40 to-transparent",
      }
    default:
      return {
        avatar: "bg-gray-50 text-gray-500",
        banner: "from-gray-300 to-gray-400",
        light: "bg-gray-50 text-gray-500 border-gray-100",
        wash: "from-gray-200/40 via-gray-50/30 to-transparent",
      }
  }
}

function SectionHeader({
  icon: Icon,
  title,
  description,
  accent = "bg-[#cd3b86]/10 text-[#cd3b86]",
}: {
  icon: React.ElementType
  title: string
  description?: string
  accent?: string
}) {
  return (
    <div className="flex items-start gap-3 border-b border-gray-100 px-5 py-4">
      <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-xl", accent)}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <h2 className="text-sm font-bold text-gray-800">{title}</h2>
        {description && (
          <p className="mt-0.5 text-xs text-gray-500 leading-relaxed">{description}</p>
        )}
      </div>
    </div>
  )
}

function Field({
  label,
  htmlFor,
  children,
  className,
}: {
  label: React.ReactNode
  htmlFor?: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label htmlFor={htmlFor} className="text-xs font-semibold text-gray-600">
        {label}
      </Label>
      {children}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Page                                                                  */
/* ------------------------------------------------------------------ */

type FormState = {
  name: string
  email: string
  titre: string
  code: string
  telephone: string
  specialite: string
  numeroOrdre: string
  roles: string[]
  customGroupId: string
  actif: boolean
  caissePosteId: string
  pharmacieId: string
}

const DEFAULT_FORM: FormState = {
  name: "",
  email: "",
  titre: "",
  code: "",
  telephone: "",
  specialite: "",
  numeroOrdre: "",
  roles: [],
  customGroupId: "",
  actif: true,
  caissePosteId: "",
  pharmacieId: "",
}

export default function EditUserPage() {
  const params = useParams()
  const router = useRouter()
  const userId = params.id as string

  const { data: user, isPending, error, dataUpdatedAt } = useUser(userId)
  const { update } = useUserMutations()
  const { data: permissionsConfig } = usePermissionsConfig()
  const customGroups = permissionsConfig?.customGroups ?? []

  const [form, setForm] = React.useState<FormState>(DEFAULT_FORM)
  const [caissePostes, setCaissePostes] = React.useState<{ id: string; nom: string }[]>([])
  const [pharmacies, setPharmacies] = React.useState<{ id: string; nom: string }[]>([])
  const snapshotRef = React.useRef(user)
  snapshotRef.current = user

  React.useEffect(() => {
    const u = snapshotRef.current
    if (!u) return
    const legacyRoles = parseLegacyRoleTokens(u.roleRaw)
    setForm({
      name: u.name,
      email: u.email,
      titre: u.titre && u.titre !== "none" ? u.titre : "none",
      code: u.code ?? "",
      telephone: u.telephone ?? "",
      specialite: u.specialite ?? "",
      numeroOrdre: u.numeroOrdre ?? "",
      roles: legacyRoles,
      customGroupId: legacyRoles.length === 0 && u.roleRaw ? u.roleRaw : "",
      actif: u.actif,
      caissePosteId: u.caissePosteId ?? "",
      pharmacieId: u.pharmacieId ?? "",
    })
  }, [userId, dataUpdatedAt])

  const roleSerialized = serializeLegacyRoleTokens(form.roles)
  const showCaisseFields = isCaisseLegacyRole(roleSerialized)
  const showPharmacieFields = isPharmacieLegacyRole(roleSerialized)
  const showMedecinFields = isMedecinTitre(form.titre)
  const previewRoles = mapLegacyRoleStringToAppRoles(roleSerialized)
  const previewRole = mapLegacyRoleStringToAppRole(roleSerialized)
  const selectedCustomGroup = customGroups.find((g) => g.id === form.customGroupId)
  const style = roleStyle(previewRole)

  function toggleRole(token: string) {
    setForm((prev) => {
      const has = prev.roles.includes(token)
      const roles = has
        ? prev.roles.filter((r) => r !== token)
        : [...prev.roles, token]
      const nextSerialized = serializeLegacyRoleTokens(roles)
      return {
        ...prev,
        roles,
        customGroupId: "",
        caissePosteId: isCaisseLegacyRole(nextSerialized) ? prev.caissePosteId : "",
        pharmacieId: isPharmacieLegacyRole(nextSerialized) ? prev.pharmacieId : "",
      }
    })
  }

  function selectCustomGroup(id: string) {
    setForm((prev) => ({
      ...prev,
      roles: [],
      customGroupId: prev.customGroupId === id ? "" : id,
      caissePosteId: "",
      pharmacieId: "",
    }))
  }

  React.useEffect(() => {
    if (!showCaisseFields) return
    void listCaissePostesForAssignment()
      .then(setCaissePostes)
      .catch(() => toast.error("Impossible de charger les postes de caisse."))
  }, [showCaisseFields])

  React.useEffect(() => {
    if (!showPharmacieFields) return
    void listPharmaciesForAssignment()
      .then(setPharmacies)
      .catch(() => toast.error("Impossible de charger les pharmacies."))
  }, [showPharmacieFields])

  const selectedPosteNom =
    caissePostes.find((p) => p.id === form.caissePosteId)?.nom ?? user?.caissePosteNom

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const payload: UserUpdateValues = {
      name: form.name,
      email: form.email,
      titre: form.titre && form.titre !== "none" ? form.titre : null,
      code: form.code || null,
      telephone: form.telephone || null,
      specialite: form.specialite || null,
      numeroOrdre: form.numeroOrdre || null,
      roles: form.customGroupId ? [] : (form.roles as UserUpdateValues["roles"]),
      customGroupId: form.customGroupId || null,
      actif: form.actif,
      caissePosteId: showCaisseFields && form.caissePosteId ? form.caissePosteId : null,
      pharmacieId: showPharmacieFields && form.pharmacieId ? form.pharmacieId : null,
    }
    if (showCaisseFields && !form.caissePosteId) {
      toast.error("Sélectionnez un poste de caisse pour ce caissier.")
      return
    }
    if (showPharmacieFields && !form.pharmacieId) {
      toast.error("Sélectionnez une pharmacie pour ce compte.")
      return
    }
    try {
      await update.mutateAsync({ id: userId, data: payload })
      toast.success("Utilisateur mis à jour")
      router.push("/configuration/utilisateurs")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur à l'enregistrement")
    }
  }

  if (isPending) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-24">
        <Loader2 className="h-10 w-10 animate-spin text-gray-400" />
        <p className="text-sm text-gray-500">Chargement du profil…</p>
      </div>
    )
  }

  if (error || !user) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-16">
        <p className="text-gray-500">Utilisateur introuvable.</p>
        <Button asChild variant="outline" className="rounded-xl">
          <Link href="/configuration/utilisateurs">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour aux utilisateurs
          </Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-28">
      {/* Fil d'Ariane */}
      <nav className="flex flex-wrap items-center gap-1.5 text-xs text-gray-400">
        <Link
          href="/configuration/utilisateurs"
          className="hover:text-[#cd3b86] transition-colors"
        >
          Utilisateurs
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="font-medium text-gray-600">Modifier le profil</span>
      </nav>

      {/* En-tête profil */}
      <div className={cn(cardSurface, "relative overflow-hidden")}>
        <div
          className={cn(
            "pointer-events-none absolute inset-0 bg-gradient-to-br",
            style.wash,
          )}
        />
        <div className="relative flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div className="flex min-w-0 items-center gap-4">
            <div className="relative shrink-0">
              <Avatar className="h-[4.5rem] w-[4.5rem] rounded-full ring-[3px] ring-white/90 shadow-sm sm:h-20 sm:w-20">
                <AvatarFallback
                  className={cn(
                    "rounded-full text-lg font-semibold sm:text-xl",
                    style.avatar,
                  )}
                >
                  {getInitialsFromFullName(form.name || user.name)}
                </AvatarFallback>
              </Avatar>
              <span
                className={cn(
                  "absolute bottom-0.5 right-0.5 h-3.5 w-3.5 rounded-full ring-2 ring-white",
                  form.actif ? "bg-emerald-400" : "bg-gray-300",
                )}
              />
            </div>
            <div className="min-w-0 space-y-2">
              <div>
                <h1 className="text-lg font-semibold tracking-tight text-gray-700 sm:text-xl">
                  {form.name || user.name}
                </h1>
                {form.titre && form.titre !== "none" && (
                  <p className="mt-0.5 text-sm text-gray-400">{form.titre}</p>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                {previewRole ? (
                  <span
                    className={cn(
                      "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium",
                      style.light,
                    )}
                  >
                    {previewRole}
                  </span>
                ) : selectedCustomGroup ? (
                  <span className="inline-flex items-center rounded-full border border-teal-100 bg-teal-50/80 px-2.5 py-0.5 text-[11px] font-medium text-teal-700">
                    {selectedCustomGroup.label}
                  </span>
                ) : (
                  <span className="inline-flex items-center rounded-full border border-gray-100 bg-gray-50/80 px-2.5 py-0.5 text-[11px] font-medium text-gray-400">
                    Non assigné
                  </span>
                )}
                <span
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-medium",
                    form.actif
                      ? "border-emerald-100/80 bg-emerald-50/60 text-emerald-600"
                      : "border-gray-100 bg-gray-50/80 text-gray-400",
                  )}
                >
                  {form.actif ? (
                    <>
                      <UserCheck className="h-3 w-3 opacity-70" />
                      Actif
                    </>
                  ) : (
                    <>
                      <UserX className="h-3 w-3 opacity-70" />
                      Inactif
                    </>
                  )}
                </span>
              </div>
            </div>
          </div>
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="shrink-0 gap-1.5 self-start rounded-full text-gray-500 hover:bg-white/60 hover:text-gray-700 sm:self-center"
          >
            <Link href="/configuration/utilisateurs">
              <ArrowLeft className="h-3.5 w-3.5" />
              Retour
            </Link>
          </Button>
        </div>
      </div>

      <form onSubmit={(e) => void handleSubmit(e)}>
        <div className="grid gap-6 lg:grid-cols-[1fr_300px] xl:grid-cols-[1fr_320px]">
          {/* Colonne principale */}
          <div className="space-y-5 min-w-0">
            {/* Identité */}
            <section className={cardSurface}>
              <SectionHeader
                icon={UserCog}
                title="Identité"
                description="Nom, titre et informations personnelles"
              />
              <div className="space-y-4 p-5">
                <Field label="Nom complet" htmlFor="name">
                  <Input
                    id="name"
                    value={form.name}
                    onChange={(e) => set("name", e.target.value)}
                    placeholder="Prénom Nom"
                    className={inputClass}
                    required
                  />
                </Field>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Titre" htmlFor="titre">
                    <Select value={form.titre} onValueChange={(v) => set("titre", v)}>
                      <SelectTrigger id="titre" className={selectTriggerClass}>
                        <SelectValue placeholder="Sélectionner…" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">— Aucun titre —</SelectItem>
                        {TITRES.map((t) => (
                          <SelectItem key={t} value={t}>
                            {t}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field label="Code court" htmlFor="code">
                    <Input
                      id="code"
                      value={form.code}
                      onChange={(e) => set("code", e.target.value)}
                      placeholder="ex. PED"
                      maxLength={6}
                      className={inputClass}
                    />
                  </Field>
                </div>

                {showMedecinFields && (
                  <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-4 space-y-4">
                    <div className="flex items-center gap-2">
                      <Stethoscope className="h-4 w-4 text-blue-500" />
                      <span className="text-xs font-bold uppercase tracking-wider text-blue-700">
                        Informations médicales
                      </span>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Field label="Spécialité" htmlFor="specialite">
                        <Input
                          id="specialite"
                          value={form.specialite}
                          onChange={(e) => set("specialite", e.target.value)}
                          placeholder="ex. Pédiatre"
                          className={cn(inputClass, "bg-white")}
                        />
                      </Field>
                      <Field label="N° d'ordre" htmlFor="numeroOrdre">
                        <Input
                          id="numeroOrdre"
                          value={form.numeroOrdre}
                          onChange={(e) => set("numeroOrdre", e.target.value)}
                          placeholder="ex. 7523"
                          className={cn(inputClass, "bg-white")}
                        />
                      </Field>
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* Contact */}
            <section className={cardSurface}>
              <SectionHeader
                icon={Mail}
                title="Contact"
                description="Email et téléphone de connexion"
                accent="bg-gray-100 text-gray-600"
              />
              <div className="grid gap-4 p-5 sm:grid-cols-2">
                <Field label="Email" htmlFor="email" className="sm:col-span-2">
                  <div className="relative">
                    <AtSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    <Input
                      id="email"
                      type="email"
                      value={form.email}
                      onChange={(e) => set("email", e.target.value)}
                      placeholder="email@clinique.cm"
                      className={cn(inputClass, "pl-9")}
                      required
                    />
                  </div>
                </Field>
                <Field label="Téléphone" htmlFor="telephone">
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    <Input
                      id="telephone"
                      value={form.telephone}
                      onChange={(e) => set("telephone", e.target.value)}
                      placeholder="6XX XXX XXX"
                      className={cn(inputClass, "pl-9")}
                    />
                  </div>
                </Field>
              </div>
            </section>

            {/* Accès */}
            <section className={cardSurface}>
              <SectionHeader
                icon={ShieldCheck}
                title="Accès & rôle"
                description="Définissez le rôle et le statut du compte"
                accent="bg-violet-100 text-violet-700"
              />
              <div className="space-y-5 p-5">
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-gray-600">
                    Rôles applicatifs
                  </Label>
                  <p className="text-[11px] text-gray-400">
                    Sélectionnez un ou plusieurs rôles. Les permissions sont l’union des droits.
                  </p>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    <button
                      type="button"
                      onClick={() =>
                        setForm((prev) => ({
                          ...prev,
                          roles: [],
                          customGroupId: "",
                          caissePosteId: "",
                          pharmacieId: "",
                        }))
                      }
                      className={cn(
                        "flex flex-col items-center gap-1.5 rounded-xl border px-3 py-3 text-center transition-all",
                        form.roles.length === 0 && !form.customGroupId
                          ? "border-gray-300 bg-gray-50 shadow-sm ring-1 ring-gray-200"
                          : "border-gray-100 bg-white hover:border-gray-200 hover:bg-gray-50",
                      )}
                    >
                      <span className="text-[11px] font-semibold text-gray-600">Aucun rôle</span>
                    </button>
                    {ROLES_APP.map((r) => {
                      const Icon = r.icon
                      const selected = form.roles.includes(r.value)
                      const rs = roleStyle(mapLegacyRoleStringToAppRole(r.value))
                      return (
                        <button
                          key={r.value}
                          type="button"
                          onClick={() => toggleRole(r.value)}
                          className={cn(
                            "flex flex-col items-center gap-1.5 rounded-xl border px-3 py-3 text-center transition-all",
                            selected
                              ? cn(rs.light, "shadow-sm ring-1")
                              : "border-gray-100 bg-white hover:border-gray-200 hover:bg-gray-50",
                          )}
                        >
                          <Icon className="h-4 w-4" />
                          <span className="text-[11px] font-semibold leading-tight">
                            {r.label}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {customGroups.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-gray-600">
                      Groupes personnalisés
                    </Label>
                    <p className="text-[11px] text-gray-400">
                      Un groupe personnalisé remplace les rôles applicatifs ci-dessus.
                    </p>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                      {customGroups.map((g) => {
                        const selected = form.customGroupId === g.id
                        return (
                          <button
                            key={g.id}
                            type="button"
                            onClick={() => selectCustomGroup(g.id)}
                            className={cn(
                              "flex flex-col items-center gap-1.5 rounded-xl border px-3 py-3 text-center transition-all",
                              selected
                                ? "border-teal-200 bg-teal-50 text-teal-700 shadow-sm ring-1 ring-teal-100"
                                : "border-gray-100 bg-white hover:border-gray-200 hover:bg-gray-50",
                            )}
                          >
                            <Layers className="h-4 w-4" />
                            <span className="text-[11px] font-semibold leading-tight">
                              {g.label}
                            </span>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}

                {showCaisseFields && (
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <Wallet className="h-4 w-4 text-emerald-600" />
                      <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">
                        Affectation caisse
                      </span>
                    </div>
                    <Field label="Poste de caisse" htmlFor="caisse-poste">
                      <Select
                        value={form.caissePosteId || "none"}
                        onValueChange={(v) => set("caissePosteId", v === "none" ? "" : v)}
                      >
                        <SelectTrigger id="caisse-poste" className={cn(selectTriggerClass, "bg-white")}>
                          <SelectValue placeholder="Sélectionner un poste" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">— Aucun poste —</SelectItem>
                          {caissePostes.map((p) => (
                            <SelectItem key={p.id} value={p.id}>
                              {p.nom}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </Field>
                    <p className="text-[11px] text-emerald-800/70 leading-relaxed">
                      Le caissier ne pourra ouvrir une session que sur ce poste.
                    </p>
                  </div>
                )}

                {showPharmacieFields && (
                  <div className="rounded-xl border border-cyan-200 bg-cyan-50/50 p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <Pill className="h-4 w-4 text-cyan-600" />
                      <span className="text-xs font-bold uppercase tracking-wider text-cyan-800">
                        Affectation pharmacie
                      </span>
                    </div>
                    <Field label="Pharmacie" htmlFor="pharmacie">
                      <Select
                        value={form.pharmacieId || "none"}
                        onValueChange={(v) => set("pharmacieId", v === "none" ? "" : v)}
                      >
                        <SelectTrigger id="pharmacie" className={cn(selectTriggerClass, "bg-white")}>
                          <SelectValue placeholder="Sélectionner une pharmacie" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">— Aucune pharmacie —</SelectItem>
                          {pharmacies.map((p) => (
                            <SelectItem key={p.id} value={p.id}>
                              {p.nom}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </Field>
                    <p className="text-[11px] text-cyan-800/70 leading-relaxed">
                      Les sorties et retours utiliseront le magasin de cette pharmacie.
                    </p>
                  </div>
                )}

                <div className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50/80 px-4 py-3">
                  <div>
                    <p className="text-sm font-semibold text-gray-800">Statut du compte</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {form.actif
                        ? "L'utilisateur peut se connecter"
                        : "Connexion désactivée"}
                    </p>
                  </div>
                  <Switch
                    id="actif"
                    checked={form.actif}
                    onCheckedChange={(v) => set("actif", v)}
                  />
                </div>
              </div>
            </section>
          </div>

          {/* Sidebar */}
          <aside className="space-y-4 lg:sticky lg:top-4 lg:self-start">
            <div className={cn(cardSurface, "p-5 space-y-4")}>
              <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                Aperçu
              </p>
              <div className="space-y-3 text-sm">
                <div className="flex items-start justify-between gap-2">
                  <span className="text-gray-500 shrink-0">Rôles</span>
                  {previewRoles.length > 0 ? (
                    <div className="flex flex-wrap justify-end gap-1">
                      {previewRoles.map((r) => (
                        <RoleBadge key={r} role={r} />
                      ))}
                    </div>
                  ) : selectedCustomGroup ? (
                    <Badge className="text-[10px] bg-teal-50 text-teal-700 border border-teal-200">
                      {selectedCustomGroup.label}
                    </Badge>
                  ) : (
                    <span className="text-gray-400 text-xs">—</span>
                  )}
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-gray-500">Statut</span>
                  <span
                    className={cn(
                      "text-xs font-semibold",
                      form.actif ? "text-emerald-600" : "text-gray-400",
                    )}
                  >
                    {form.actif ? "Actif" : "Inactif"}
                  </span>
                </div>
                {showCaisseFields && (
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-gray-500 shrink-0">Poste</span>
                    <span className="text-xs font-medium text-gray-800 text-right">
                      {selectedPosteNom || "—"}
                    </span>
                  </div>
                )}
                {form.code && (
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-gray-500">Code</span>
                    <span className="font-sans text-xs font-semibold text-gray-800">
                      {form.code}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className={cn(cardSurface, "p-5 space-y-3")}>
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-[#cd3b86]" />
                <p className="text-sm font-semibold text-gray-800">Permissions</p>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed">
                Les droits d&apos;accès sont l&apos;union des permissions de chaque rôle.
                Modifiez la matrice depuis la page utilisateurs.
              </p>
              <Button
                asChild
                variant="outline"
                size="sm"
                className="w-full rounded-xl text-xs"
              >
                <Link href="/configuration/utilisateurs">
                  Gérer les permissions
                  <ChevronRight className="ml-1 h-3.5 w-3.5" />
                </Link>
              </Button>
            </div>

            <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50/50 px-4 py-3 text-[11px] text-gray-500 leading-relaxed">
              <Hash className="inline h-3 w-3 mr-1 text-gray-400" />
              ID compte : <span className="font-sans font-medium text-gray-700">{user.id}</span>
            </div>
          </aside>
        </div>

        {/* Barre d'actions fixe */}
        <div className="fixed inset-x-0 bottom-0 z-20 border-t border-gray-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
            <p className="hidden text-xs text-gray-500 sm:block">
              Modification du profil de{" "}
              <span className="font-medium text-gray-700">{form.name || user.name}</span>
            </p>
            <div className="flex w-full items-center justify-end gap-2 sm:w-auto">
              <Button asChild variant="outline" type="button" className="rounded-xl">
                <Link href="/configuration/utilisateurs">Annuler</Link>
              </Button>
              <Button
                type="submit"
                className="gap-2 min-w-[140px] rounded-xl bg-gradient-to-r from-[#cd3b86] to-[#b8307a] hover:from-[#b8307a] hover:to-[#9b2563] text-white shadow-sm"
                disabled={update.isPending || !form.name || !form.email}
              >
                {update.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Enregistrement…
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Enregistrer
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}
