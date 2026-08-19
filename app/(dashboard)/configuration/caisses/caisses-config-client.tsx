"use client"

import * as React from "react"
import { toast } from "sonner"
import {
  Plus,
  Pencil,
  Loader2,
  Wallet,
  CheckCircle2,
  UserCheck,
  Search,
  X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { cn } from "@/lib/utils"
import {
  createCaissePoste,
  listCaissePostes,
  updateCaissePoste,
} from "@/app/actions/caisse-postes"
import type { CaissePosteRow } from "@/lib/types/caisse-session"

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

function PosteCaisseCard({
  poste,
  onEdit,
}: {
  poste: CaissePosteRow
  onEdit: (p: CaissePosteRow) => void
}) {
  const occupe = Boolean(poste.sessionOuverte)
  const iconBg = !poste.actif
    ? "bg-gray-100 text-gray-400"
    : occupe
      ? "bg-amber-50 text-amber-600"
      : "bg-[#cd3b86]/10 text-[#cd3b86]"

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onEdit(poste)}
      onKeyDown={(e) => e.key === "Enter" && onEdit(poste)}
      className={cn(
        cardSurface,
        "group flex flex-col overflow-hidden cursor-pointer hover:border-gray-200 hover:shadow-[0_4px_16px_rgba(0,0,0,0.05)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#cd3b86]/30",
      )}
    >
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 flex-1 items-start gap-3">
            <div
              className={cn(
                "relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl",
                iconBg,
              )}
            >
              <Wallet className="h-5 w-5" />
              <span
                className={cn(
                  "absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white",
                  !poste.actif ? "bg-gray-300" : occupe ? "bg-amber-400" : "bg-emerald-400",
                )}
              />
            </div>
            <div className="min-w-0 flex-1">
              <p className="break-words text-sm font-semibold leading-snug text-gray-800 line-clamp-2">
                {poste.nom}
              </p>
              <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                {poste.actif ? (
                  <Badge
                    variant="outline"
                    className="h-5 border-emerald-100 bg-emerald-50/80 px-1.5 text-[10px] font-medium text-emerald-700"
                  >
                    Actif
                  </Badge>
                ) : (
                  <Badge variant="outline" className="h-5 px-1.5 text-[10px] text-gray-500">
                    Inactif
                  </Badge>
                )}
                {occupe ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-medium text-amber-700">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                    En cours
                  </span>
                ) : (
                  <span className="text-[10px] text-gray-400">Libre</span>
                )}
              </div>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0 rounded-lg text-gray-400 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-gray-50 hover:text-gray-700"
            onClick={(e) => {
              e.stopPropagation()
              onEdit(poste)
            }}
            aria-label={`Modifier ${poste.nom}`}
          >
            <Pencil className="h-4 w-4" />
          </Button>
        </div>

        <p className="mt-3 min-h-[2.5rem] flex-1 text-xs leading-relaxed text-gray-500 line-clamp-2">
          {poste.description?.trim() || "Aucune description"}
        </p>

        <div className="mt-3 border-t border-gray-50 pt-3">
          {occupe ? (
            <p className="flex items-center gap-1.5 text-xs text-gray-500">
              <UserCheck className="h-3.5 w-3.5 shrink-0 text-amber-500" />
              <span className="truncate">{poste.sessionOuverte!.caissierNom}</span>
            </p>
          ) : (
            <p className="text-xs text-gray-400">Disponible pour ouverture</p>
          )}
        </div>
      </div>
    </div>
  )
}

export function CaissesConfigClient({ initialPostes }: { initialPostes: CaissePosteRow[] }) {
  const [postes, setPostes] = React.useState(initialPostes)
  const [searchQuery, setSearchQuery] = React.useState("")
  const [open, setOpen] = React.useState(false)
  const [editing, setEditing] = React.useState<CaissePosteRow | null>(null)
  const [nom, setNom] = React.useState("")
  const [description, setDescription] = React.useState("")
  const [actif, setActif] = React.useState(true)
  const [pending, setPending] = React.useState(false)

  const filtered = React.useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return postes
    return postes.filter(
      (p) =>
        p.nom.toLowerCase().includes(q) ||
        (p.description?.toLowerCase().includes(q) ?? false) ||
        (p.sessionOuverte?.caissierNom.toLowerCase().includes(q) ?? false),
    )
  }, [postes, searchQuery])

  const nbActifs = postes.filter((p) => p.actif).length
  const nbOuverts = postes.filter((p) => p.sessionOuverte).length

  function openCreate() {
    setEditing(null)
    setNom("")
    setDescription("")
    setActif(true)
    setOpen(true)
  }

  function openEdit(p: CaissePosteRow) {
    setEditing(p)
    setNom(p.nom)
    setDescription(p.description ?? "")
    setActif(p.actif)
    setOpen(true)
  }

  async function refresh() {
    const rows = await listCaissePostes()
    setPostes(rows)
  }

  async function handleSave() {
    if (!nom.trim()) {
      toast.error("Le nom est obligatoire.")
      return
    }
    setPending(true)
    try {
      const payload = { nom: nom.trim(), description: description.trim() || null, actif }
      const res = editing
        ? await updateCaissePoste(editing.id, payload)
        : await createCaissePoste(payload)
      if (res.ok) {
        toast.success(editing ? "Poste mis à jour" : "Poste créé")
        setOpen(false)
        await refresh()
      } else {
        toast.error(res.error)
      }
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-2 min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
            Configuration
          </p>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#525252]">
            Postes de caisse
          </h1>
          <p className="max-w-2xl text-sm text-gray-500 leading-relaxed">
            Caisses physiques de la clinique (accueil, urgences, etc.). Chaque caissier ouvre une
            session sur un poste libre au début de sa journée.
          </p>
        </div>
        <Button
          className="h-10 gap-2 shrink-0 rounded-xl bg-[#cd3b86] hover:bg-[#b8307a] text-white shadow-sm transition-all duration-200"
          type="button"
          onClick={openCreate}
        >
          <Plus className="h-4 w-4" />
          Nouveau poste
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <KpiStat
          icon={Wallet}
          label="Postes"
          value={postes.length}
          color="#cd3b86"
          sub="Enregistrés dans le référentiel"
        />
        <KpiStat
          icon={CheckCircle2}
          label="Actifs"
          value={nbActifs}
          color="#10b981"
          sub={nbActifs === postes.length ? "Tous disponibles" : `${postes.length - nbActifs} inactif(s)`}
        />
        <KpiStat
          icon={UserCheck}
          label="Sessions ouvertes"
          value={nbOuverts}
          color="#f59e0b"
          sub={nbOuverts === 0 ? "Aucune caisse en cours" : "Postes occupés maintenant"}
        />
      </div>

      <div className="space-y-4">
        <div className="relative max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Rechercher par nom, description ou caissier…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-10 pl-9 pr-10 rounded-xl border-gray-200 bg-white shadow-sm focus-visible:bg-white"
            aria-label="Filtrer les postes de caisse"
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

        {filtered.length === 0 ? (
          <div className={cn(cardSurface, "p-8 sm:p-12")}>
            <Empty className="border-0">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <Wallet className="h-6 w-6 text-muted-foreground" />
                </EmptyMedia>
                <EmptyTitle>
                  {postes.length === 0 ? "Aucun poste configuré" : "Aucun résultat"}
                </EmptyTitle>
                <EmptyDescription>
                  {postes.length === 0
                    ? "Créez un premier poste de caisse pour permettre l'ouverture de session aux caissiers."
                    : "Modifiez votre recherche ou effacez le filtre."}
                </EmptyDescription>
              </EmptyHeader>
              {postes.length === 0 && (
                <Button
                  onClick={openCreate}
                  className="mt-4 gap-2 rounded-xl bg-[#cd3b86] hover:bg-[#b8307a] text-white"
                >
                  <Plus className="h-4 w-4" />
                  Créer un poste
                </Button>
              )}
            </Empty>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map((p) => (
              <PosteCaisseCard key={p.id} poste={p} onEdit={openEdit} />
            ))}
            <button
              type="button"
              onClick={openCreate}
              className={cn(
                cardSurface,
                "flex min-h-[160px] flex-col items-center justify-center gap-2 border border-dashed border-gray-200 bg-gray-50/30 p-5 text-gray-400 transition-colors hover:border-[#cd3b86]/25 hover:bg-[#cd3b86]/[0.03] hover:text-[#cd3b86]",
              )}
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white border border-gray-100">
                <Plus className="h-5 w-5" />
              </div>
              <span className="text-xs font-medium">Ajouter un poste</span>
            </button>
          </div>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl border-gray-100">
          <DialogHeader>
            <DialogTitle>
              {editing ? "Modifier le poste" : "Nouveau poste de caisse"}
            </DialogTitle>
            <DialogDescription>
              {editing
                ? "Mettez à jour le libellé ou désactivez un poste sans supprimer l'historique."
                : "Ex. Caisse Accueil, Caisse Urgences — visible à l'ouverture de caisse."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-gray-600">Nom</Label>
              <Input
                value={nom}
                onChange={(e) => setNom(e.target.value)}
                placeholder="Caisse Accueil"
                className="h-10 rounded-xl border-gray-200"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-gray-600">Description</Label>
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Emplacement ou usage (optionnel)"
                className="h-10 rounded-xl border-gray-200"
              />
            </div>
            <div className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50/80 px-4 py-3">
              <div>
                <Label htmlFor="actif" className="text-sm font-medium text-gray-700">
                  Poste actif
                </Label>
                <p className="text-xs text-gray-500 mt-0.5">
                  Les postes inactifs ne sont pas proposés à l&apos;ouverture.
                </p>
              </div>
              <Switch checked={actif} onCheckedChange={setActif} id="actif" />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setOpen(false)} className="rounded-xl">
              Annuler
            </Button>
            <Button
              onClick={() => void handleSave()}
              disabled={pending}
              className="rounded-xl bg-[#cd3b86] hover:bg-[#b8307a] text-white"
            >
              {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Enregistrer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
