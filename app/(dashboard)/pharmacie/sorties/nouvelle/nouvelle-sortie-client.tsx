"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { toast } from "sonner"
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  ChevronRight,
  Loader2,
  Package,
  PackageCheck,
  Pill,
  Receipt,
  Search,
  User,
  Warehouse,
} from "lucide-react"
import {
  lookupDocumentPourSortie,
  previewSortieFefo,
  validerSortie,
  type ProduitAServir,
} from "@/app/actions/pharmacie-sortie"
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
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { DashboardActionBar } from "@/components/layout/dashboard-action-bar"
import { formatDate } from "@/lib/formatting"
import { cn } from "@/lib/utils"
import type { ProduitSortiePreview, SortieFefoPreview } from "@/lib/types/pharmacie-sortie"

const cardSurface =
  "rounded-2xl border border-gray-100 bg-white shadow-[0_2px_12px_rgba(0,0,0,0.06)]"

type DocState = {
  label: string
  encaissementId: string | null
  factureId: string | null
  patientLabel: string
  pharmacieNom: string
  magasinNom: string
  produits: ProduitAServir[]
}

function SectionHeader({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ElementType
  title: string
  description?: string
}) {
  return (
    <div className="flex items-start gap-3 border-b border-gray-100 px-5 py-4">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#cd3b86]/10 text-[#cd3b86]">
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

function QtyStat({
  label,
  value,
  accent,
}: {
  label: string
  value: number
  accent?: boolean
}) {
  return (
    <div className="rounded-lg bg-gray-50/90 px-3 py-2 text-center min-w-[72px]">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">
        {label}
      </p>
      <p
        className={cn(
          "mt-0.5 text-sm font-bold tabular-nums",
          accent ? "text-[#cd3b86]" : "text-gray-800",
        )}
      >
        {value}
      </p>
    </div>
  )
}

function ProduitSortieCard({
  produit,
  preview,
  selected,
  qty,
  index,
  onToggle,
  onQtyChange,
}: {
  produit: ProduitAServir
  preview: ProduitSortiePreview | undefined
  selected: boolean
  qty: string
  index: number
  onToggle: (checked: boolean) => void
  onQtyChange: (value: string) => void
}) {
  const qtyNum = Number(qty) || 0
  const lotsActifs = preview?.lots.filter((l) => l.quantiteAllouee > 0) ?? []
  const stockOk = !preview || preview.stockSuffisant

  return (
    <article
      className={cn(
        "overflow-hidden rounded-xl border transition-all duration-150",
        selected
          ? "border-[#cd3b86]/25 shadow-[0_2px_8px_rgba(205,59,134,0.08)]"
          : "border-gray-100 opacity-80",
        selected && !stockOk && qtyNum > 0 && "border-amber-300/80",
      )}
    >
      <div
        className={cn(
          "px-4 py-4 sm:px-5",
          selected ? "bg-gradient-to-r from-[#cd3b86]/[0.03] to-transparent" : "bg-white",
        )}
      >
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
          <div className="flex items-start gap-3 min-w-0 flex-1">
            <Checkbox
              checked={selected}
              onCheckedChange={(c) => onToggle(!!c)}
              className="mt-1"
            />
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <Pill className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-semibold text-gray-900 leading-snug">
                  {produit.produitNom}
                </h3>
                {produit.produitDosage && (
                  <span className="text-sm text-gray-400">{produit.produitDosage}</span>
                )}
                <span className="text-[10px] font-medium text-gray-300">#{index + 1}</span>
              </div>

              <div className="flex flex-wrap gap-2">
                <QtyStat label="Prescrit" value={produit.quantiteDemandee} />
                <QtyStat label="Servi" value={produit.quantiteDejaServie} />
                <QtyStat label="Reste" value={produit.quantiteRestante} accent />
              </div>

              {preview && qtyNum > 0 && selected && (
                <Badge
                  variant="outline"
                  className={cn(
                    "rounded-md text-[10px] font-medium",
                    stockOk
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                      : "border-amber-300 bg-amber-50 text-amber-800",
                  )}
                >
                  {stockOk
                    ? `Stock magasin : ${preview.stockDisponible}`
                    : `Stock insuffisant (${preview.stockDisponible} dispo.)`}
                </Badge>
              )}

              {preview?.message && selected && qtyNum > 0 && (
                <p className="flex items-start gap-2 rounded-lg border border-amber-200/80 bg-amber-50/80 px-3 py-2 text-xs text-amber-900">
                  <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                  {preview.message}
                </p>
              )}
            </div>
          </div>

          <div className="shrink-0 lg:w-36 lg:pt-1">
            <Label className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
              Qté à servir
            </Label>
            <Input
              type="number"
              min={1}
              max={produit.quantiteRestante}
              value={qty}
              onChange={(e) => onQtyChange(e.target.value)}
              disabled={!selected}
              className="mt-1.5 h-11 rounded-xl border-gray-200 bg-white text-center text-base font-semibold tabular-nums"
            />
          </div>
        </div>
      </div>

      {selected && qtyNum > 0 && preview && (
        <div className="border-t border-gray-100 bg-gray-50/40 px-4 py-3 sm:px-5">
          <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-gray-400">
            Lots FEFO — péremption la plus proche
          </p>
          {lotsActifs.length === 0 ? (
            <p className="py-3 text-center text-xs text-gray-500">
              {preview.stockSuffisant
                ? "Aucun lot alloué."
                : "Aucun lot disponible dans le magasin."}
            </p>
          ) : (
            <div className="space-y-2">
              {lotsActifs.map((lot) => (
                <div
                  key={lot.stockLotId}
                  className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-lg border border-gray-100 bg-white px-3 py-2.5 text-xs"
                >
                  <span className="font-mono font-semibold text-gray-800">{lot.numeroLot}</span>
                  <span className="text-gray-400">·</span>
                  <span className="text-gray-500">
                    Exp. {formatDate(lot.datePeremption)}
                  </span>
                  <span className="ml-auto flex items-center gap-3 tabular-nums">
                    <span className="text-gray-400">
                      Dispo <span className="font-medium text-gray-600">{lot.quantiteDisponible}</span>
                    </span>
                    <span className="inline-flex items-center rounded-md bg-[#cd3b86]/10 px-2 py-0.5 font-bold text-[#cd3b86]">
                      −{lot.quantiteAllouee}
                    </span>
                  </span>
                </div>
              ))}
              {preview.lots.length > lotsActifs.length && (
                <p className="text-[11px] text-gray-400 pl-1">
                  +{preview.lots.length - lotsActifs.length} autre(s) lot(s) non utilisé(s)
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </article>
  )
}

export function NouvelleSortieClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [ref, setRef] = React.useState("")
  const [loading, setLoading] = React.useState(false)
  const [pending, setPending] = React.useState(false)
  const [previewLoading, setPreviewLoading] = React.useState(false)
  const [confirmOpen, setConfirmOpen] = React.useState(false)
  const [showSearch, setShowSearch] = React.useState(true)
  const prefilledRef = React.useRef(false)
  const [doc, setDoc] = React.useState<DocState | null>(null)
  const [qtys, setQtys] = React.useState<Record<string, string>>({})
  const [selected, setSelected] = React.useState<Record<string, boolean>>({})
  const [fefoPreview, setFefoPreview] = React.useState<SortieFefoPreview | null>(null)

  const previewByProduit = React.useMemo(() => {
    const map = new Map<string, ProduitSortiePreview>()
    for (const p of fefoPreview?.produits ?? []) {
      map.set(p.produitId, p)
    }
    return map
  }, [fefoPreview])

  async function search(reference?: string) {
    const term = (reference ?? ref).trim()
    if (!term) return
    setRef(term)
    setLoading(true)
    setFefoPreview(null)
    try {
      const data = (await lookupDocumentPourSortie(term)) as DocState
      setDoc(data)
      const q: Record<string, string> = {}
      const s: Record<string, boolean> = {}
      for (const p of data.produits) {
        q[p.produitId] = String(p.quantiteRestante)
        s[p.produitId] = true
      }
      setQtys(q)
      setSelected(s)
      setShowSearch(false)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur")
      setDoc(null)
    } finally {
      setLoading(false)
    }
  }

  React.useEffect(() => {
    const initialRef = searchParams.get("ref")?.trim()
    if (!initialRef || prefilledRef.current) return
    prefilledRef.current = true
    setRef(initialRef)
    setShowSearch(false)
    void search(initialRef)
  }, [searchParams])

  React.useEffect(() => {
    if (!doc) {
      setFefoPreview(null)
      return
    }

    const lignes = doc.produits
      .filter((p) => selected[p.produitId])
      .map((p) => ({
        produitId: p.produitId,
        quantite: Math.min(
          p.quantiteRestante,
          Math.max(0, Number(qtys[p.produitId] || 0)),
        ),
      }))
      .filter((l) => l.quantite > 0)

    if (lignes.length === 0) {
      setFefoPreview(null)
      return
    }

    let cancelled = false
    const timer = setTimeout(() => {
      setPreviewLoading(true)
      void previewSortieFefo(lignes)
        .then((preview) => {
          if (!cancelled) setFefoPreview(preview)
        })
        .catch((e) => {
          if (!cancelled) {
            toast.error(e instanceof Error ? e.message : "Erreur aperçu stock")
            setFefoPreview(null)
          }
        })
        .finally(() => {
          if (!cancelled) setPreviewLoading(false)
        })
    }, 350)

    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [doc, selected, qtys])

  function buildLignes() {
    if (!doc) return []
    return doc.produits
      .filter((p) => selected[p.produitId])
      .map((p) => ({
        produitId: p.produitId,
        quantite: Math.min(
          p.quantiteRestante,
          Math.max(0, Number(qtys[p.produitId] || 0)),
        ),
        montantPatientUnitaire: p.montantPatientUnitaire,
      }))
      .filter((l) => l.quantite > 0)
  }

  async function submit() {
    if (!doc) return
    const lignes = buildLignes()
    if (lignes.length === 0) {
      toast.error("Sélectionnez au moins une ligne.")
      return
    }
    if (!fefoPreview?.peutValider) {
      toast.error("Stock insuffisant sur un ou plusieurs produits.")
      return
    }

    setPending(true)
    try {
      const res = await validerSortie({
        encaissementId: doc.encaissementId,
        factureId: doc.factureId,
        lignes,
      })
      if (res.ok) {
        toast.success("Sortie validée — stock décrémenté")
        router.push("/pharmacie/sorties")
      } else toast.error(res.error)
    } finally {
      setPending(false)
      setConfirmOpen(false)
    }
  }

  const lignesCount = buildLignes().length
  const totalUnits = buildLignes().reduce((s, l) => s + l.quantite, 0)
  const canValidate =
    lignesCount > 0 && fefoPreview?.peutValider && !previewLoading && !pending

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-28">
      <nav className="flex flex-wrap items-center gap-1.5 text-xs text-gray-400">
        <Link href="/pharmacie/sorties" className="hover:text-[#cd3b86] transition-colors">
          Sorties
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="font-medium text-gray-600">Valider une sortie</span>
      </nav>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1 min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
            Pharmacie
          </p>
          <h1 className="text-2xl font-extrabold tracking-tight text-gray-800">
            Valider une sortie
          </h1>
          <p className="max-w-xl text-sm text-gray-500 leading-relaxed">
            Contrôlez les lots FEFO et confirmez la délivrance des produits au patient.
          </p>
        </div>
        <Button
          asChild
          variant="outline"
          size="sm"
          className="shrink-0 gap-1.5 rounded-xl border-gray-200"
        >
          <Link href="/pharmacie/sorties">
            <ArrowLeft className="h-3.5 w-3.5" />
            Retour
          </Link>
        </Button>
      </div>

      {(showSearch || !doc) && (
        <section className={cardSurface}>
          <SectionHeader
            icon={Search}
            title="Rechercher un document"
            description="Saisissez le n° de reçu caisse ou de facture confirmée."
          />
          <div className="flex flex-col gap-3 p-5 sm:flex-row">
            <div className="relative flex-1">
              <Receipt className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <Input
                value={ref}
                onChange={(e) => setRef(e.target.value)}
                placeholder="Ex. REC-0007/07/26"
                className="h-11 rounded-xl border-gray-200 bg-gray-50/80 pl-9 font-sans text-sm"
                onKeyDown={(e) => e.key === "Enter" && void search()}
              />
            </div>
            <Button
              onClick={() => void search()}
              disabled={loading}
              className="h-11 gap-2 rounded-xl bg-gradient-to-r from-[#cd3b86] to-[#b8307a] px-6 text-white shadow-sm shrink-0"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
              Charger
            </Button>
          </div>
        </section>
      )}

      {loading && !doc && (
        <div
          className={cn(
            cardSurface,
            "flex items-center justify-center gap-2 px-5 py-16 text-sm text-gray-500",
          )}
        >
          <Loader2 className="h-5 w-5 animate-spin text-[#cd3b86]" />
          Chargement du document…
        </div>
      )}

      {doc && (
        <div className="grid gap-6 lg:grid-cols-[1fr_320px] xl:grid-cols-[1fr_360px]">
          <div className="space-y-4">
            <section className={cn(cardSurface, "overflow-hidden")}>
              <div className="border-b border-gray-100 px-5 py-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge
                        variant="outline"
                        className="rounded-lg border-[#cd3b86]/20 bg-[#cd3b86]/10 text-[#cd3b86] text-[10px] font-semibold"
                      >
                        <Receipt className="mr-1 h-3 w-3" />
                        Document
                      </Badge>
                      <h2 className="text-lg font-bold text-gray-900">{doc.label}</h2>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500">
                      <span className="inline-flex items-center gap-1.5">
                        <User className="h-3.5 w-3.5 text-gray-400" />
                        {doc.patientLabel}
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <Package className="h-3.5 w-3.5 text-gray-400" />
                        {doc.pharmacieNom}
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <Warehouse className="h-3.5 w-3.5 text-gray-400" />
                        {doc.magasinNom}
                      </span>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-xs text-gray-400 hover:text-gray-600"
                    onClick={() => setShowSearch(true)}
                  >
                    Changer de document
                  </Button>
                </div>
              </div>

              <div className="p-5 space-y-4">
                {doc.produits.length === 0 ? (
                  <div className="flex flex-col items-center py-12 text-center text-gray-500">
                    <PackageCheck className="h-10 w-10 mb-3 opacity-30" />
                    <p className="text-sm font-medium text-gray-600">
                      Aucun produit à servir
                    </p>
                    <p className="mt-1 text-xs">
                      Tous les produits pharmacie de ce document ont déjà été dispensés.
                    </p>
                  </div>
                ) : (
                  doc.produits.map((p, i) => (
                    <ProduitSortieCard
                      key={p.produitId}
                      produit={p}
                      preview={previewByProduit.get(p.produitId)}
                      selected={!!selected[p.produitId]}
                      qty={qtys[p.produitId] ?? ""}
                      index={i}
                      onToggle={(checked) =>
                        setSelected((s) => ({ ...s, [p.produitId]: checked }))
                      }
                      onQtyChange={(value) =>
                        setQtys((q) => ({ ...q, [p.produitId]: value }))
                      }
                    />
                  ))
                )}
              </div>
            </section>
          </div>

          <aside className="lg:sticky lg:top-4 lg:self-start">
            <section className={cardSurface}>
              <SectionHeader
                icon={PackageCheck}
                title="Récapitulatif"
                description="Vérification avant validation."
              />
              <div className="space-y-4 p-5">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Produits sélectionnés</span>
                    <span className="font-semibold text-gray-800">{lignesCount}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Unités à sortir</span>
                    <span className="font-semibold text-[#cd3b86] tabular-nums">
                      {totalUnits}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Magasin</span>
                    <span className="font-medium text-gray-700 text-right text-xs max-w-[160px] truncate">
                      {doc.magasinNom}
                    </span>
                  </div>
                </div>

                <div
                  className={cn(
                    "rounded-xl border px-3.5 py-3 text-sm",
                    previewLoading
                      ? "border-gray-100 bg-gray-50 text-gray-500"
                      : fefoPreview?.peutValider
                        ? "border-emerald-200 bg-emerald-50/80 text-emerald-800"
                        : lignesCount > 0
                          ? "border-amber-200 bg-amber-50/80 text-amber-900"
                          : "border-gray-100 bg-gray-50 text-gray-500",
                  )}
                >
                  {previewLoading ? (
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Calcul FEFO en cours…
                    </span>
                  ) : fefoPreview?.peutValider ? (
                    <span className="inline-flex items-center gap-2 font-medium">
                      <CheckCircle2 className="h-4 w-4 shrink-0" />
                      Stock suffisant — prêt à valider
                    </span>
                  ) : lignesCount > 0 ? (
                    <span className="inline-flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 shrink-0" />
                      Stock insuffisant ou quantité invalide
                    </span>
                  ) : (
                    "Sélectionnez au moins un produit."
                  )}
                </div>

                {fefoPreview && fefoPreview.produits.length > 0 && !previewLoading && (
                  <div className="space-y-2">
                    <p className="text-[11px] font-bold uppercase tracking-wide text-gray-400">
                      Prélèvement FEFO
                    </p>
                    <ul className="space-y-1.5 text-xs text-gray-600">
                      {fefoPreview.produits.map((p) => {
                        const prod = doc.produits.find((x) => x.produitId === p.produitId)
                        const lots = p.lots.filter((l) => l.quantiteAllouee > 0)
                        return (
                          <li
                            key={p.produitId}
                            className="rounded-lg border border-gray-100 bg-gray-50/60 px-3 py-2"
                          >
                            <p className="font-semibold text-gray-800">
                              {prod?.produitNom ?? p.produitId}{" "}
                              <span className="font-normal text-[#cd3b86]">×{p.quantite}</span>
                            </p>
                            {lots.map((l) => (
                              <p key={l.stockLotId} className="mt-0.5 font-mono text-[11px] text-gray-500">
                                Lot {l.numeroLot} · −{l.quantiteAllouee}
                              </p>
                            ))}
                          </li>
                        )
                      })}
                    </ul>
                  </div>
                )}
              </div>
            </section>
          </aside>
        </div>
      )}

      {doc && doc.produits.length > 0 && (
        <DashboardActionBar>
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
            <p className="hidden text-xs text-gray-500 sm:block">
              <span className="font-medium text-gray-700">{doc.patientLabel}</span>
              {" · "}
              {lignesCount} produit{lignesCount > 1 ? "s" : ""} · {totalUnits} unité
              {totalUnits > 1 ? "s" : ""}
            </p>
            <div className="flex w-full items-center justify-end gap-2 sm:w-auto">
              <Button asChild variant="outline" className="rounded-xl">
                <Link href="/pharmacie/sorties">Annuler</Link>
              </Button>
              <Button
                className="gap-2 min-w-[180px] rounded-xl bg-gradient-to-r from-[#cd3b86] to-[#b8307a] hover:from-[#b8307a] hover:to-[#9b2563] text-white shadow-sm"
                disabled={!canValidate}
                onClick={() => setConfirmOpen(true)}
              >
                {pending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <PackageCheck className="h-4 w-4" />
                )}
                Valider la sortie
              </Button>
            </div>
          </div>
        </DashboardActionBar>
      )}

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent className="rounded-2xl max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la sortie ?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3 text-sm text-muted-foreground">
                <p>
                  Le stock sera débité du magasin{" "}
                  <strong className="text-foreground">{doc?.magasinNom}</strong> selon
                  le FEFO.
                </p>
                {fefoPreview && (
                  <ul className="max-h-48 overflow-y-auto space-y-2 rounded-xl border border-gray-100 bg-gray-50 p-3 text-xs">
                    {fefoPreview.produits.map((p) => {
                      const prod = doc?.produits.find((x) => x.produitId === p.produitId)
                      return (
                        <li key={p.produitId} className="text-gray-700">
                          <span className="font-semibold text-gray-900">
                            {prod?.produitNom}
                          </span>
                          {" — "}
                          {p.quantite} u.
                          {p.lots
                            .filter((l) => l.quantiteAllouee > 0)
                            .map((l) => ` · ${l.numeroLot} (−${l.quantiteAllouee})`)
                            .join("")}
                        </li>
                      )
                    })}
                  </ul>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => void submit()}
              className="rounded-xl bg-gradient-to-r from-[#cd3b86] to-[#b8307a] hover:from-[#b8307a] hover:to-[#9b2563]"
            >
              Confirmer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
