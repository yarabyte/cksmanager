"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import {
  ArrowLeft,
  Calendar,
  Info,
  Loader2,
  Package,
  Plus,
  Save,
  Trash2,
  Truck,
  Warehouse,
} from "lucide-react"
import {
  saveApprovisionnement,
  validerApprovisionnement,
} from "@/app/actions/pharmacie-ops"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Combobox } from "@/components/ui/combobox"
import { DatePickerFr } from "@/components/ui/date-picker-fr"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { formatCurrency, formatDate } from "@/lib/formatting"
import { cn } from "@/lib/utils"

type Ligne = {
  produitId: string
  quantite: string
  numeroLot: string
  datePeremption: string
  prixAchatUnitaire: string
}

const emptyLigne = (): Ligne => ({
  produitId: "",
  quantite: "1",
  numeroLot: "",
  datePeremption: "",
  prixAchatUnitaire: "0",
})

export type ApproFormInitial = {
  id: string
  numero: string
  magasinId: string
  fournisseurId: string | null
  dateReception: string
  note: string | null
  lignes: {
    produitId: string | null
    quantite: number
    numeroLot: string
    datePeremption: string
    prixAchatUnitaire: number
  }[]
}

function toDateInput(iso: string) {
  if (!iso) return ""
  return iso.slice(0, 10)
}

export function NouveauApproClient({
  magasins,
  fournisseurs,
  produits,
  initial,
}: {
  magasins: { id: string; nom: string; actif: boolean }[]
  fournisseurs: { id: string; nom: string }[]
  produits: { id: string; nom: string; dosage: string; prixAchatRef: number }[]
  initial?: ApproFormInitial
}) {
  const router = useRouter()
  const isEdit = Boolean(initial?.id)
  const [magasinId, setMagasinId] = React.useState(
    initial?.magasinId ?? magasins.find((m) => m.actif)?.id ?? "",
  )
  const [fournisseurId, setFournisseurId] = React.useState(
    initial?.fournisseurId ?? "none",
  )
  const [dateReception, setDateReception] = React.useState(
    () =>
      (initial?.dateReception ? toDateInput(initial.dateReception) : null) ??
      new Date().toISOString().slice(0, 10),
  )
  const [note, setNote] = React.useState(initial?.note ?? "")
  const [lignes, setLignes] = React.useState<Ligne[]>(() =>
    initial?.lignes?.length
      ? initial.lignes.map((l) => ({
          produitId: l.produitId ?? "",
          quantite: String(l.quantite || 0),
          numeroLot: l.numeroLot ?? "",
          datePeremption: toDateInput(l.datePeremption),
          prixAchatUnitaire: String(l.prixAchatUnitaire ?? 0),
        }))
      : [emptyLigne()],
  )
  const [pending, setPending] = React.useState<"save" | "valider" | null>(null)

  const selectedMagasin = magasins.find((m) => m.id === magasinId)
  const produitOptions = React.useMemo(
    () =>
      produits.map((p) => ({
        value: p.id,
        label: `${p.nom}${p.dosage ? ` ${p.dosage}` : ""}`,
        description: p.dosage || undefined,
        searchText: [p.nom, p.dosage].filter(Boolean).join(" "),
      })),
    [produits],
  )
  const totalQte = lignes.reduce((s, l) => s + (Number(l.quantite) || 0), 0)
  const totalAchat = lignes.reduce(
    (s, l) => s + (Number(l.quantite) || 0) * (Number(l.prixAchatUnitaire) || 0),
    0,
  )

  function updateLigne(i: number, patch: Partial<Ligne>) {
    setLignes((prev) => prev.map((l, idx) => (idx === i ? { ...l, ...patch } : l)))
  }

  function buildPayload() {
    return {
      ...(initial?.id ? { id: initial.id } : {}),
      magasinId,
      fournisseurId: fournisseurId === "none" ? null : fournisseurId,
      dateReception,
      note: note || null,
      lignes: lignes.map((l) => ({
        produitId: l.produitId || null,
        quantite: Number(l.quantite) || 0,
        numeroLot: l.numeroLot || null,
        datePeremption: l.datePeremption || null,
        prixAchatUnitaire: Number(l.prixAchatUnitaire) || 0,
      })),
    }
  }

  async function handleSave() {
    setPending("save")
    try {
      const res = await saveApprovisionnement(buildPayload())
      if (res.ok) {
        toast.success("Brouillon enregistré")
        router.push(`/pharmacie/approvisionnements/${res.id}`)
        router.refresh()
      } else toast.error(res.error)
    } finally {
      setPending(null)
    }
  }

  async function handleValider() {
    setPending("valider")
    try {
      const saved = await saveApprovisionnement(buildPayload())
      if (!saved.ok) {
        toast.error(saved.error)
        return
      }
      const res = await validerApprovisionnement(saved.id)
      if (res.ok) {
        toast.success("Réception validée — stock mis à jour")
        router.push(`/pharmacie/approvisionnements/${res.id}`)
        router.refresh()
      } else toast.error(res.error)
    } finally {
      setPending(null)
    }
  }

  const backHref = initial?.id
    ? `/pharmacie/approvisionnements/${initial.id}`
    : "/pharmacie/approvisionnements"

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link
            href={backHref}
            className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 mb-2"
          >
            <ArrowLeft className="h-4 w-4" />
            {isEdit ? "Retour au détail" : "Retour aux approvisionnements"}
          </Link>
          <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">
            {isEdit ? `Modifier ${initial?.numero}` : "Nouvelle réception"}
          </h1>
          <p className="text-sm text-gray-500 mt-1 max-w-xl">
            {isEdit
              ? "Enregistrez le brouillon ou validez la réception pour entrer le stock."
              : "Sauvegardez un brouillon à tout moment. Le stock n’est incrémenté qu’à la validation."}
          </p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Card className="border border-gray-100 shadow-sm rounded-2xl bg-white">
          <CardContent className="px-4 py-3.5">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">
                  Magasin
                </p>
                <p className="text-base font-extrabold text-gray-900 mt-1 truncate">
                  {selectedMagasin?.nom ?? "—"}
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
              <div>
                <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">
                  Lignes
                </p>
                <p className="text-xl font-extrabold tabular-nums text-gray-900 mt-1">
                  {lignes.length}
                </p>
              </div>
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <Package className="h-4 w-4" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border border-gray-100 shadow-sm rounded-2xl bg-white">
          <CardContent className="px-4 py-3.5">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">
                  Total estimé
                </p>
                <p className="text-xl font-extrabold tabular-nums text-[#cd3b86] mt-1">
                  {formatCurrency(totalAchat)}
                </p>
              </div>
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <Truck className="h-4 w-4" />
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
            En-tête de réception
          </CardTitle>
        </CardHeader>
        <CardContent className="px-5 sm:px-6 py-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-gray-500">Magasin</Label>
              <Select value={magasinId} onValueChange={setMagasinId}>
                <SelectTrigger className="h-11 rounded-xl border-gray-200">
                  <SelectValue placeholder="Choisir un magasin…" />
                </SelectTrigger>
                <SelectContent>
                  {magasins
                    .filter((m) => m.actif)
                    .map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.nom}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-gray-500">Fournisseur</Label>
              <Select value={fournisseurId} onValueChange={setFournisseurId}>
                <SelectTrigger className="h-11 rounded-xl border-gray-200">
                  <SelectValue placeholder="Optionnel" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Aucun</SelectItem>
                  {fournisseurs.map((f) => (
                    <SelectItem key={f.id} value={f.id}>
                      {f.nom}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-gray-500">Date de réception</Label>
              <DatePickerFr
                dateValue={dateReception}
                onDateChange={setDateReception}
                className="h-11 rounded-xl border-gray-200"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-gray-500">Note</Label>
              <Input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Commentaire optionnel…"
                className="h-11 rounded-xl border-gray-200"
              />
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
              Lignes de stock
            </CardTitle>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1.5 rounded-lg shrink-0"
              onClick={() => setLignes((p) => [...p, emptyLigne()])}
            >
              <Plus className="h-4 w-4" />
              Ajouter une ligne
            </Button>
          </div>
          <div className="mt-3 flex items-start gap-2.5 rounded-xl border border-blue-100 bg-blue-50/70 px-4 py-3 text-xs text-blue-900">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-blue-500" />
            <p>
              Un brouillon peut être incomplet. Pour <strong>valider</strong>, chaque ligne doit
              avoir un produit, une quantité, un <strong>n° de lot</strong> et une{" "}
              <strong>date de péremption</strong>. Le stock n’est mis à jour qu’à la validation.
            </p>
          </div>
        </CardHeader>
        <CardContent className="px-5 sm:px-6 py-5 space-y-2">
          {lignes.map((l, i) => (
            <div
              key={i}
              className="rounded-xl border border-gray-100 bg-gray-50/40 px-3 py-2.5"
            >
              <div className="flex items-end gap-2">
                <div className="grid min-w-0 flex-1 gap-3 sm:grid-cols-2 lg:grid-cols-12">
                  <div className="space-y-2 lg:col-span-4">
                    <Label className="text-xs font-semibold text-gray-500">Produit</Label>
                    <Combobox
                      options={produitOptions}
                      value={l.produitId || undefined}
                      onChange={(produitId) => {
                        const p = produits.find((x) => x.id === produitId)
                        updateLigne(i, {
                          produitId: produitId ?? "",
                          prixAchatUnitaire: String(p?.prixAchatRef ?? 0),
                        })
                      }}
                      placeholder="Rechercher un produit…"
                      searchPlaceholder="Nom, dosage…"
                      emptyMessage="Aucun produit trouvé."
                      className="h-11 rounded-xl border-gray-200 bg-white"
                    />
                  </div>

                  <div className="space-y-2 lg:col-span-2">
                    <Label className="text-xs font-semibold text-gray-500">Quantité</Label>
                    <Input
                      value={l.quantite}
                      onChange={(e) => updateLigne(i, { quantite: e.target.value })}
                      inputMode="numeric"
                      className="h-11 rounded-xl border-gray-200 bg-white tabular-nums"
                    />
                  </div>

                  <div className="space-y-2 lg:col-span-2">
                    <Label className="text-xs font-semibold text-gray-500">N° lot</Label>
                    <Input
                      value={l.numeroLot}
                      onChange={(e) => updateLigne(i, { numeroLot: e.target.value })}
                      placeholder="Ex. L2026-01"
                      className="h-11 rounded-xl border-gray-200 bg-white font-mono text-sm"
                    />
                  </div>

                  <div className="space-y-2 lg:col-span-2">
                    <Label className="text-xs font-semibold text-gray-500">Péremption</Label>
                    <DatePickerFr
                      dateValue={l.datePeremption}
                      onDateChange={(datePeremption) => updateLigne(i, { datePeremption })}
                      className="h-11 rounded-xl border-gray-200 bg-white"
                    />
                  </div>

                  <div className="space-y-2 lg:col-span-2">
                    <Label className="text-xs font-semibold text-gray-500">PU achat (FCFA)</Label>
                    <Input
                      value={l.prixAchatUnitaire}
                      onChange={(e) => updateLigne(i, { prixAchatUnitaire: e.target.value })}
                      inputMode="decimal"
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
                    onClick={() => setLignes((p) => p.filter((_, idx) => idx !== i))}
                    aria-label="Retirer la ligne"
                    title="Retirer"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          ))}
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
                  {selectedMagasin?.nom ?? "—"}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Package className="h-3.5 w-3.5 text-gray-400" />
                  {lignes.length} ligne{lignes.length > 1 ? "s" : ""} · {totalQte} unité
                  {totalQte > 1 ? "s" : ""}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-gray-400" />
                  {dateReception ? formatDate(dateReception) : "—"}
                </span>
                <span className="font-semibold text-[#cd3b86] tabular-nums">
                  {formatCurrency(totalAchat)}
                </span>
              </div>
            </div>
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center">
              <Button
                type="button"
                variant="outline"
                onClick={() => void handleSave()}
                disabled={pending !== null}
                className="h-11 shrink-0 gap-2 rounded-xl px-5"
              >
                {pending === "save" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Sauvegarder
              </Button>
              <Button
                type="button"
                onClick={() => void handleValider()}
                disabled={pending !== null}
                className={cn(
                  "h-11 shrink-0 gap-2 rounded-xl px-6",
                  "bg-gradient-to-r from-[#cd3b86] to-[#b8307a] hover:from-[#b8307a] hover:to-[#9b2563] text-white shadow-sm",
                )}
              >
                {pending === "valider" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Truck className="h-4 w-4" />
                )}
                Valider la réception
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
