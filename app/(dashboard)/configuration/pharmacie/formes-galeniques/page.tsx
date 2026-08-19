"use client"

import * as React from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
  ArrowLeft,
  Pill,
  Loader2,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react"
import {
  useFormesGaleniquesList,
  useFormeGaleniqueMutations,
} from "@/hooks/use-pharmacie"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

const cardSurface =
  "rounded-2xl border border-gray-100 bg-white shadow-[0_2px_12px_rgba(0,0,0,0.06)] transition-all duration-200 ease-in-out"

type Row = {
  id: string
  libelle: string
  isCommon: boolean
  rank: number
  actif: boolean
}

function FormeGaleniqueCard({
  row,
  onEdit,
  onDelete,
}: {
  row: Row
  onEdit: () => void
  onDelete: () => void
}) {
  const initials = row.libelle
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("")

  return (
    <div
      className={cn(
        cardSurface,
        "group flex flex-col overflow-hidden hover:shadow-[0_4px_20px_rgba(0,0,0,0.08)]",
      )}
    >
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 flex-1 items-start gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-sm font-bold text-[#58a639]">
              {initials || <Pill className="h-5 w-5" />}
            </div>
            <div className="min-w-0 flex-1">
              <p className="break-words text-base font-bold leading-snug text-gray-800">
                {row.libelle}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                {row.isCommon ? (
                  <Badge className="h-5 bg-[#58a639] px-1.5 text-[10px] hover:bg-[#58a639]">
                    Courant
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="h-5 px-1.5 text-[10px]">
                    Non courant
                  </Badge>
                )}
                {row.actif ? (
                  <Badge className="h-5 bg-[#58a639] px-1.5 text-[10px] hover:bg-[#58a639]">
                    Actif
                  </Badge>
                ) : (
                  <Badge variant="outline" className="h-5 px-1.5 text-[10px] text-gray-500">
                    Inactif
                  </Badge>
                )}
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
              aria-label={`Modifier ${row.libelle}`}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-lg text-red-500 hover:bg-red-50 hover:text-red-700"
              onClick={onDelete}
              aria-label={`Supprimer ${row.libelle}`}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="mt-4 rounded-xl border border-gray-100 bg-gray-50/80 px-3 py-2.5">
          <p className="text-[10px] font-semibold tracking-wide text-gray-400">Rang (tri)</p>
          <p className="mt-0.5 text-lg font-extrabold tabular-nums text-gray-800">{row.rank}</p>
        </div>
      </div>
    </div>
  )
}

export default function FormesGaleniquesPage() {
  const [q, setQ] = React.useState("")
  const [debounced, setDebounced] = React.useState("")
  React.useEffect(() => {
    const t = setTimeout(() => setDebounced(q.trim()), 300)
    return () => clearTimeout(t)
  }, [q])

  const { data: raw, isLoading, error } = useFormesGaleniquesList(debounced || undefined)
  const rows = (raw ?? []) as unknown as Row[]

  const { create, update, remove } = useFormeGaleniqueMutations()

  const [dialog, setDialog] = React.useState<
    null | { mode: "create" } | { mode: "edit"; row: Row }
  >(null)
  const [form, setForm] = React.useState({
    libelle: "",
    isCommon: true,
    rank: 100,
    actif: true,
  })
  const [deleteId, setDeleteId] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (!dialog) return
    if (dialog.mode === "create") {
      setForm({ libelle: "", isCommon: true, rank: 100, actif: true })
    } else {
      const r = dialog.row
      setForm({
        libelle: r.libelle,
        isCommon: r.isCommon,
        rank: r.rank,
        actif: r.actif,
      })
    }
  }, [dialog])

  async function submit() {
    if (!form.libelle.trim()) {
      toast.error("Libellé requis.")
      return
    }
    try {
      if (dialog?.mode === "create") {
        await create.mutateAsync({
          libelle: form.libelle.trim(),
          isCommon: form.isCommon,
          rank: form.rank,
          actif: form.actif,
        })
        toast.success("Forme galénique créée.")
      } else if (dialog?.mode === "edit") {
        await update.mutateAsync({
          id: dialog.row.id,
          libelle: form.libelle.trim(),
          isCommon: form.isCommon,
          rank: form.rank,
          actif: form.actif,
        })
        toast.success("Forme mise à jour.")
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
      toast.success("Supprimé.")
      setDeleteId(null)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Impossible (produits liés ?)")
    }
  }

  const busy = create.isPending || update.isPending || remove.isPending

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <Button variant="ghost" size="icon" className="rounded-xl shrink-0" asChild>
            <Link href="/configuration/pharmacie" aria-label="Retour">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <p className="text-[11px] font-bold text-[#cd3b86] uppercase tracking-widest">
              Configuration · Pharmacie
            </p>
            <h1 className="text-2xl font-bold text-gray-900 font-['DM_Sans',sans-serif] flex items-center gap-2">
              <Pill className="h-7 w-7 text-[#58a639]" />
              Formes galéniques
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              Comprimé, sirop, solution injectable, etc.
            </p>
          </div>
        </div>
        <Button
          className="rounded-xl bg-[#cd3b86] hover:bg-[#b8307a] text-white shrink-0"
          onClick={() => setDialog({ mode: "create" })}
        >
          <Plus className="h-4 w-4 mr-2" />
          Ajouter
        </Button>
      </div>

      <div className={cn(cardSurface, "p-4")}>
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            className="pl-9 rounded-xl bg-gray-50 border-gray-200"
            placeholder="Rechercher…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            aria-label="Recherche formes galéniques"
          />
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
      ) : rows.length === 0 ? (
        <div className={cn(cardSurface, "overflow-hidden")}>
          <Empty className="py-16">
            <EmptyHeader>
              <EmptyTitle>Aucune forme</EmptyTitle>
              <EmptyDescription>
                Ajoutez une forme galénique ou élargissez la recherche.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {rows.map((r) => (
            <FormeGaleniqueCard
              key={r.id}
              row={r}
              onEdit={() => setDialog({ mode: "edit", row: r })}
              onDelete={() => setDeleteId(r.id)}
            />
          ))}
        </div>
      )}

      <Dialog open={!!dialog} onOpenChange={(o) => !o && setDialog(null)}>
        <DialogContent className="rounded-2xl border-gray-100 max-w-md">
          <DialogHeader>
            <DialogTitle className="font-['DM_Sans',sans-serif]">
              {dialog?.mode === "edit" ? "Modifier" : "Nouvelle forme galénique"}
            </DialogTitle>
            <DialogDescription>Libellé unique.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="libelle-fg">Libellé</Label>
              <Input
                id="libelle-fg"
                className="rounded-xl"
                value={form.libelle}
                onChange={(e) => setForm((s) => ({ ...s, libelle: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rank-fg">Rang (tri)</Label>
              <Input
                id="rank-fg"
                type="number"
                className="rounded-xl"
                value={form.rank}
                onChange={(e) =>
                  setForm((s) => ({ ...s, rank: Number.parseInt(e.target.value, 10) || 0 }))
                }
              />
            </div>
            <div className="flex items-center justify-between rounded-xl border border-gray-100 px-3 py-2">
              <Label htmlFor="isCommon-fg">Courant</Label>
              <Switch
                id="isCommon-fg"
                checked={form.isCommon}
                onCheckedChange={(v) => setForm((s) => ({ ...s, isCommon: v }))}
              />
            </div>
            <div className="flex items-center justify-between rounded-xl border border-gray-100 px-3 py-2">
              <Label htmlFor="actif-fg">Actif</Label>
              <Switch
                id="actif-fg"
                checked={form.actif}
                onCheckedChange={(v) => setForm((s) => ({ ...s, actif: v }))}
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" className="rounded-xl" onClick={() => setDialog(null)}>
              Annuler
            </Button>
            <Button
              className="rounded-xl bg-[#cd3b86] hover:bg-[#b8307a]"
              disabled={busy}
              onClick={() => void submit()}
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
            <AlertDialogTitle>Supprimer cette forme ?</AlertDialogTitle>
            <AlertDialogDescription>
              Impossible si des produits y sont liés.
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
