"use client"

import * as React from "react"
import Link from "next/link"
import {
  ArrowLeft,
  Clock,
  Loader2,
  Package,
  Pill,
  Printer,
  Search,
  User,
} from "lucide-react"
import {
  listMedicamentsSortis,
  type MedicamentSortiPeriod,
  type MedicamentSortiRow,
} from "@/app/actions/pharmacie-sortie"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { formatDate, formatDateTime } from "@/lib/formatting"
import { cn } from "@/lib/utils"

const PERIODS: { value: MedicamentSortiPeriod; label: string }[] = [
  { value: "today", label: "Aujourd'hui" },
  { value: "yesterday", label: "Hier" },
  { value: "week", label: "7 derniers jours" },
  { value: "month", label: "30 derniers jours" },
  { value: "all", label: "Tout" },
]

type InitialData = Awaited<ReturnType<typeof listMedicamentsSortis>>

export function MedicamentsSortisClient({ initial }: { initial: InitialData }) {
  const [period, setPeriod] = React.useState<MedicamentSortiPeriod>(initial.period)
  const [pharmacieId, setPharmacieId] = React.useState("all")
  const [search, setSearch] = React.useState("")
  const [searchDebounced, setSearchDebounced] = React.useState("")
  const [rows, setRows] = React.useState<MedicamentSortiRow[]>(initial.rows)
  const [totalQuantite, setTotalQuantite] = React.useState(initial.totalQuantite)
  const [loading, setLoading] = React.useState(false)
  const pharmacies = initial.pharmacies
  const showPharmacieFilter = pharmacies.length > 1

  React.useEffect(() => {
    const t = window.setTimeout(() => setSearchDebounced(search.trim()), 300)
    return () => window.clearTimeout(t)
  }, [search])

  React.useEffect(() => {
    let cancelled = false
    setLoading(true)
    void listMedicamentsSortis({
      period,
      pharmacieId: pharmacieId === "all" ? undefined : pharmacieId,
      q: searchDebounced || undefined,
    })
      .then((res) => {
        if (cancelled) return
        setRows(res.rows)
        setTotalQuantite(res.totalQuantite)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [period, pharmacieId, searchDebounced])

  const uniqueSorties = React.useMemo(
    () => new Set(rows.map((r) => r.sortieId)).size,
    [rows],
  )

  const printHref = React.useMemo(() => {
    const params = new URLSearchParams()
    params.set("period", period)
    if (pharmacieId !== "all") params.set("pharmacieId", pharmacieId)
    if (searchDebounced) params.set("q", searchDebounced)
    return `/pharmacie/sorties/medicaments-sortis/imprimer?${params.toString()}`
  }, [period, pharmacieId, searchDebounced])

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="-ml-2 mb-1 h-8 rounded-lg text-muted-foreground"
          >
            <Link href="/pharmacie/sorties">
              <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
              Retour aux sorties
            </Link>
          </Button>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Médicaments déjà sortis
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Historique des lignes dispensées — filtrez par période
          </p>
        </div>
        <Button
          asChild
          variant="outline"
          className={cn(
            "gap-1.5 rounded-lg",
            (loading || rows.length === 0) && "pointer-events-none opacity-50",
          )}
        >
          <Link
            href={printHref}
            aria-disabled={loading || rows.length === 0}
            tabIndex={loading || rows.length === 0 ? -1 : undefined}
          >
            <Printer className="h-4 w-4" />
            Imprimer PDF
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-3">
        {[
          { label: "Lignes", value: rows.length, icon: Pill },
          { label: "Quantité totale", value: totalQuantite, icon: Package },
          { label: "Sorties", value: uniqueSorties, icon: Clock },
        ].map(({ label, value, icon: Icon }) => (
          <div
            key={label}
            className="flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-white px-4 py-3"
          >
            <div className="min-w-0">
              <p className="text-sm text-muted-foreground">{label}</p>
              <p className="mt-0.5 text-xl font-semibold tabular-nums text-foreground">
                {value}
              </p>
            </div>
            <Icon className="h-4 w-4 shrink-0 text-muted-foreground/50" />
          </div>
        ))}
      </div>

      <div className="space-y-3 rounded-xl border border-border/60 bg-white p-4 sm:p-5">
        <div className="flex flex-wrap gap-1.5">
          {PERIODS.map(({ value, label }) => {
            const active = period === value
            return (
              <button
                key={value}
                type="button"
                onClick={() => setPeriod(value)}
                className={cn(
                  "rounded-md px-2.5 py-1 text-sm transition-colors",
                  active
                    ? "bg-[#cd3b86]/[0.08] text-[#cd3b86]"
                    : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                )}
              >
                {label}
              </button>
            )
          })}
        </div>

        <div className="flex flex-col gap-3 border-t border-border/50 pt-3 lg:flex-row lg:items-end lg:justify-between">
          {showPharmacieFilter ? (
            <div className="space-y-1.5">
              <p className="text-sm text-muted-foreground">Pharmacie</p>
              <Select value={pharmacieId} onValueChange={setPharmacieId}>
                <SelectTrigger className="h-9 w-full rounded-lg border-border/80 sm:w-[280px]">
                  <SelectValue placeholder="Choisir une pharmacie" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les pharmacies</SelectItem>
                  {pharmacies.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.nom} · {p.magasinNom}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <div className="space-y-1.5">
              <p className="text-sm text-muted-foreground">Pharmacie</p>
              <p className="text-sm text-foreground">
                {pharmacies[0]?.nom ?? "—"}
                {pharmacies[0] && (
                  <span className="text-muted-foreground">
                    {" "}
                    · {pharmacies[0].magasinNom}
                  </span>
                )}
              </p>
            </div>
          )}

          <div className="relative w-full lg:max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/70" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Médicament, patient, lot, n° sortie…"
              className="h-9 rounded-lg border-border/80 pl-9"
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin text-[#cd3b86]" />
          Chargement…
        </div>
      ) : rows.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border/70 py-16 text-center">
          <Pill className="mx-auto mb-3 h-8 w-8 text-muted-foreground/40" />
          <p className="text-sm font-medium text-foreground">Aucun médicament sorti</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Aucune dispensation pour cette période.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border/60 bg-white">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30 hover:bg-muted/30">
                <TableHead className="h-10 pl-4 text-xs font-medium">Médicament</TableHead>
                <TableHead className="h-10 text-center text-xs font-medium">Qté</TableHead>
                <TableHead className="hidden h-10 text-xs font-medium md:table-cell">
                  Patient
                </TableHead>
                <TableHead className="hidden h-10 text-xs font-medium lg:table-cell">
                  Lot
                </TableHead>
                <TableHead className="h-10 text-xs font-medium">Sortie</TableHead>
                <TableHead className="hidden h-10 text-xs font-medium sm:table-cell">
                  Date
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.ligneId} className="border-border/40">
                  <TableCell className="pl-4">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground">{r.produitNom}</p>
                      {r.produitDosage && (
                        <p className="text-xs text-muted-foreground">{r.produitDosage}</p>
                      )}
                      <p className="mt-0.5 text-xs text-muted-foreground md:hidden">
                        {r.patientLabel ?? `Patient #${r.patientId}`}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge
                      variant="secondary"
                      className="rounded-md bg-emerald-50 text-emerald-700 border-0 tabular-nums"
                    >
                      {r.quantiteServie}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                      <User className="h-3.5 w-3.5 opacity-60 shrink-0" />
                      <span className="truncate max-w-[180px]">
                        {r.patientLabel ?? `Patient #${r.patientId}`}
                      </span>
                    </span>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                    <span className="font-mono text-xs">{r.numeroLot}</span>
                    <span className="block text-[11px] text-muted-foreground/80">
                      Pérem. {formatDate(r.datePeremption)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/pharmacie/sorties/${r.sortieId}`}
                      className="text-sm font-medium text-[#cd3b86] hover:underline"
                    >
                      {r.sortieNumero}
                    </Link>
                    <p className="text-[11px] text-muted-foreground">{r.pharmacieNom}</p>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell text-sm text-muted-foreground tabular-nums">
                    {r.createdAt ? formatDateTime(r.createdAt) : "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
