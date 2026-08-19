"use client"

import * as React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { DatePickerFr } from "@/components/ui/date-picker-fr"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
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
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import {
  Plus,
  MoreHorizontal,
  Pencil,
  Trash2,
  Building2,
  Percent,
  Loader2,
  ListOrdered,
  Search,
  X,
  Shield,
  Sparkles,
  Hash,
} from "lucide-react"
import { formatDate, formatCurrency } from "@/lib/formatting"
import { useAssurancesList, useAssurance, useAssuranceMutations } from "@/hooks/use-assurances"
import { listActiveUsersForSelect } from "@/app/actions/users"
import { Combobox } from "@/components/ui/combobox"
import { useQuery } from "@tanstack/react-query"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

type AssuranceRow = {
  id: string
  nom: string
  code?: string | null
  type?: string | null
  description?: string | null
  promoteurUserId?: string | null
  promoteurUser?: { id: string; name: string; email: string } | null
}
type ValeurRow = {
  id: string
  codeBase: string
  valeurUnitaire: number
  dateDebut?: string | null
  dateFin?: string | null
}

const cardSurface =
  "rounded-2xl border border-gray-100 bg-white shadow-[0_2px_12px_rgba(0,0,0,0.06)] transition-all duration-200 ease-in-out"

function KpiStat({
  icon: Icon,
  label,
  value,
  color,
  sub,
}: {
  icon: React.ElementType
  label: string
  value: React.ReactNode
  color: string
  sub?: string
}) {
  return (
    <div
      className={`${cardSurface} px-5 py-4 flex items-center justify-between gap-4 hover:shadow-[0_4px_20px_rgba(0,0,0,0.08)]`}
    >
      <div>
        <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
          {label}
        </p>
        <p className="text-[26px] font-extrabold leading-none tracking-tight text-gray-800 tabular-nums">
          {value}
        </p>
        {sub && <p className="text-[11px] text-gray-400 mt-1">{sub}</p>}
      </div>
      <div
        className="h-11 w-11 rounded-2xl flex items-center justify-center shrink-0"
        style={{ backgroundColor: `${color}18` }}
      >
        <Icon className="h-5 w-5" style={{ color }} />
      </div>
    </div>
  )
}

export default function AssureursConfigPage() {
  const { data: raw, isLoading, error } = useAssurancesList()
  const assurances = (raw ?? []) as unknown as AssuranceRow[]

  const [searchQuery, setSearchQuery] = React.useState("")
  const filteredAssurances = React.useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return assurances
    return assurances.filter(
      (a) =>
        a.nom.toLowerCase().includes(q) ||
        (a.code?.toLowerCase().includes(q) ?? false) ||
        (a.type?.toLowerCase().includes(q) ?? false) ||
        (a.description?.toLowerCase().includes(q) ?? false),
    )
  }, [assurances, searchQuery])

  const {
    create,
    update,
    remove,
    createValeur,
    updateValeur,
    deleteValeur,
  } = useAssuranceMutations()

  const [formOpen, setFormOpen] = React.useState(false)
  const [editing, setEditing] = React.useState<AssuranceRow | null>(null)
  const [form, setForm] = React.useState({
    nom: "",
    code: "",
    type: "",
    description: "",
    promoteurUserId: "" as string | undefined,
  })

  const { data: usersRaw } = useQuery({
    queryKey: ["users", "active-select"],
    queryFn: () => listActiveUsersForSelect(),
  })
  const userOptions = React.useMemo(
    () =>
      (usersRaw ?? []).map((u) => ({
        value: u.id,
        label: u.name,
        description: u.email,
        searchText: `${u.name} ${u.email}`,
      })),
    [usersRaw],
  )

  const [valeursForId, setValeursForId] = React.useState<string | null>(null)
  const { data: detailRaw, isPending: detailLoading } = useAssurance(valeursForId ?? undefined)
  const detail = detailRaw as
    | (AssuranceRow & { assuranceValeurs?: ValeurRow[] })
    | null
    | undefined

  const [valeurDialog, setValeurDialog] = React.useState<
    null | { mode: "create" } | { mode: "edit"; row: ValeurRow }
  >(null)
  const [valeurForm, setValeurForm] = React.useState({
    codeBase: "",
    valeurUnitaire: "",
    dateDebut: "",
    dateFin: "",
  })

  const [deleteId, setDeleteId] = React.useState<string | null>(null)
  const [deleteValeurId, setDeleteValeurId] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (!valeurDialog || !valeursForId) return
    if (valeurDialog.mode === "create") {
      setValeurForm({
        codeBase: "",
        valeurUnitaire: "",
        dateDebut: "",
        dateFin: "",
      })
    } else {
      const r = valeurDialog.row
      setValeurForm({
        codeBase: r.codeBase,
        valeurUnitaire: String(r.valeurUnitaire),
        dateDebut: r.dateDebut ? r.dateDebut.slice(0, 10) : "",
        dateFin: r.dateFin ? r.dateFin.slice(0, 10) : "",
      })
    }
  }, [valeurDialog, valeursForId])

  function openCreate() {
    setEditing(null)
    setForm({ nom: "", code: "", type: "", description: "", promoteurUserId: undefined })
    setFormOpen(true)
  }

  function openEdit(a: AssuranceRow) {
    setEditing(a)
    setForm({
      nom: a.nom,
      code: a.code ?? "",
      type: a.type ?? "",
      description: a.description ?? "",
      promoteurUserId: a.promoteurUserId ?? undefined,
    })
    setFormOpen(true)
  }

  async function submitAssurance() {
    if (!form.nom.trim()) {
      toast.error("Le nom est obligatoire.")
      return
    }
    const promoteurUserId = form.promoteurUserId || null
    try {
      if (editing) {
        await update.mutateAsync({
          id: editing.id,
          nom: form.nom.trim(),
          code: form.code.trim() || null,
          type: form.type.trim() || null,
          description: form.description.trim() || null,
          promoteurUserId,
        })
        toast.success("Assureur mis à jour.")
      } else {
        await create.mutateAsync({
          nom: form.nom.trim(),
          code: form.code.trim() || null,
          type: form.type.trim() || null,
          description: form.description.trim() || null,
          promoteurUserId,
        })
        toast.success("Assureur créé.")
      }
      setFormOpen(false)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur")
    }
  }

  async function confirmDeleteAssurance() {
    if (!deleteId) return
    try {
      await remove.mutateAsync(deleteId)
      toast.success("Assureur supprimé.")
      setDeleteId(null)
      if (valeursForId === deleteId) setValeursForId(null)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Suppression impossible (données liées ?)")
    }
  }

  async function submitValeur() {
    if (!valeursForId) return
    const vu = Number.parseFloat(valeurForm.valeurUnitaire)
    if (!valeurForm.codeBase.trim() || Number.isNaN(vu)) {
      toast.error("Code base et valeur unitaire requis.")
      return
    }
    try {
      if (valeurDialog?.mode === "create") {
        await createValeur.mutateAsync({
          assuranceId: valeursForId,
          codeBase: valeurForm.codeBase.trim(),
          valeurUnitaire: vu,
          dateDebut: valeurForm.dateDebut ? new Date(valeurForm.dateDebut) : null,
          dateFin: valeurForm.dateFin ? new Date(valeurForm.dateFin) : null,
        })
        toast.success("Valeur ajoutée.")
      } else if (valeurDialog?.mode === "edit") {
        await updateValeur.mutateAsync({
          id: valeurDialog.row.id,
          codeBase: valeurForm.codeBase.trim(),
          valeurUnitaire: vu,
          dateDebut: valeurForm.dateDebut ? new Date(valeurForm.dateDebut) : null,
          dateFin: valeurForm.dateFin ? new Date(valeurForm.dateFin) : null,
        })
        toast.success("Valeur mise à jour.")
      }
      setValeurDialog(null)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur")
    }
  }

  async function confirmDeleteValeur() {
    if (!deleteValeurId) return
    try {
      await deleteValeur.mutateAsync(deleteValeurId)
      toast.success("Valeur supprimée.")
      setDeleteValeurId(null)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur")
    }
  }

  const valeurs = detail?.assuranceValeurs ?? []
  const busy =
    create.isPending ||
    update.isPending ||
    remove.isPending ||
    createValeur.isPending ||
    updateValeur.isPending ||
    deleteValeur.isPending

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-2 min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
            Configuration
          </p>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#525252]">
            Assureurs
          </h1>
          <p className="max-w-2xl text-sm text-gray-500 leading-relaxed">
            Partenaires et grilles de valeurs unitaires par code base pour les conventions
            d&apos;actes.
          </p>
        </div>
        <Button
          className="h-10 gap-2 shrink-0 rounded-xl bg-[#cd3b86] hover:bg-[#b8307a] text-white shadow-sm transition-all duration-200"
          type="button"
          onClick={openCreate}
        >
          <Plus className="h-4 w-4" />
          Nouvel assureur
        </Button>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-100 bg-red-50/80 px-4 py-3 text-sm text-red-700">
          Impossible de charger les assureurs. Vérifiez la connexion à la base de données.
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <KpiStat
          icon={Building2}
          label="Assureurs"
          value={isLoading ? "—" : assurances.length}
          color="#cd3b86"
          sub="Enregistrés dans le référentiel"
        />
        <KpiStat
          icon={Percent}
          label="Taux patient"
          value="—"
          color="#10b981"
          sub="Liés assurance–patient et catégorie"
        />
      </div>

      <Card className={cn(cardSurface)}>
        <CardContent className="p-4 sm:p-5">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Rechercher par nom, type ou description…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-10 pl-9 pr-10 rounded-xl border-gray-200 bg-gray-50/80 focus-visible:bg-white"
              aria-label="Filtrer les assureurs"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                aria-label="Effacer la recherche"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          {searchQuery.trim() && (
            <p className="text-[11px] text-gray-500 mt-2">
              <span className="font-semibold text-gray-700">{filteredAssurances.length}</span>{" "}
              résultat{filteredAssurances.length > 1 ? "s" : ""}
            </p>
          )}
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center gap-3 py-20 rounded-2xl border border-gray-100 bg-white">
          <Loader2 className="h-10 w-10 animate-spin text-[#cd3b86]" />
          <p className="text-sm text-gray-500">Chargement des assureurs…</p>
        </div>
      ) : filteredAssurances.length === 0 ? (
        <div className={cn(cardSurface, "p-0")}>
          <Empty className="min-h-[240px] border-0 py-12">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Shield className="h-8 w-8 text-gray-300" />
              </EmptyMedia>
              <EmptyTitle>
                {searchQuery.trim() ? "Aucun résultat" : "Aucun assureur"}
              </EmptyTitle>
              <EmptyDescription>
                {searchQuery.trim()
                  ? "Modifiez votre recherche ou effacez le filtre."
                  : "Créez votre premier partenaire pour lier conventions et actes."}
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent className="flex-row flex-wrap justify-center gap-2">
              {searchQuery.trim() ? (
                <Button variant="outline" size="sm" className="rounded-xl" onClick={() => setSearchQuery("")}>
                  Effacer la recherche
                </Button>
              ) : null}
              <Button
                size="sm"
                className="rounded-xl bg-[#cd3b86] hover:bg-[#b8307a]"
                onClick={openCreate}
              >
                <Plus className="mr-1 h-4 w-4" />
                Nouvel assureur
              </Button>
            </EmptyContent>
          </Empty>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filteredAssurances.map((assureur) => (
            <div key={assureur.id} className={cn(cardSurface, "overflow-hidden flex flex-col")}>
              <div className="h-0.5 w-full bg-gradient-to-r from-[#cd3b86]/80 to-[#e06bb0]/50" />
              <div className="p-5 flex flex-col flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#cd3b86]/10 text-sm font-bold text-[#cd3b86]">
                      {assureur.nom.substring(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <h2 className="text-base font-bold text-gray-800 truncate">{assureur.nom}</h2>
                      <p className="text-xs font-medium text-gray-500 truncate mt-0.5">
                        {assureur.code ? (
                          <span className="font-mono text-[#cd3b86]">{assureur.code}</span>
                        ) : null}
                        {assureur.code && assureur.type ? " · " : null}
                        {assureur.type || (!assureur.code ? "Type non renseigné" : null)}
                      </p>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 shrink-0 rounded-lg text-gray-400 hover:text-gray-700"
                        aria-label={`Actions pour ${assureur.nom}`}
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem onClick={() => openEdit(assureur)} className="text-xs gap-2">
                        <Pencil className="h-3.5 w-3.5" />
                        Modifier
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => setValeursForId(assureur.id)}
                        className="text-xs gap-2"
                      >
                        <ListOrdered className="h-3.5 w-3.5" />
                        Valeurs par code
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-xs gap-2 text-destructive focus:text-destructive"
                        onClick={() => setDeleteId(assureur.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Supprimer
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <p className="text-sm text-gray-500 line-clamp-3 min-h-[3.75rem] mt-3 flex-1 leading-relaxed">
                  {assureur.description?.trim() ? assureur.description : "Aucune description."}
                </p>
                {assureur.promoteurUserId ? (
                  <p className="mt-2 text-[11px] font-medium text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-2.5 py-1.5">
                    Réservée au promoteur{" "}
                    <span className="font-semibold">
                      {assureur.promoteurUser?.name ?? `#${assureur.promoteurUserId}`}
                    </span>
                  </p>
                ) : null}
                <Button
                  variant="outline"
                  className="w-full mt-4 gap-2 rounded-xl border-gray-200 hover:border-[#cd3b86]/40 hover:bg-pink-50/50 hover:text-[#cd3b86]"
                  onClick={() => setValeursForId(assureur.id)}
                >
                  <ListOrdered className="h-4 w-4" />
                  Grille tarifaire
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Formulaire assureur — hors du flex d'en-tête */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-[500px] rounded-2xl border-gray-100 overflow-hidden p-0 gap-0">
          <div className="h-1 w-full bg-gradient-to-r from-[#cd3b86] to-[#e06bb0]" />
          <DialogHeader className="px-6 pt-5 pb-2 border-b border-gray-50 bg-gradient-to-b from-pink-50/40 to-white">
            <DialogTitle className="text-lg font-bold text-[#525252]">
              {editing ? "Modifier l'assureur" : "Nouvel assureur"}
            </DialogTitle>
            <DialogDescription className="text-xs text-gray-500">
              Nom obligatoire — code, type, description et promoteur optionnels.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 px-6 py-4">
            <div className="space-y-2">
              <Label htmlFor="nom" className="text-xs font-semibold text-gray-500">
                Nom
              </Label>
              <Input
                id="nom"
                value={form.nom}
                onChange={(e) => setForm((f) => ({ ...f, nom: e.target.value }))}
                placeholder="Ex. CNPS"
                className="rounded-xl border-gray-200"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="code" className="text-xs font-semibold text-gray-500">
                Code (bordereaux)
              </Label>
              <Input
                id="code"
                value={form.code}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    code: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 20),
                  }))
                }
                placeholder="Ex. CNPS"
                className="rounded-xl border-gray-200 font-mono"
              />
              <p className="text-[11px] text-gray-400">
                Utilisé dans le n° de bordereau (BA-CODE-2026-0001). Dérivé du nom si vide.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="type" className="text-xs font-semibold text-gray-500">
                Type
              </Label>
              <Input
                id="type"
                value={form.type}
                onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
                placeholder="Optionnel"
                className="rounded-xl border-gray-200"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description" className="text-xs font-semibold text-gray-500">
                Description
              </Label>
              <Textarea
                id="description"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                rows={3}
                className="rounded-xl border-gray-200 resize-y"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-gray-500">
                Utilisateur promoteur
              </Label>
              <Combobox
                options={userOptions}
                value={form.promoteurUserId}
                onChange={(v) => setForm((f) => ({ ...f, promoteurUserId: v }))}
                placeholder="Aucun (assurance libre)"
                searchPlaceholder="Rechercher un utilisateur…"
                emptyMessage="Aucun utilisateur actif."
                clearable
                className="rounded-xl border-gray-200"
              />
              <p className="text-[11px] text-gray-400">
                Si renseigné, seul cet utilisateur pourra affecter l&apos;assurance et en fixer le
                taux. Les autres restent libres.
              </p>
              {form.promoteurUserId ? (
                <p className="text-[11px] font-medium text-amber-700">
                  Cet assureur sera réservé au promoteur sélectionné.
                </p>
              ) : null}
            </div>
          </div>
          <DialogFooter className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 gap-2">
            <Button variant="outline" className="rounded-xl border-gray-200" onClick={() => setFormOpen(false)}>
              Annuler
            </Button>
            <Button
              className="rounded-xl bg-[#cd3b86] hover:bg-[#b8307a] text-white"
              onClick={() => void submitAssurance()}
              disabled={busy}
            >
              {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!valeursForId} onOpenChange={(o) => !o && setValeursForId(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[680px] rounded-2xl border-gray-100 p-0 gap-0">
          <div className="h-1 w-full bg-gradient-to-r from-[#10b981] to-emerald-300/80" />
          <DialogHeader className="px-6 pt-5 pb-3 border-b border-gray-50">
            <DialogTitle className="text-lg font-bold text-[#525252] flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-emerald-600" />
              Valeurs unitaires
            </DialogTitle>
            <DialogDescription className="text-xs text-gray-500">
              <span className="font-semibold text-gray-700">{detail?.nom ?? "…"}</span>
              {" — "}code base, montant et période d&apos;application.
            </DialogDescription>
          </DialogHeader>
          <div className="px-6 py-4">
            {detailLoading && valeursForId ? (
              <div className="flex flex-col items-center justify-center py-12 gap-2">
                <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
                <p className="text-sm text-gray-500">Chargement des valeurs…</p>
              </div>
            ) : (
              <>
                <div className="flex justify-end mb-3">
                  <Button
                    size="sm"
                    className="gap-1.5 rounded-xl bg-[#cd3b86] hover:bg-[#b8307a] text-white"
                    onClick={() => setValeurDialog({ mode: "create" })}
                    disabled={!valeursForId}
                  >
                    <Plus className="h-4 w-4" />
                    Ajouter une ligne
                  </Button>
                </div>
                <div className="rounded-xl border border-gray-100 overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-b border-gray-100 hover:bg-transparent bg-gray-50/90">
                        <TableHead className="text-[11px] font-bold text-gray-500 uppercase tracking-wide py-3">
                          Code base
                        </TableHead>
                        <TableHead className="text-right text-[11px] font-bold text-gray-500 uppercase tracking-wide py-3">
                          Valeur
                        </TableHead>
                        <TableHead className="hidden sm:table-cell text-[11px] font-bold text-gray-500 uppercase tracking-wide py-3">
                          Période
                        </TableHead>
                        <TableHead className="w-[88px] text-right py-3" />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {valeurs.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center text-sm text-gray-500 py-10">
                            Aucune valeur — ajoutez une ligne pour ce code conventionnel.
                          </TableCell>
                        </TableRow>
                      ) : (
                        valeurs.map((v, i) => (
                          <TableRow
                            key={v.id}
                            className={cn(
                              "border-b border-gray-50 transition-colors hover:bg-emerald-50/30",
                              i % 2 === 1 && "bg-gray-50/40",
                            )}
                          >
                            <TableCell className="font-sans text-sm font-medium text-gray-800 py-3">
                              {v.codeBase}
                            </TableCell>
                            <TableCell className="text-right tabular-nums text-sm font-semibold text-[#cd3b86] py-3">
                              {formatCurrency(Number(v.valeurUnitaire))}
                            </TableCell>
                            <TableCell className="hidden sm:table-cell text-xs text-gray-500 py-3">
                              {v.dateDebut || v.dateFin ? (
                                <>
                                  {v.dateDebut ? formatDate(String(v.dateDebut)) : "…"} —{" "}
                                  {v.dateFin ? formatDate(String(v.dateFin)) : "…"}
                                </>
                              ) : (
                                <span className="text-gray-300">—</span>
                              )}
                            </TableCell>
                            <TableCell className="text-right py-3">
                              <div className="flex justify-end gap-0.5">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 rounded-lg text-gray-400 hover:text-[#cd3b86]"
                                  onClick={() => setValeurDialog({ mode: "edit", row: v })}
                                  aria-label="Modifier"
                                >
                                  <Pencil className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 rounded-lg text-gray-400 hover:text-red-600"
                                  onClick={() => setDeleteValeurId(v.id)}
                                  aria-label="Supprimer"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </>
            )}
          </div>
          <DialogFooter className="px-6 py-4 border-t border-gray-100 bg-gray-50/50">
            <Button variant="outline" className="rounded-xl border-gray-200" onClick={() => setValeursForId(null)}>
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!valeurDialog} onOpenChange={(o) => !o && setValeurDialog(null)}>
        <DialogContent className="rounded-2xl border-gray-100 sm:max-w-md p-0 gap-0 overflow-hidden">
          <div className="h-0.5 w-full bg-gradient-to-r from-[#cd3b86] to-[#e06bb0]" />
          <DialogHeader className="px-6 pt-5 pb-2">
            <DialogTitle className="text-lg font-bold text-[#525252] flex items-center gap-2">
              <Hash className="h-5 w-5 text-[#cd3b86]" />
              {valeurDialog?.mode === "edit" ? "Modifier la valeur" : "Nouvelle valeur"}
            </DialogTitle>
            <DialogDescription className="text-xs text-gray-500">
              Montant unitaire pour le code base sélectionné.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 px-6 py-4">
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-gray-500">Code base</Label>
              <Input
                value={valeurForm.codeBase}
                onChange={(e) =>
                  setValeurForm((f) => ({ ...f, codeBase: e.target.value }))
                }
                className="rounded-xl border-gray-200"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-gray-500">Valeur unitaire</Label>
              <Input
                type="number"
                step="0.01"
                value={valeurForm.valeurUnitaire}
                onChange={(e) =>
                  setValeurForm((f) => ({ ...f, valeurUnitaire: e.target.value }))
                }
                className="rounded-xl border-gray-200"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-gray-500">Date début</Label>
                <DatePickerFr
                  dateValue={valeurForm.dateDebut}
                  onDateChange={(d) =>
                    setValeurForm((f) => ({ ...f, dateDebut: d }))
                  }
                  placeholder="Date de début"
                  clearable
                  className="rounded-xl border-gray-200"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-gray-500">Date fin</Label>
                <DatePickerFr
                  dateValue={valeurForm.dateFin}
                  onDateChange={(d) =>
                    setValeurForm((f) => ({ ...f, dateFin: d }))
                  }
                  placeholder="Date de fin"
                  clearable
                  min={valeurForm.dateDebut || undefined}
                  className="rounded-xl border-gray-200"
                />
              </div>
            </div>
          </div>
          <DialogFooter className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 gap-2">
            <Button variant="outline" className="rounded-xl border-gray-200" onClick={() => setValeurDialog(null)}>
              Annuler
            </Button>
            <Button
              className="rounded-xl bg-[#cd3b86] hover:bg-[#b8307a] text-white"
              onClick={() => void submitValeur()}
              disabled={busy}
            >
              {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent className="rounded-2xl border-gray-100">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg font-bold text-[#525252]">
              Supprimer cet assureur ?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-gray-500">
              Opération irréversible si aucune donnée liée ne bloque la suppression.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="rounded-xl border-gray-200">Annuler</AlertDialogCancel>
            <AlertDialogAction
              className="rounded-xl bg-red-600 text-white hover:bg-red-700"
              onClick={() => void confirmDeleteAssurance()}
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!deleteValeurId} onOpenChange={() => setDeleteValeurId(null)}>
        <AlertDialogContent className="rounded-2xl border-gray-100">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg font-bold text-[#525252]">
              Supprimer cette valeur ?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-gray-500">
              Cette ligne de grille ne sera plus appliquée aux calculs.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="rounded-xl border-gray-200">Annuler</AlertDialogCancel>
            <AlertDialogAction
              className="rounded-xl bg-red-600 text-white hover:bg-red-700"
              onClick={() => void confirmDeleteValeur()}
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
