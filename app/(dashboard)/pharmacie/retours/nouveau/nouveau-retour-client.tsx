"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import {
  ArrowLeft,
  ChevronRight,
  Loader2,
  Package,
  Pill,
  RotateCcw,
  Undo2,
  Wallet,
} from "lucide-react"
import { createRetour, getSortiePourRetour } from "@/app/actions/pharmacie-retour"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { DashboardActionBar } from "@/components/layout/dashboard-action-bar"
import { formatCurrency, formatDate } from "@/lib/formatting"
import { cn } from "@/lib/utils"

const cardSurface =
  "rounded-2xl border border-gray-100 bg-white shadow-[0_2px_12px_rgba(0,0,0,0.06)]"

type SortieOpt = {
  id: string
  numero: string
  encaissementNumero: string | null
  factureNumero: string | null
}

type LigneRetour = {
  id: string
  produitNom: string
  produitDosage: string | null
  numeroLot: string
  datePeremption: string
  quantiteServie: number
  quantiteDejaRetournee: number
  quantiteRetournable: number
  montantPatientUnitaire: number
}

type SortieRetourState = {
  id: string
  numero: string
  patientId: string
  patientLabel: string | null
  lignes: LigneRetour[]
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

function LigneRetourCard({
  ligne,
  index,
  selected,
  qty,
  onToggle,
  onQtyChange,
}: {
  ligne: LigneRetour
  index: number
  selected: boolean
  qty: string
  onToggle: (checked: boolean) => void
  onQtyChange: (value: string) => void
}) {
  const qtyNum = Number(qty) || 0
  const montantLigne = qtyNum * ligne.montantPatientUnitaire

  return (
    <article
      className={cn(
        "overflow-hidden rounded-xl border transition-all duration-150",
        selected
          ? "border-[#cd3b86]/25 shadow-[0_2px_8px_rgba(205,59,134,0.08)]"
          : "border-gray-100 opacity-80",
        selected && qtyNum > ligne.quantiteRetournable && "border-amber-300/80",
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
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sky-600">
              <Pill className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-semibold text-gray-900">{ligne.produitNom}</h3>
                {ligne.produitDosage && (
                  <span className="text-sm text-gray-400">{ligne.produitDosage}</span>
                )}
                <span className="text-[10px] font-medium text-gray-300">#{index + 1}</span>
              </div>

              <div className="flex flex-wrap gap-2">
                <QtyStat label="Servi" value={ligne.quantiteServie} />
                <QtyStat label="Retourné" value={ligne.quantiteDejaRetournee} />
                <QtyStat label="Retournable" value={ligne.quantiteRetournable} accent />
              </div>

              <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
                <span className="font-mono font-semibold text-gray-700">{ligne.numeroLot}</span>
                <span className="text-gray-300">·</span>
                <span>Exp. {formatDate(ligne.datePeremption)}</span>
                <span className="text-gray-300">·</span>
                <span>{formatCurrency(ligne.montantPatientUnitaire)} / u.</span>
              </div>

              {selected && qtyNum > ligne.quantiteRetournable && (
                <p className="text-xs text-amber-800">
                  Quantité maximale : {ligne.quantiteRetournable}
                </p>
              )}
            </div>
          </div>

          <div className="shrink-0 lg:w-36 lg:pt-1">
            <Label className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
              Qté à retourner
            </Label>
            <Input
              type="number"
              min={1}
              max={ligne.quantiteRetournable}
              value={qty}
              onChange={(e) => onQtyChange(e.target.value)}
              disabled={!selected}
              className="mt-1.5 h-11 rounded-xl border-gray-200 bg-white text-center text-base font-semibold tabular-nums"
            />
            {selected && qtyNum > 0 && (
              <p className="mt-1.5 text-center text-xs font-medium text-[#cd3b86] tabular-nums">
                {formatCurrency(montantLigne)}
              </p>
            )}
          </div>
        </div>
      </div>
    </article>
  )
}

export function NouveauRetourClient({ sorties }: { sorties: SortieOpt[] }) {
  const router = useRouter()
  const [sortieId, setSortieId] = React.useState("")
  const [sortie, setSortie] = React.useState<SortieRetourState | null>(null)
  const [loadingLignes, setLoadingLignes] = React.useState(false)
  const [selected, setSelected] = React.useState<Record<string, boolean>>({})
  const [qtys, setQtys] = React.useState<Record<string, string>>({})
  const [motif, setMotif] = React.useState("")
  const [pending, setPending] = React.useState(false)
  const [confirmOpen, setConfirmOpen] = React.useState(false)

  const sortieOpt = sorties.find((s) => s.id === sortieId)
  const lignes = sortie?.lignes ?? []

  React.useEffect(() => {
    if (!sortieId) {
      setSortie(null)
      setSelected({})
      setQtys({})
      return
    }

    let cancelled = false
    setLoadingLignes(true)
    void getSortiePourRetour(sortieId)
      .then((data) => {
        if (cancelled) return
        if (!data) {
          setSortie(null)
          return
        }
        const rows = (data.lignes ?? []) as LigneRetour[]
        setSortie({
          id: data.id as string,
          numero: data.numero as string,
          patientId: data.patientId as string,
          patientLabel: (data.patientLabel as string | null) ?? null,
          lignes: rows,
        })
        const s: Record<string, boolean> = {}
        const q: Record<string, string> = {}
        for (const l of rows) {
          s[l.id] = true
          q[l.id] = String(l.quantiteRetournable)
        }
        setSelected(s)
        setQtys(q)
      })
      .finally(() => {
        if (!cancelled) setLoadingLignes(false)
      })

    return () => {
      cancelled = true
    }
  }, [sortieId])

  function buildPayload() {
    return lignes
      .filter((l) => selected[l.id])
      .map((l) => ({
        sortieLigneId: l.id,
        quantite: Math.min(
          l.quantiteRetournable,
          Math.max(0, Number(qtys[l.id] || 0)),
        ),
      }))
      .filter((l) => l.quantite > 0)
  }

  const payload = buildPayload()
  const lignesCount = payload.length
  const totalUnites = payload.reduce((s, l) => s + l.quantite, 0)
  const totalAvoir = lignes
    .filter((l) => selected[l.id])
    .reduce((sum, l) => {
      const q = Math.min(
        l.quantiteRetournable,
        Math.max(0, Number(qtys[l.id] || 0)),
      )
      return sum + q * l.montantPatientUnitaire
    }, 0)

  const qtyInvalid = lignes.some(
    (l) =>
      selected[l.id] &&
      (Number(qtys[l.id] || 0) <= 0 ||
        Number(qtys[l.id] || 0) > l.quantiteRetournable),
  )

  const canSubmit = sortieId && lignesCount > 0 && !qtyInvalid && !pending && !loadingLignes

  async function submit() {
    if (!sortieId) return
    const lines = buildPayload()
    if (lines.length === 0) {
      toast.error("Sélectionnez au moins une ligne.")
      return
    }

    setPending(true)
    try {
      const res = await createRetour({
        sortieId,
        motif: motif.trim() || null,
        lignes: lines,
      })
      if (res.ok) {
        toast.success("Retour enregistré — avoir crédité sur le portefeuille")
        router.push("/pharmacie/retours")
      } else toast.error(res.error)
    } finally {
      setPending(false)
      setConfirmOpen(false)
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-28">
      <nav className="flex flex-wrap items-center gap-1.5 text-xs text-gray-400">
        <Link href="/pharmacie/retours" className="hover:text-[#cd3b86] transition-colors">
          Retours
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="font-medium text-gray-600">Nouveau retour</span>
      </nav>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1 min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
            Pharmacie
          </p>
          <h1 className="text-2xl font-extrabold tracking-tight text-gray-800">
            Nouveau retour patient
          </h1>
          <p className="max-w-xl text-sm text-gray-500 leading-relaxed">
            Sélectionnez la sortie d&apos;origine et les produits à recréditer sur le portefeuille
            (même lot).
          </p>
        </div>
        <Button
          asChild
          variant="outline"
          size="sm"
          className="shrink-0 gap-1.5 rounded-xl border-gray-200"
        >
          <Link href="/pharmacie/retours">
            <ArrowLeft className="h-3.5 w-3.5" />
            Retour
          </Link>
        </Button>
      </div>

      <section className={cardSurface}>
        <SectionHeader
          icon={Undo2}
          title="Sortie d'origine"
          description="Choisissez la dispensation concernée et indiquez un motif si besoin."
        />
        <div className="grid gap-4 p-5 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2">
            <Label className="text-xs font-semibold text-gray-500">Sortie pharmacie</Label>
            <Select value={sortieId} onValueChange={setSortieId}>
              <SelectTrigger className="h-11 rounded-xl border-gray-200 bg-gray-50/80">
                <SelectValue placeholder="Choisir une sortie…" />
              </SelectTrigger>
              <SelectContent>
                {sorties.length === 0 ? (
                  <SelectItem value="_empty" disabled>
                    Aucune sortie disponible
                  </SelectItem>
                ) : (
                  sorties.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.numero}
                      {s.encaissementNumero
                        ? ` · reçu ${s.encaissementNumero}`
                        : s.factureNumero
                          ? ` · facture ${s.factureNumero}`
                          : ""}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            {sortieId && (
              <p className="text-xs text-gray-500">
                <Link
                  href={`/pharmacie/sorties/${sortieId}`}
                  className="font-medium text-[#cd3b86] hover:underline"
                >
                  Voir le détail de la sortie
                </Link>
              </p>
            )}
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label className="text-xs font-semibold text-gray-500">Motif (optionnel)</Label>
            <Textarea
              value={motif}
              onChange={(e) => setMotif(e.target.value)}
              placeholder="Ex. produit non utilisé, erreur de dispensation…"
              className="min-h-[88px] rounded-xl border-gray-200 resize-none"
            />
          </div>
        </div>
      </section>

      {sortieId && (
        <div className="grid gap-6 lg:grid-cols-[1fr_320px] xl:grid-cols-[1fr_360px]">
          <section className={cn(cardSurface, "overflow-hidden")}>
            <SectionHeader
              icon={RotateCcw}
              title="Produits retournables"
              description="Même lot que la sortie — le stock sera réintégré."
            />
            <div className="p-5 space-y-4">
              {sortie && (
                <div className="rounded-xl border border-gray-100 bg-gray-50/60 px-4 py-3 text-sm text-gray-600">
                  <span className="font-semibold text-gray-800">{sortie.numero}</span>
                  {" · "}
                  {sortie.patientLabel ?? `Patient #${sortie.patientId}`}
                  {sortieOpt?.encaissementNumero && (
                    <> · Reçu {sortieOpt.encaissementNumero}</>
                  )}
                  {sortieOpt?.factureNumero && <> · Facture {sortieOpt.factureNumero}</>}
                </div>
              )}

              {loadingLignes ? (
                <div className="flex items-center justify-center gap-2 py-16 text-sm text-gray-500">
                  <Loader2 className="h-5 w-5 animate-spin text-[#cd3b86]" />
                  Chargement des lignes…
                </div>
              ) : lignes.length === 0 ? (
                <div className="flex flex-col items-center py-16 text-center text-gray-500">
                  <Package className="h-10 w-10 mb-3 opacity-30" />
                  <p className="font-medium text-gray-600">Aucune quantité retournable</p>
                  <p className="mt-1 text-xs">
                    Tous les produits de cette sortie ont déjà été retournés.
                  </p>
                </div>
              ) : (
                lignes.map((l, i) => (
                  <LigneRetourCard
                    key={l.id}
                    ligne={l}
                    index={i}
                    selected={!!selected[l.id]}
                    qty={qtys[l.id] ?? ""}
                    onToggle={(checked) =>
                      setSelected((s) => ({ ...s, [l.id]: checked }))
                    }
                    onQtyChange={(value) =>
                      setQtys((q) => ({ ...q, [l.id]: value }))
                    }
                  />
                ))
              )}
            </div>
          </section>

          <aside className="lg:sticky lg:top-4 lg:self-start">
            <section className={cardSurface}>
              <SectionHeader
                icon={Wallet}
                title="Avoir portefeuille"
                description="Montant estimé à recréditer au patient."
              />
              <div className="space-y-4 p-5">
                <div className="rounded-xl bg-gradient-to-br from-[#cd3b86]/[0.06] to-transparent px-4 py-4 text-center">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">
                    Avoir estimé
                  </p>
                  <p className="mt-1 text-3xl font-extrabold tabular-nums text-[#cd3b86]">
                    {formatCurrency(totalAvoir)}
                  </p>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Lignes sélectionnées</span>
                    <span className="font-semibold">{lignesCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Unités retournées</span>
                    <span className="font-semibold text-[#cd3b86] tabular-nums">
                      {totalUnites}
                    </span>
                  </div>
                </div>

                <div
                  className={cn(
                    "rounded-xl border px-3.5 py-3 text-sm",
                    qtyInvalid
                      ? "border-amber-200 bg-amber-50/80 text-amber-900"
                      : lignesCount > 0
                        ? "border-emerald-200 bg-emerald-50/80 text-emerald-800"
                        : "border-gray-100 bg-gray-50 text-gray-500",
                  )}
                >
                  {qtyInvalid
                    ? "Vérifiez les quantités saisies."
                    : lignesCount > 0
                      ? "Prêt à enregistrer le retour et créditer l'avoir."
                      : "Sélectionnez au moins un produit."}
                </div>

                {payload.length > 0 && (
                  <ul className="space-y-1.5 text-xs text-gray-600">
                    {payload.map((p) => {
                      const l = lignes.find((x) => x.id === p.sortieLigneId)
                      if (!l) return null
                      return (
                        <li
                          key={p.sortieLigneId}
                          className="rounded-lg border border-gray-100 bg-gray-50/60 px-3 py-2"
                        >
                          <span className="font-medium text-gray-800">{l.produitNom}</span>
                          {" "}
                          <span className="text-[#cd3b86]">×{p.quantite}</span>
                          <span className="text-gray-400"> · lot {l.numeroLot}</span>
                        </li>
                      )
                    })}
                  </ul>
                )}
              </div>
            </section>
          </aside>
        </div>
      )}

      {sortieId && lignes.length > 0 && (
        <DashboardActionBar>
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
            <p className="hidden text-xs text-gray-500 sm:block">
              {sortie?.patientLabel ?? "Patient"} · {lignesCount} ligne
              {lignesCount > 1 ? "s" : ""} · avoir{" "}
              <span className="font-semibold text-[#cd3b86]">
                {formatCurrency(totalAvoir)}
              </span>
            </p>
            <div className="flex w-full items-center justify-end gap-2 sm:w-auto">
              <Button asChild variant="outline" className="rounded-xl">
                <Link href="/pharmacie/retours">Annuler</Link>
              </Button>
              <Button
                className="gap-2 min-w-[200px] rounded-xl bg-gradient-to-r from-[#cd3b86] to-[#b8307a] text-white shadow-sm"
                disabled={!canSubmit}
                onClick={() => setConfirmOpen(true)}
              >
                {pending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Wallet className="h-4 w-4" />
                )}
                Enregistrer le retour
              </Button>
            </div>
          </div>
        </DashboardActionBar>
      )}

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent className="rounded-2xl max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer le retour ?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3 text-sm text-muted-foreground">
                <p>
                  Un avoir de{" "}
                  <strong className="text-foreground">{formatCurrency(totalAvoir)}</strong> sera
                  crédité sur le portefeuille du patient. Le stock sera réintégré sur les lots
                  d&apos;origine.
                </p>
                {motif.trim() && (
                  <p className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 text-xs">
                    <span className="text-gray-400">Motif : </span>
                    {motif.trim()}
                  </p>
                )}
                <ul className="max-h-40 overflow-y-auto space-y-1.5 rounded-xl border border-gray-100 bg-gray-50 p-3 text-xs">
                  {payload.map((p) => {
                    const l = lignes.find((x) => x.id === p.sortieLigneId)
                    return (
                      <li key={p.sortieLigneId}>
                        {l?.produitNom} — {p.quantite} u. (lot {l?.numeroLot})
                      </li>
                    )
                  })}
                </ul>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => void submit()}
              className="rounded-xl bg-gradient-to-r from-[#cd3b86] to-[#b8307a]"
            >
              Confirmer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
