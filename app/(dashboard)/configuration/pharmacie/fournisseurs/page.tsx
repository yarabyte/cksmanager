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
  Truck,
  Loader2,
  Pencil,
  Plus,
  Search,
  Trash2,
  Phone,
  Mail,
  MapPin,
} from "lucide-react"
import { useFournisseursList, useFournisseurMutations } from "@/hooks/use-pharmacie"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

const cardSurface =
  "rounded-2xl border border-gray-100 bg-white shadow-[0_2px_12px_rgba(0,0,0,0.06)] transition-all duration-200 ease-in-out"

type Row = {
  id: string
  raisonSociale: string
  adresse?: string | null
  telephone1?: string | null
  telephone2?: string | null
  email?: string | null
  actif: boolean
}

function FournisseurCard({
  row,
  onEdit,
  onDelete,
}: {
  row: Row
  onEdit: () => void
  onDelete: () => void
}) {
  const initials = row.raisonSociale
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
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-sm font-bold text-[#d97706]">
              {initials || <Truck className="h-5 w-5" />}
            </div>
            <div className="min-w-0 flex-1">
              <p className="break-words text-base font-bold leading-snug text-gray-800">
                {row.raisonSociale}
              </p>
              <div className="mt-2">
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
              aria-label={`Modifier ${row.raisonSociale}`}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-lg text-red-500 hover:bg-red-50 hover:text-red-700"
              onClick={onDelete}
              aria-label={`Supprimer ${row.raisonSociale}`}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="mt-4 space-y-2 text-sm text-gray-600">
          {row.adresse?.trim() ? (
            <p className="flex items-start gap-2 break-words leading-relaxed">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
              <span>{row.adresse}</span>
            </p>
          ) : (
            <p className="flex items-center gap-2 text-gray-400">
              <MapPin className="h-4 w-4 shrink-0" />
              <span className="text-xs">Adresse non renseignée</span>
            </p>
          )}
          <p className="flex items-center gap-2">
            <Phone className="h-4 w-4 shrink-0 text-gray-400" />
            <span className="tabular-nums">{row.telephone1 ?? "—"}</span>
            {row.telephone2 ? (
              <span className="text-gray-400">· {row.telephone2}</span>
            ) : null}
          </p>
          <p className="flex items-start gap-2 break-all">
            <Mail className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
            <span>{row.email?.trim() ? row.email : "—"}</span>
          </p>
        </div>
      </div>
    </div>
  )
}

export default function FournisseursPage() {
  const [q, setQ] = React.useState("")
  const [debounced, setDebounced] = React.useState("")
  React.useEffect(() => {
    const t = setTimeout(() => setDebounced(q.trim()), 300)
    return () => clearTimeout(t)
  }, [q])

  const { data: raw, isLoading, error } = useFournisseursList(debounced || undefined)
  const rows = (raw ?? []) as unknown as Row[]

  const { create, update, remove } = useFournisseurMutations()

  const [dialog, setDialog] = React.useState<
    null | { mode: "create" } | { mode: "edit"; row: Row }
  >(null)
  const [form, setForm] = React.useState({
    raisonSociale: "",
    adresse: "",
    telephone1: "",
    telephone2: "",
    email: "",
    actif: true,
  })
  const [deleteId, setDeleteId] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (!dialog) return
    if (dialog.mode === "create") {
      setForm({
        raisonSociale: "",
        adresse: "",
        telephone1: "",
        telephone2: "",
        email: "",
        actif: true,
      })
    } else {
      const r = dialog.row
      setForm({
        raisonSociale: r.raisonSociale,
        adresse: r.adresse ?? "",
        telephone1: r.telephone1 ?? "",
        telephone2: r.telephone2 ?? "",
        email: r.email ?? "",
        actif: r.actif,
      })
    }
  }, [dialog])

  async function submit() {
    if (!form.raisonSociale.trim()) {
      toast.error("Raison sociale requise.")
      return
    }
    try {
      const payload = {
        raisonSociale: form.raisonSociale.trim(),
        adresse: form.adresse.trim() || null,
        telephone1: form.telephone1.trim() || null,
        telephone2: form.telephone2.trim() || null,
        email: form.email.trim() || null,
        actif: form.actif,
      }
      if (dialog?.mode === "create") {
        await create.mutateAsync(payload)
        toast.success("Fournisseur créé.")
      } else if (dialog?.mode === "edit") {
        await update.mutateAsync({ id: dialog.row.id, ...payload })
        toast.success("Fournisseur mis à jour.")
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
      toast.error(e instanceof Error ? e.message : "Erreur")
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
              <Truck className="h-7 w-7 text-[#d97706]" />
              Fournisseurs
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              Grossistes et distributeurs (référentiel autonome).
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
            aria-label="Recherche fournisseurs"
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
              <EmptyTitle>Aucun fournisseur</EmptyTitle>
              <EmptyDescription>Ajoutez un distributeur ou modifiez la recherche.</EmptyDescription>
            </EmptyHeader>
          </Empty>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {rows.map((r) => (
            <FournisseurCard
              key={r.id}
              row={r}
              onEdit={() => setDialog({ mode: "edit", row: r })}
              onDelete={() => setDeleteId(r.id)}
            />
          ))}
        </div>
      )}

      <Dialog open={!!dialog} onOpenChange={(o) => !o && setDialog(null)}>
        <DialogContent className="rounded-2xl border-gray-100 max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-['DM_Sans',sans-serif]">
              {dialog?.mode === "edit" ? "Modifier le fournisseur" : "Nouveau fournisseur"}
            </DialogTitle>
            <DialogDescription>Coordonnées du distributeur.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-2">
              <Label htmlFor="rs">Raison sociale</Label>
              <Input
                id="rs"
                className="rounded-xl"
                value={form.raisonSociale}
                onChange={(e) => setForm((s) => ({ ...s, raisonSociale: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="adr">Adresse</Label>
              <Input
                id="adr"
                className="rounded-xl"
                value={form.adresse}
                onChange={(e) => setForm((s) => ({ ...s, adresse: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="t1">Téléphone 1</Label>
                <Input
                  id="t1"
                  className="rounded-xl"
                  value={form.telephone1}
                  onChange={(e) => setForm((s) => ({ ...s, telephone1: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="t2">Téléphone 2</Label>
                <Input
                  id="t2"
                  className="rounded-xl"
                  value={form.telephone2}
                  onChange={(e) => setForm((s) => ({ ...s, telephone2: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="em">Email</Label>
              <Input
                id="em"
                type="email"
                className="rounded-xl"
                value={form.email}
                onChange={(e) => setForm((s) => ({ ...s, email: e.target.value }))}
              />
            </div>
            <div className="flex items-center justify-between rounded-xl border border-gray-100 px-3 py-2">
              <Label htmlFor="actif-four">Actif</Label>
              <Switch
                id="actif-four"
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
            <AlertDialogTitle>Supprimer ce fournisseur ?</AlertDialogTitle>
            <AlertDialogDescription>Action définitive.</AlertDialogDescription>
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
