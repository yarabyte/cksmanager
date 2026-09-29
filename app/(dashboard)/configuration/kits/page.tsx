"use client"

import * as React from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import {
  LayoutGrid,
  Loader2,
  Pencil,
  Plus,
  Search,
  Trash2,
  Eye,
  ChevronLeft,
  ChevronRight,
  ChevronFirst,
  ChevronLast,
  Filter,
  X,
  User,
  ListOrdered,
} from "lucide-react"
import { useKitActesList, useKitActeMutations } from "@/hooks/use-kits"
import { listActiveUsersForSelect } from "@/app/actions/users"
import { useQuery } from "@tanstack/react-query"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { capitalizeFirstLetter } from "@/lib/formatting"

const cardSurface =
  "rounded-2xl border border-gray-100 bg-white shadow-[0_2px_12px_rgba(0,0,0,0.06)] transition-all duration-200 ease-in-out"

const PAGE_SIZES = [10, 20, 50] as const

type KitRow = {
  id: string
  nom: string
  description?: string | null
  actif: boolean
  user: { id: string; name: string; email: string }
  _count: { lignes: number }
}

function KitCard({
  kit,
  onEdit,
  onDelete,
}: {
  kit: KitRow
  onEdit: () => void
  onDelete: () => void
}) {
  const initials = kit.nom
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("")

  return (
    <div className={cn(cardSurface, "group flex flex-col overflow-hidden hover:shadow-[0_4px_20px_rgba(0,0,0,0.08)]")}>
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 flex-1 items-start gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#cd3b86]/10 text-sm font-bold text-[#cd3b86]">
              {initials || <LayoutGrid className="h-5 w-5" />}
            </div>
            <div className="min-w-0 flex-1">
              <Link
                href={`/configuration/kits/${kit.id}`}
                className="block break-words text-base font-bold leading-snug text-gray-800 hover:text-[#cd3b86]"
              >
                {capitalizeFirstLetter(kit.nom)}
              </Link>
              <div className="mt-1 flex flex-wrap items-center gap-1.5">
                {kit.actif ? (
                  <Badge className="h-5 bg-[#58a639] px-1.5 text-[10px] hover:bg-[#58a639]">
                    Actif
                  </Badge>
                ) : (
                  <Badge variant="outline" className="h-5 px-1.5 text-[10px]">
                    Inactif
                  </Badge>
                )}
                <span className="inline-flex items-center gap-1 text-[11px] text-gray-400">
                  <ListOrdered className="h-3 w-3" />
                  {kit._count.lignes} ligne{kit._count.lignes === 1 ? "" : "s"}
                </span>
              </div>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-0.5">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-lg text-gray-500 hover:text-gray-800"
              onClick={onEdit}
              aria-label={`Modifier ${kit.nom}`}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-lg text-red-500 hover:bg-red-50 hover:text-red-700"
              onClick={onDelete}
              aria-label={`Supprimer ${kit.nom}`}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <p className="mt-3 min-h-[3.75rem] flex-1 text-sm leading-relaxed text-gray-500 line-clamp-3">
          {kit.description?.trim() ? kit.description : "Aucune description."}
        </p>

        <p className="mt-3 flex items-center gap-1.5 text-xs text-gray-400">
          <User className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">{kit.user.name}</span>
        </p>

        <Button
          variant="outline"
          className="mt-4 w-full gap-2 rounded-xl border-gray-200 hover:border-[#cd3b86]/40 hover:bg-pink-50/50 hover:text-[#cd3b86]"
          asChild
        >
          <Link href={`/configuration/kits/${kit.id}`}>
            <Eye className="h-4 w-4" />
            Voir le kit
          </Link>
        </Button>
      </div>
    </div>
  )
}

export default function KitsConfigurationPage() {
  const [searchQuery, setSearchQuery] = React.useState("")
  const [debouncedQ, setDebouncedQ] = React.useState("")
  const [actifFilter, setActifFilter] = React.useState("all")
  const [userFilter, setUserFilter] = React.useState("all")
  const [page, setPage] = React.useState(1)
  const [pageSize, setPageSize] = React.useState(20)

  React.useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(searchQuery.trim()), 300)
    return () => clearTimeout(t)
  }, [searchQuery])

  React.useEffect(() => {
    setPage(1)
  }, [debouncedQ, actifFilter, userFilter])

  const skip = (page - 1) * pageSize
  const filters = React.useMemo(
    () => ({
      q: debouncedQ,
      actif: actifFilter === "all" ? undefined : actifFilter,
      userId: userFilter,
      skip,
      take: pageSize,
    }),
    [debouncedQ, actifFilter, userFilter, skip, pageSize],
  )

  const { data: listData, isLoading, error } = useKitActesList(filters)
  const items = (listData?.items ?? []) as unknown as KitRow[]
  const total = listData?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  React.useEffect(() => {
    if (page > totalPages) setPage(totalPages)
  }, [page, totalPages])

  const rangeFrom = total === 0 ? 0 : skip + 1
  const rangeTo = Math.min(skip + pageSize, total)

  const { data: usersRaw } = useQuery({
    queryKey: ["users", "active-select", "kits-dropdown"],
    queryFn: () => listActiveUsersForSelect(),
  })
  const users = usersRaw ?? []

  const { create, update, remove } = useKitActeMutations()

  const [dialog, setDialog] = React.useState<
    null | { mode: "create" } | { mode: "edit"; row: KitRow }
  >(null)
  const [form, setForm] = React.useState({
    nom: "",
    description: "",
    userId: "",
    actif: true,
  })
  const [deleteId, setDeleteId] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (!dialog) return
    if (dialog.mode === "create") {
      setForm({
        nom: "",
        description: "",
        userId: users[0]?.id ?? "",
        actif: true,
      })
    } else {
      const r = dialog.row
      setForm({
        nom: r.nom,
        description: r.description ?? "",
        userId: r.user.id,
        actif: r.actif,
      })
    }
  }, [dialog, users])

  async function submitKit() {
    if (!form.nom.trim()) {
      toast.error("Nom requis.")
      return
    }
    if (!form.userId) {
      toast.error("Utilisateur requis.")
      return
    }
    try {
      if (dialog?.mode === "create") {
        await create.mutateAsync({
          nom: form.nom.trim(),
          description: form.description.trim() || null,
          userId: form.userId,
          actif: form.actif,
        })
        toast.success("Kit créé.")
      } else if (dialog?.mode === "edit") {
        await update.mutateAsync({
          id: dialog.row.id,
          nom: form.nom.trim(),
          description: form.description.trim() || null,
          userId: form.userId,
          actif: form.actif,
        })
        toast.success("Kit mis à jour.")
      }
      setDialog(null)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur")
    }
  }

  async function confirmDelete() {
    if (!deleteId) return
    try {
      await remove.mutateAsync(deleteId)
      toast.success("Kit supprimé.")
      setDeleteId(null)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur")
    }
  }

  const busy = create.isPending || update.isPending || remove.isPending
  const hasFilters =
    searchQuery !== "" || actifFilter !== "all" || userFilter !== "all"
  const clearFilters = () => {
    setSearchQuery("")
    setActifFilter("all")
    setUserFilter("all")
  }

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-2 min-w-0">
          <p className="text-[11px] font-semibold tracking-wider text-gray-400">
            Configuration
          </p>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#525252] flex items-center gap-2">
            <LayoutGrid className="h-8 w-8 text-[#cd3b86]" />
            Kits actes & pharmacie
          </h1>
          <p className="max-w-2xl text-sm text-gray-500 leading-relaxed">
            Modèles prédéfinis combinant actes facturables et produits (parcours type
            observation, paludisme, etc.).
          </p>
        </div>
        <Button
          className="h-10 gap-2 rounded-xl bg-[#cd3b86] hover:bg-[#b8307a] text-white shrink-0"
          type="button"
          onClick={() => {
            if (!users.length) {
              toast.error("Aucun utilisateur en base.")
              return
            }
            setDialog({ mode: "create" })
          }}
        >
          <Plus className="h-4 w-4" />
          Nouveau kit
        </Button>
      </div>

      <div className={cn(cardSurface, "p-4 space-y-4")}>
        <div className="flex flex-col lg:flex-row gap-3 lg:items-end">
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              className="pl-9 rounded-xl bg-gray-50 border-gray-200"
              placeholder="Rechercher par nom ou description…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Recherche kits"
            />
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <Filter className="h-3.5 w-3.5" />
              Filtres
            </div>
            <Select value={userFilter} onValueChange={setUserFilter}>
              <SelectTrigger className="w-[200px] rounded-xl h-9 text-sm">
                <SelectValue placeholder="Auteur" />
              </SelectTrigger>
              <SelectContent className="rounded-xl max-h-64">
                <SelectItem value="all">Tous les auteurs</SelectItem>
                {users.map((u) => (
                  <SelectItem key={u.id} value={u.id}>
                    {u.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={actifFilter} onValueChange={setActifFilter}>
              <SelectTrigger className="w-[140px] rounded-xl h-9 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="all">Tous</SelectItem>
                <SelectItem value="true">Actifs</SelectItem>
                <SelectItem value="false">Inactifs</SelectItem>
              </SelectContent>
            </Select>
            {hasFilters && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="rounded-xl h-9 text-gray-600"
                onClick={clearFilters}
              >
                <X className="h-4 w-4 mr-1" />
                Réinitialiser
              </Button>
            )}
          </div>
        </div>
      </div>

      {error && (
        <div className={cn(cardSurface, "px-4 py-3 text-sm text-red-700 bg-red-50/80")}>
          {error instanceof Error ? error.message : "Erreur"}
        </div>
      )}

      {isLoading ? (
        <div className={cn(cardSurface, "flex items-center justify-center gap-2 py-20 text-gray-500")}>
          <Loader2 className="h-5 w-5 animate-spin" />
          Chargement…
        </div>
      ) : items.length === 0 ? (
        <div className={cn(cardSurface, "overflow-hidden")}>
          <Empty className="py-16">
            <EmptyHeader>
              <EmptyTitle>Aucun kit</EmptyTitle>
              <EmptyDescription>
                Créez un kit ou modifiez les filtres.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((r) => (
            <KitCard
              key={r.id}
              kit={r}
              onEdit={() => setDialog({ mode: "edit", row: r })}
              onDelete={() => setDeleteId(r.id)}
            />
          ))}
        </div>
      )}

      {total > 0 && (
        <div
          className={cn(
            cardSurface,
            "flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3",
          )}
        >
          <p className="text-sm text-gray-500">
            <span className="font-medium text-gray-700">{rangeFrom}</span>
            {" – "}
            <span className="font-medium text-gray-700">{rangeTo}</span>
            <span className="mx-1">sur</span>
            <span className="font-medium text-gray-700">{total}</span>
          </p>
          <div className="flex items-center gap-2">
            <Select
              value={String(pageSize)}
              onValueChange={(v) => {
                setPageSize(Number(v))
                setPage(1)
              }}
            >
              <SelectTrigger className="w-[100px] rounded-xl h-9 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                {PAGE_SIZES.map((s) => (
                  <SelectItem key={s} value={String(s)}>
                    {s} / page
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9 rounded-xl"
                disabled={page <= 1}
                onClick={() => setPage(1)}
                aria-label="Première page"
              >
                <ChevronFirst className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9 rounded-xl"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                aria-label="Page précédente"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm text-gray-600 px-2 tabular-nums min-w-[4rem] text-center">
                {page} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9 rounded-xl"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                aria-label="Page suivante"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9 rounded-xl"
                disabled={page >= totalPages}
                onClick={() => setPage(totalPages)}
                aria-label="Dernière page"
              >
                <ChevronLast className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      <Dialog open={!!dialog} onOpenChange={(o) => !o && setDialog(null)}>
        <DialogContent className="rounded-2xl border-gray-100 max-w-lg">
          <DialogHeader className="pt-2">
            <DialogTitle className="font-['DM_Sans',sans-serif]">
              {dialog?.mode === "edit" ? "Modifier le kit" : "Nouveau kit"}
            </DialogTitle>
            <DialogDescription>Nom unique par kit.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-2">
              <Label htmlFor="kit-nom">Nom</Label>
              <Input
                id="kit-nom"
                className="rounded-xl"
                value={form.nom}
                onChange={(e) => setForm((s) => ({ ...s, nom: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="kit-desc">Description</Label>
              <Textarea
                id="kit-desc"
                className="rounded-xl min-h-[80px]"
                value={form.description}
                onChange={(e) => setForm((s) => ({ ...s, description: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Auteur (utilisateur)</Label>
              <Select
                value={form.userId}
                onValueChange={(v) => setForm((s) => ({ ...s, userId: v }))}
              >
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="Choisir…" />
                </SelectTrigger>
                <SelectContent className="rounded-xl max-h-56">
                  {users.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.name} ({u.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-gray-100 px-3 py-2">
              <Label htmlFor="kit-actif">Actif</Label>
              <Switch
                id="kit-actif"
                checked={form.actif}
                onCheckedChange={(v) => setForm((s) => ({ ...s, actif: v }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" className="rounded-xl" onClick={() => setDialog(null)}>
              Annuler
            </Button>
            <Button
              className="rounded-xl bg-[#cd3b86] hover:bg-[#b8307a]"
              disabled={busy}
              onClick={() => void submitKit()}
            >
              {busy && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce kit ?</AlertDialogTitle>
            <AlertDialogDescription>
              Toutes les lignes du kit seront supprimées (cascade).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Annuler</AlertDialogCancel>
            <AlertDialogAction
              className="rounded-xl bg-red-600 hover:bg-red-700"
              onClick={() => void confirmDelete()}
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
