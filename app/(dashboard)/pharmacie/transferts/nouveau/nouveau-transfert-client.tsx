"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import {
  ArrowLeft,
  ArrowRightLeft,
  Info,
  Loader2,
  Package,
  Plus,
  Trash2,
  Warehouse,
} from "lucide-react"
import { createTransfert, listLotsDisponibles } from "@/app/actions/pharmacie-ops"
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
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Combobox } from "@/components/ui/combobox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { formatDate } from "@/lib/formatting"
import { cn } from "@/lib/utils"

type Lot = {
  id: string
  produitNom: string
  produitDosage: string
  numeroLot: string
  datePeremption: string
  quantite: number
}

type Ligne = {
  stockLotId: string
  quantite: string
}

const emptyLigne = (): Ligne => ({ stockLotId: "", quantite: "1" })

export function NouveauTransfertClient({
  magasins,
}: {
  magasins: { id: string; nom: string; actif: boolean }[]
}) {
  const router = useRouter()
  const actifs = magasins.filter((m) => m.actif)
  const [sourceId, setSourceId] = React.useState(actifs[0]?.id ?? "")
  const [destId, setDestId] = React.useState(actifs[1]?.id ?? actifs[0]?.id ?? "")
  const [lots, setLots] = React.useState<Lot[]>([])
  const [lignes, setLignes] = React.useState<Ligne[]>([emptyLigne()])
  const [pending, setPending] = React.useState(false)
  const [loadingLots, setLoadingLots] = React.useState(false)
  const [confirmOpen, setConfirmOpen] = React.useState(false)

  React.useEffect(() => {
    if (!sourceId) return
    setLoadingLots(true)
    void listLotsDisponibles(sourceId).then((rows) => {
      setLots(rows as Lot[])
      setLignes([emptyLigne()])
      setLoadingLots(false)
    })
  }, [sourceId])

  const sourceMagasin = actifs.find((m) => m.id === sourceId)
  const destMagasin = actifs.find((m) => m.id === destId)
  const totalQte = lignes.reduce((s, l) => s + (Number(l.quantite) || 0), 0)

  const lotOptions = React.useMemo(
    () =>
      lots.map((lot) => ({
        value: lot.id,
        label: `${lot.produitNom}${lot.produitDosage ? ` ${lot.produitDosage}` : ""} — ${lot.numeroLot}`,
        description: `Dispo. ${lot.quantite} · Exp. ${formatDate(lot.datePeremption)}`,
      })),
    [lots],
  )

  const selectedLotIds = new Set(lignes.map((l) => l.stockLotId).filter(Boolean))

  function updateLigne(i: number, patch: Partial<Ligne>) {
    setLignes((prev) => prev.map((l, idx) => (idx === i ? { ...l, ...patch } : l)))
  }

  function optionsForLigne(currentId: string) {
    return lotOptions.map((opt) => ({
      ...opt,
      disabled: selectedLotIds.has(opt.value) && opt.value !== currentId,
    }))
  }

  function requestConfirm() {
    if (sourceId === destId) {
      toast.error("Les magasins source et destination doivent être différents.")
      return
    }
    if (lignes.some((l) => !l.stockLotId || !(Number(l.quantite) > 0))) {
      toast.error("Chaque ligne doit avoir un lot et une quantité valide.")
      return
    }
    setConfirmOpen(true)
  }

  async function submit() {
    setPending(true)
    try {
      const res = await createTransfert({
        magasinSourceId: sourceId,
        magasinDestId: destId,
        lignes: lignes.map((l) => ({
          stockLotId: l.stockLotId,
          quantite: Number(l.quantite),
        })),
      })
      if (res.ok) {
        setConfirmOpen(false)
        toast.success("Transfert effectué")
        router.push(`/pharmacie/transferts/${res.id}`)
      } else toast.error(res.error)
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link
            href="/pharmacie/transferts"
            className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 mb-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour aux transferts
          </Link>
          <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">
            Nouveau transfert
          </h1>
          <p className="text-sm text-gray-500 mt-1 max-w-xl">
            Déplacez des lots d’un magasin vers un autre. Le stock est mis à jour à la
            validation.
          </p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Card className="border border-gray-100 shadow-sm rounded-2xl bg-white">
          <CardContent className="px-4 py-3.5">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">
                  Source
                </p>
                <p className="text-base font-extrabold text-gray-900 mt-1 truncate">
                  {sourceMagasin?.nom ?? "—"}
                </p>
              </div>
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#cd3b86]/8 text-[#cd3b86]">
                <Warehouse className="h-4 w-4" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border border-gray-100 shadow-sm rounded-2xl bg-white">
          <CardContent className="px-4 py-3.5">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">
                  Destination
                </p>
                <p className="text-base font-extrabold text-gray-900 mt-1 truncate">
                  {destMagasin?.nom ?? "—"}
                </p>
              </div>
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <ArrowRightLeft className="h-4 w-4" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border border-gray-100 shadow-sm rounded-2xl bg-white">
          <CardContent className="px-4 py-3.5">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">
                  Lignes
                </p>
                <p className="text-xl font-extrabold tabular-nums text-gray-900 mt-1">
                  {lignes.length}
                  <span className="ml-2 text-sm font-semibold text-gray-400">
                    · {totalQte} unité{totalQte > 1 ? "s" : ""}
                  </span>
                </p>
              </div>
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <Package className="h-4 w-4" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border border-gray-100 shadow-sm rounded-2xl overflow-hidden bg-white">
        <CardHeader className="pb-4 border-b border-gray-50 px-5 sm:px-6 pt-5">
          <CardTitle className="text-base font-semibold flex items-center gap-2.5">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#cd3b86]/10 text-xs font-bold text-[#cd3b86]">
              1
            </span>
            Magasins
          </CardTitle>
        </CardHeader>
        <CardContent className="px-5 sm:px-6 py-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-gray-500">
                Magasin source
              </Label>
              <Select value={sourceId} onValueChange={setSourceId}>
                <SelectTrigger className="h-11 rounded-xl border-gray-200">
                  <SelectValue placeholder="Choisir un magasin…" />
                </SelectTrigger>
                <SelectContent>
                  {actifs.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.nom}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-gray-500">
                Magasin destination
              </Label>
              <Select value={destId} onValueChange={setDestId}>
                <SelectTrigger className="h-11 rounded-xl border-gray-200">
                  <SelectValue placeholder="Choisir un magasin…" />
                </SelectTrigger>
                <SelectContent>
                  {actifs.map((m) => (
                    <SelectItem key={m.id} value={m.id} disabled={m.id === sourceId}>
                      {m.nom}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border border-gray-100 shadow-sm rounded-2xl overflow-hidden bg-white">
        <CardHeader className="pb-4 border-b border-gray-50 px-5 sm:px-6 pt-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="text-base font-semibold flex items-center gap-2.5">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#cd3b86]/10 text-xs font-bold text-[#cd3b86]">
                2
              </span>
              Lots à transférer
            </CardTitle>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1.5 rounded-lg shrink-0"
              onClick={() => setLignes((p) => [...p, emptyLigne()])}
              disabled={loadingLots || lots.length === 0}
            >
              <Plus className="h-4 w-4" />
              Ajouter une ligne
            </Button>
          </div>
          <div className="mt-3 flex items-start gap-2.5 rounded-xl border border-blue-100 bg-blue-50/70 px-4 py-3 text-xs text-blue-900">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-blue-500" />
            <p>
              Sélectionnez un <strong>lot disponible</strong> dans le magasin source et la
              quantité à déplacer. La quantité ne peut pas dépasser le stock du lot.
            </p>
          </div>
        </CardHeader>
        <CardContent className="px-5 sm:px-6 py-5 space-y-2">
          {loadingLots ? (
            <div className="flex items-center justify-center gap-2 py-10 text-sm text-gray-400">
              <Loader2 className="h-4 w-4 animate-spin" />
              Chargement des lots…
            </div>
          ) : lots.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-10 text-center">
              <Package className="h-8 w-8 text-gray-300" />
              <p className="text-sm font-semibold text-gray-600">
                Aucun lot disponible
              </p>
              <p className="text-xs text-gray-400">
                Le magasin source n’a pas de stock à transférer.
              </p>
            </div>
          ) : (
            lignes.map((l, i) => {
              const lot = lots.find((x) => x.id === l.stockLotId)
              return (
                <div
                  key={i}
                  className="rounded-xl border border-gray-100 bg-gray-50/40 px-3 py-2.5"
                >
                  <div className="flex items-end gap-2">
                    <div className="grid min-w-0 flex-1 gap-3 sm:grid-cols-12">
                      <div className="space-y-2 sm:col-span-8">
                        <Label className="text-xs font-semibold text-gray-500">
                          Lot / produit
                        </Label>
                        <Combobox
                          options={optionsForLigne(l.stockLotId)}
                          value={l.stockLotId || undefined}
                          onChange={(stockLotId) =>
                            updateLigne(i, { stockLotId: stockLotId ?? "" })
                          }
                          placeholder="Rechercher un lot…"
                          searchPlaceholder="Produit, n° lot…"
                          emptyMessage="Aucun lot trouvé."
                          className="h-11 rounded-xl border-gray-200 bg-white"
                        />
                      </div>
                      <div className="space-y-2 sm:col-span-2">
                        <Label className="text-xs font-semibold text-gray-500">
                          Dispo.
                        </Label>
                        <div className="flex h-11 items-center rounded-xl border border-gray-200 bg-white px-3 text-sm tabular-nums text-gray-600">
                          {lot ? lot.quantite : "—"}
                        </div>
                      </div>
                      <div className="space-y-2 sm:col-span-2">
                        <Label className="text-xs font-semibold text-gray-500">
                          Quantité
                        </Label>
                        <Input
                          value={l.quantite}
                          onChange={(e) =>
                            updateLigne(i, { quantite: e.target.value })
                          }
                          inputMode="numeric"
                          className="h-11 rounded-xl border-gray-200 bg-white tabular-nums"
                        />
                      </div>
                    </div>
                    {lignes.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-11 w-11 shrink-0 text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                        onClick={() =>
                          setLignes((p) => p.filter((_, idx) => idx !== i))
                        }
                        aria-label="Retirer la ligne"
                        title="Retirer"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  {lot && (
                    <p className="mt-2 text-xs text-gray-400 pl-0.5">
                      Exp. {formatDate(lot.datePeremption)}
                      {lot.produitDosage ? ` · ${lot.produitDosage}` : ""}
                    </p>
                  )}
                </div>
              )
            })
          )}
        </CardContent>
      </Card>

      <Card className="border border-gray-100 shadow-sm rounded-2xl bg-white">
        <CardContent className="px-5 sm:px-6 py-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <p className="text-[11px] font-bold uppercase tracking-wide text-gray-400">
                Récapitulatif
              </p>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-600">
                <span className="inline-flex items-center gap-1.5">
                  <Warehouse className="h-3.5 w-3.5 text-gray-400" />
                  {sourceMagasin?.nom ?? "—"}
                </span>
                <ArrowRightLeft className="h-3.5 w-3.5 text-gray-300" />
                <span className="inline-flex items-center gap-1.5">
                  <Warehouse className="h-3.5 w-3.5 text-gray-400" />
                  {destMagasin?.nom ?? "—"}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Package className="h-3.5 w-3.5 text-gray-400" />
                  {lignes.length} ligne{lignes.length > 1 ? "s" : ""} · {totalQte} unité
                  {totalQte > 1 ? "s" : ""}
                </span>
              </div>
            </div>
            <Button
              type="button"
              onClick={requestConfirm}
              disabled={pending || loadingLots || lots.length === 0}
              className={cn(
                "h-11 shrink-0 gap-2 rounded-xl px-6",
                "bg-gradient-to-r from-[#cd3b86] to-[#b8307a] hover:from-[#b8307a] hover:to-[#9b2563] text-white shadow-sm",
              )}
            >
              <ArrowRightLeft className="h-4 w-4" />
              Effectuer le transfert
            </Button>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer le transfert ?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>
                  Vous allez transférer{" "}
                  <strong className="text-foreground tabular-nums">
                    {totalQte} unité{totalQte > 1 ? "s" : ""}
                  </strong>{" "}
                  ({lignes.length} ligne{lignes.length > 1 ? "s" : ""}) de{" "}
                  <strong className="text-foreground">
                    {sourceMagasin?.nom ?? "—"}
                  </strong>{" "}
                  vers{" "}
                  <strong className="text-foreground">
                    {destMagasin?.nom ?? "—"}
                  </strong>
                  .
                </p>
                <p>Le stock des deux magasins sera mis à jour immédiatement.</p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-lg" disabled={pending}>
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                void submit()
              }}
              disabled={pending}
              className="rounded-lg bg-[#cd3b86] hover:bg-[#b8307a] gap-2"
            >
              {pending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ArrowRightLeft className="h-4 w-4" />
              )}
              Confirmer le transfert
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
