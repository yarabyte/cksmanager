"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  ChevronFirst,
  ChevronLast,
  ChevronLeft,
  ChevronRight,
  Download,
  FileSpreadsheet,
  Filter,
  Loader2,
  Receipt,
  Search,
  ShieldCheck,
  Wallet,
  X,
} from "lucide-react"
import { toast } from "sonner"
import { getRapportCa, getRapportCaDetail } from "@/app/actions/rapports"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DatePickerFr } from "@/components/ui/date-picker-fr"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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
import { formatCurrency, formatDate, formatFactureNumero } from "@/lib/formatting"
import { cn } from "@/lib/utils"
import { RapportCaCharts } from "@/components/rapports/rapport-ca-charts"
import type {
  RapportCaDetail,
  RapportCaResult,
  RapportPeriode,
  RapportSite,
  RapportVue,
} from "@/lib/types/rapport"
import { produitSitePharmaLabels } from "@/lib/validations/pharmacie"

const VUES: { value: RapportVue; label: string }[] = [
  { value: "patient", label: "Patient" },
  { value: "medecin", label: "Médecin" },
  { value: "assureur", label: "Assureur" },
  { value: "categorie", label: "Catégorie" },
  { value: "jour", label: "Jour" },
]

const PERIODES: { value: RapportPeriode; label: string }[] = [
  { value: "today", label: "Aujourd'hui" },
  { value: "yesterday", label: "Hier" },
  { value: "week", label: "7 derniers jours" },
  { value: "month", label: "Mois en cours" },
  { value: "year", label: "Année en cours" },
  { value: "custom", label: "Personnalisé" },
]

const SITES: { value: RapportSite; label: string }[] = [
  { value: "all", label: "Tous les sites" },
  { value: "CKS", label: produitSitePharmaLabels.CKS },
  { value: "PLENITUDE", label: produitSitePharmaLabels.PLENITUDE },
]

const PAGE_SIZE_OPTIONS = [10, 20, 50] as const

function vueLabel(vue: RapportVue): string {
  return VUES.find((v) => v.value === vue)?.label ?? vue
}

function countLabel(vue: RapportVue): string {
  return vue === "categorie" ? "Lignes" : "Factures"
}

function exportCsv(rapport: RapportCaResult) {
  const headers = [
    vueLabel(rapport.vue),
    countLabel(rapport.vue),
    "Part patient",
    "Part assurance",
    "Total CA",
    "%",
  ]
  const rows = rapport.lignes.map((l) => [
    l.label,
    String(l.count),
    String(l.montantPatient),
    String(l.montantAssurance),
    String(l.total),
    String(l.partPct).replace(".", ","),
  ])
  rows.push([
    "TOTAL",
    String(rapport.totaux.nbFactures),
    String(rapport.totaux.montantPatient),
    String(rapport.totaux.montantAssurance),
    String(rapport.totaux.total),
    "100",
  ])

  const escape = (v: string) => `"${v.replace(/"/g, '""')}"`
  const csv =
    "\uFEFF" +
    [headers, ...rows].map((r) => r.map(escape).join(";")).join("\n")

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `rapport-ca-${rapport.vue}-${rapport.site}-${rapport.dateDebut}-${rapport.dateFin}.csv`
  a.click()
  URL.revokeObjectURL(url)
  toast.success("CSV téléchargé")
}

function PaginationBar({
  page,
  totalPages,
  total,
  pageSize,
  rangeFrom,
  rangeTo,
  loading,
  onPageChange,
  onPageSizeChange,
  noun = "lignes",
}: {
  page: number
  totalPages: number
  total: number
  pageSize: number
  rangeFrom: number
  rangeTo: number
  loading?: boolean
  onPageChange: (page: number) => void
  onPageSizeChange: (size: number) => void
  noun?: string
}) {
  if (total <= 0) return null

  return (
    <div className="flex flex-col gap-3 border-t border-gray-100 bg-gray-50/60 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
        <span>
          <span className="font-semibold text-gray-700">
            {rangeFrom}–{rangeTo}
          </span>{" "}
          sur {total} {noun}
        </span>
        <Select
          value={String(pageSize)}
          onValueChange={(v) => onPageSizeChange(Number(v))}
        >
          <SelectTrigger className="h-8 w-[110px] rounded-lg border-gray-200 bg-white text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PAGE_SIZE_OPTIONS.map((n) => (
              <SelectItem key={n} value={String(n)}>
                {n} / page
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 rounded-lg"
          disabled={loading || page <= 1}
          onClick={() => onPageChange(1)}
          aria-label="Première page"
        >
          <ChevronFirst className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-1 rounded-lg px-3 text-xs"
          disabled={loading || page <= 1}
          onClick={() => onPageChange(Math.max(1, page - 1))}
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Précédent</span>
        </Button>

        <div className="hidden items-center gap-1 sm:flex">
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            const start = Math.max(1, Math.min(page - 2, totalPages - 4))
            const p = start + i
            if (p > totalPages) return null
            return (
              <Button
                key={p}
                variant={p === page ? "default" : "outline"}
                size="icon"
                className={cn(
                  "h-8 w-8 rounded-lg text-xs",
                  p === page && "border-0 bg-[#cd3b86] text-white hover:bg-[#b8307a]",
                )}
                onClick={() => onPageChange(p)}
              >
                {p}
              </Button>
            )
          })}
        </div>
        <span className="px-2 text-xs text-gray-500 sm:hidden">
          {page}/{totalPages}
        </span>

        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-1 rounded-lg px-3 text-xs"
          disabled={loading || page >= totalPages}
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
        >
          <span className="hidden sm:inline">Suivant</span>
          <ChevronRight className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 rounded-lg"
          disabled={loading || page >= totalPages}
          onClick={() => onPageChange(totalPages)}
          aria-label="Dernière page"
        >
          <ChevronLast className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  )
}

export function RapportsClient({ initial }: { initial: RapportCaResult }) {
  const router = useRouter()
  const [rapport, setRapport] = React.useState(initial)
  const [vue, setVue] = React.useState<RapportVue>(initial.vue)
  const [site, setSite] = React.useState<RapportSite>(initial.site ?? "all")
  const [periode, setPeriode] = React.useState<RapportPeriode>("month")
  const [dateDebut, setDateDebut] = React.useState(initial.dateDebut)
  const [dateFin, setDateFin] = React.useState(initial.dateFin)
  const [searchQuery, setSearchQuery] = React.useState("")
  const [loading, setLoading] = React.useState(false)
  const [page, setPage] = React.useState(1)
  const [pageSize, setPageSize] = React.useState(20)

  const [detailOpen, setDetailOpen] = React.useState(false)
  const [detailLoading, setDetailLoading] = React.useState(false)
  const [detail, setDetail] = React.useState<RapportCaDetail | null>(null)
  const [detailPage, setDetailPage] = React.useState(1)
  const [detailPageSize, setDetailPageSize] = React.useState(10)

  const filters = React.useMemo(
    () => ({
      vue,
      site,
      periode,
      dateDebut: periode === "custom" ? dateDebut : null,
      dateFin: periode === "custom" ? dateFin : null,
    }),
    [vue, site, periode, dateDebut, dateFin],
  )

  async function reload(next = filters) {
    if (next.periode === "custom" && (!next.dateDebut || !next.dateFin)) {
      toast.error("Indiquez une date de début et de fin.")
      return
    }
    setLoading(true)
    try {
      const data = await getRapportCa(next)
      setRapport(data)
      setDateDebut(data.dateDebut)
      setDateFin(data.dateFin)
      setPage(1)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur de chargement")
    } finally {
      setLoading(false)
    }
  }

  React.useEffect(() => {
    void reload(filters)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vue, site, periode])

  React.useEffect(() => {
    if (periode !== "custom") return
    if (!dateDebut || !dateFin) return
    void reload(filters)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateDebut, dateFin])

  React.useEffect(() => {
    setPage(1)
  }, [searchQuery])

  const filteredLignes = React.useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return rapport.lignes
    return rapport.lignes.filter((l) => l.label.toLowerCase().includes(q))
  }, [rapport.lignes, searchQuery])

  const total = filteredLignes.length
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const safePage = Math.min(page, totalPages)
  const rangeFrom = total === 0 ? 0 : (safePage - 1) * pageSize + 1
  const rangeTo = Math.min(safePage * pageSize, total)
  const pagedLignes = React.useMemo(
    () => filteredLignes.slice((safePage - 1) * pageSize, safePage * pageSize),
    [filteredLignes, safePage, pageSize],
  )

  const detailFactures = detail?.factures ?? []
  const detailTotal = detailFactures.length
  const detailTotalPages = Math.max(1, Math.ceil(detailTotal / detailPageSize))
  const detailSafePage = Math.min(detailPage, detailTotalPages)
  const detailFrom = detailTotal === 0 ? 0 : (detailSafePage - 1) * detailPageSize + 1
  const detailTo = Math.min(detailSafePage * detailPageSize, detailTotal)
  const pagedDetailFactures = React.useMemo(
    () =>
      detailFactures.slice(
        (detailSafePage - 1) * detailPageSize,
        detailSafePage * detailPageSize,
      ),
    [detailFactures, detailSafePage, detailPageSize],
  )

  async function openDetail(cle: string) {
    setDetailOpen(true)
    setDetailLoading(true)
    setDetail(null)
    setDetailPage(1)
    try {
      const data = await getRapportCaDetail({ ...filters, cle })
      setDetail(data)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur de détail")
      setDetailOpen(false)
    } finally {
      setDetailLoading(false)
    }
  }

  function handlePdf() {
    const params = new URLSearchParams({
      vue,
      site,
      periode,
      ...(periode === "custom" && dateDebut ? { dateDebut } : {}),
      ...(periode === "custom" && dateFin ? { dateFin } : {}),
    })
    router.push(`/rapports/imprimer?${params.toString()}`)
  }

  return (
    <div className="mx-auto max-w-7xl space-y-5 pb-10">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Rapports</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Chiffre d&apos;affaires facturé — part patient et part assureur.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 rounded-lg"
            onClick={() => exportCsv(rapport)}
            disabled={loading || rapport.lignes.length === 0}
          >
            <FileSpreadsheet className="h-4 w-4" />
            CSV
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 rounded-lg"
            onClick={handlePdf}
            disabled={loading || rapport.lignes.length === 0}
          >
            <Download className="h-4 w-4" />
            PDF
          </Button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          {
            label: "CA total",
            value: formatCurrency(rapport.totaux.total),
            icon: Receipt,
            accent: "text-gray-900",
            tint: "bg-gray-100 text-gray-700",
          },
          {
            label: "Part patient",
            value: formatCurrency(rapport.totaux.montantPatient),
            icon: Wallet,
            accent: "text-[#cd3b86]",
            tint: "bg-[#cd3b86]/10 text-[#cd3b86]",
          },
          {
            label: "Part assurance",
            value: formatCurrency(rapport.totaux.montantAssurance),
            icon: ShieldCheck,
            accent: "text-emerald-600",
            tint: "bg-emerald-50 text-emerald-600",
          },
          {
            label: "Factures",
            value: String(rapport.totaux.nbFactures),
            icon: Filter,
            accent: "text-gray-900",
            tint: "bg-sky-50 text-sky-600",
          },
        ].map(({ label, value, icon: Icon, accent, tint }) => (
          <Card key={label} className="rounded-2xl border border-gray-100 bg-white shadow-sm">
            <CardContent className="px-4 py-3.5">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                    {label}
                  </p>
                  <p className={cn("mt-1 truncate text-xl font-bold tabular-nums", accent)}>
                    {value}
                  </p>
                </div>
                <div
                  className={cn(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
                    tint,
                  )}
                >
                  <Icon className="h-4 w-4" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="rounded-2xl border border-gray-100 bg-white shadow-sm">
        <CardContent className="space-y-4 px-4 py-4">
          <div className="flex flex-col gap-1">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
              Vue
            </p>
            <div className="grid grid-cols-2 gap-1 rounded-xl bg-muted/70 p-1 sm:grid-cols-5">
              {VUES.map((v) => (
                <button
                  key={v.value}
                  type="button"
                  onClick={() => setVue(v.value)}
                  className={cn(
                    "rounded-lg px-2 py-2 text-xs font-medium transition-colors sm:text-sm",
                    vue === v.value
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {v.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={`Rechercher un ${vueLabel(vue).toLowerCase()}…`}
                className="h-9 border-gray-200 bg-gray-50 pl-9 text-sm"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  aria-label="Effacer la recherche"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Select value={site} onValueChange={(v) => setSite(v as RapportSite)}>
                <SelectTrigger className="h-9 w-[150px] rounded-lg border-gray-200 bg-gray-50 text-xs">
                  <SelectValue placeholder="Site" />
                </SelectTrigger>
                <SelectContent>
                  {SITES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={periode}
                onValueChange={(v) => setPeriode(v as RapportPeriode)}
              >
                <SelectTrigger className="h-9 w-[170px] rounded-lg border-gray-200 bg-gray-50 text-xs">
                  <SelectValue placeholder="Période" />
                </SelectTrigger>
                <SelectContent>
                  {PERIODES.map((p) => (
                    <SelectItem key={p.value} value={p.value}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {periode === "custom" && (
            <div className="flex flex-wrap items-center gap-2 rounded-xl border border-dashed border-gray-200 bg-muted/20 px-3 py-2.5">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                Du
              </span>
              <DatePickerFr
                dateValue={dateDebut}
                onDateChange={setDateDebut}
                placeholder="Début"
                className="h-9 w-[150px] rounded-lg border-gray-200 bg-white text-xs"
              />
              <span className="text-xs text-gray-400">au</span>
              <DatePickerFr
                dateValue={dateFin}
                onDateChange={setDateFin}
                placeholder="Fin"
                className="h-9 w-[150px] rounded-lg border-gray-200 bg-white text-xs"
              />
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
            <span className="inline-flex items-center rounded-full bg-[#cd3b86]/10 px-2.5 py-1 font-medium text-[#cd3b86]">
              {rapport.periodeLabel}
            </span>
            <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-1 font-medium text-gray-600">
              {rapport.site !== "all"
                ? produitSitePharmaLabels[rapport.site]
                : "Tous les sites"}
            </span>
            {loading && (
              <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Actualisation…
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      <RapportCaCharts vue={rapport.vue} lignes={filteredLignes} />

      <Card className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between gap-3 border-b border-gray-100 px-4 py-3">
          <div>
            <CardTitle className="text-base">Détail par {vueLabel(rapport.vue).toLowerCase()}</CardTitle>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Cliquez une ligne pour voir les factures associées
            </p>
          </div>
          <span className="rounded-md bg-muted px-2 py-1 text-xs font-semibold tabular-nums text-muted-foreground">
            {total}
          </span>
        </CardHeader>

        <div className="relative overflow-x-auto">
          {loading && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/60 backdrop-blur-[1px]">
              <Loader2 className="h-5 w-5 animate-spin text-[#cd3b86]" />
            </div>
          )}
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50/80 hover:bg-gray-50/80">
                <TableHead className="pl-4">{vueLabel(rapport.vue)}</TableHead>
                <TableHead className="text-center">{countLabel(rapport.vue)}</TableHead>
                <TableHead className="text-right">Part patient</TableHead>
                <TableHead className="text-right">Part assurance</TableHead>
                <TableHead className="text-right">Total CA</TableHead>
                <TableHead className="pr-4 text-right">%</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pagedLignes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-14 text-center">
                    <div className="mx-auto flex max-w-sm flex-col items-center gap-2">
                      <Receipt className="h-8 w-8 text-muted-foreground/40" />
                      <p className="text-sm font-medium text-muted-foreground">
                        Aucune donnée pour cette période
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Modifiez la vue, le site ou la période pour afficher des résultats.
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                pagedLignes.map((l, i) => (
                  <TableRow
                    key={l.id}
                    className={cn(
                      "cursor-pointer border-b border-gray-50 transition-colors hover:bg-[#cd3b86]/5",
                      i % 2 !== 0 && "bg-gray-50/30",
                    )}
                    onClick={() => void openDetail(l.id)}
                  >
                    <TableCell className="pl-4 text-sm font-medium text-gray-800">
                      <span className="inline-flex items-center gap-2">
                        {l.label}
                        <ChevronRight className="h-3.5 w-3.5 shrink-0 text-gray-300" />
                      </span>
                    </TableCell>
                    <TableCell className="text-center text-sm tabular-nums">{l.count}</TableCell>
                    <TableCell className="text-right text-sm tabular-nums text-[#cd3b86]">
                      {formatCurrency(l.montantPatient)}
                    </TableCell>
                    <TableCell className="text-right text-sm tabular-nums text-emerald-600">
                      {formatCurrency(l.montantAssurance)}
                    </TableCell>
                    <TableCell className="text-right text-sm font-semibold tabular-nums">
                      {formatCurrency(l.total)}
                    </TableCell>
                    <TableCell className="pr-4 text-right text-sm tabular-nums text-gray-500">
                      {l.partPct.toFixed(1)} %
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {!loading && total > 0 && (
          <>
            <div className="flex flex-wrap items-center justify-end gap-4 border-t border-gray-100 bg-white px-4 py-2.5 text-sm">
              <span className="text-gray-500">
                Patient :{" "}
                <strong className="text-[#cd3b86]">
                  {formatCurrency(rapport.totaux.montantPatient)}
                </strong>
              </span>
              <span className="text-gray-500">
                Assurance :{" "}
                <strong className="text-emerald-700">
                  {formatCurrency(rapport.totaux.montantAssurance)}
                </strong>
              </span>
              <span className="font-bold text-gray-900">
                Total : {formatCurrency(rapport.totaux.total)}
              </span>
            </div>
            <PaginationBar
              page={safePage}
              totalPages={totalPages}
              total={total}
              pageSize={pageSize}
              rangeFrom={rangeFrom}
              rangeTo={rangeTo}
              loading={loading}
              onPageChange={setPage}
              onPageSizeChange={(size) => {
                setPageSize(size)
                setPage(1)
              }}
            />
          </>
        )}
      </Card>

      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto rounded-2xl sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Détail — {detail?.label ?? "…"}</DialogTitle>
          </DialogHeader>
          {detailLoading || !detail ? (
            <div className="flex items-center justify-center gap-2 py-12 text-sm text-gray-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              Chargement…
            </div>
          ) : (
            <div className="space-y-4">
              {detail.lignes.length > 0 && (
                <div>
                  <p className="mb-2 text-xs font-bold uppercase tracking-wide text-gray-400">
                    Lignes ({detail.lignes.length})
                  </p>
                  <div className="max-h-56 overflow-auto rounded-xl border border-gray-100">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-gray-50/80">
                          <TableHead>Désignation</TableHead>
                          <TableHead>Facture</TableHead>
                          <TableHead className="text-center">Qté</TableHead>
                          <TableHead className="text-right">Patient</TableHead>
                          <TableHead className="text-right">Assurance</TableHead>
                          <TableHead className="text-right">Total</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {detail.lignes.map((l) => (
                          <TableRow key={l.id}>
                            <TableCell className="text-sm font-medium">{l.designation}</TableCell>
                            <TableCell>
                              <Link
                                href={`/facturation/${l.factureId}`}
                                className="text-sm text-[#cd3b86] hover:underline"
                              >
                                {formatFactureNumero(l.factureNumero)}
                              </Link>
                            </TableCell>
                            <TableCell className="text-center text-sm tabular-nums">
                              {l.quantite}
                            </TableCell>
                            <TableCell className="text-right text-sm tabular-nums">
                              {formatCurrency(l.montantPatient)}
                            </TableCell>
                            <TableCell className="text-right text-sm tabular-nums text-emerald-600">
                              {formatCurrency(l.montantAssurance)}
                            </TableCell>
                            <TableCell className="text-right text-sm font-medium tabular-nums">
                              {formatCurrency(l.total)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}

              <div>
                <p className="mb-2 text-xs font-bold uppercase tracking-wide text-gray-400">
                  Factures ({detail.factures.length})
                </p>
                <div className="overflow-hidden rounded-xl border border-gray-100">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-gray-50/80">
                          <TableHead>N°</TableHead>
                          <TableHead>Patient</TableHead>
                          <TableHead className="hidden sm:table-cell">Médecin</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead className="text-right">Total</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {pagedDetailFactures.length === 0 ? (
                          <TableRow>
                            <TableCell
                              colSpan={5}
                              className="py-8 text-center text-sm text-gray-500"
                            >
                              Aucune facture
                            </TableCell>
                          </TableRow>
                        ) : (
                          pagedDetailFactures.map((f) => (
                            <TableRow key={f.id}>
                              <TableCell>
                                <Link
                                  href={`/facturation/${f.id}`}
                                  className="text-sm font-medium text-[#cd3b86] hover:underline"
                                >
                                  {formatFactureNumero(f.numero)}
                                </Link>
                              </TableCell>
                              <TableCell className="text-sm">
                                {f.patientLabel ?? "—"}
                              </TableCell>
                              <TableCell className="hidden text-sm text-gray-500 sm:table-cell">
                                {f.medecinNom ?? "—"}
                              </TableCell>
                              <TableCell className="text-sm text-gray-500">
                                {f.dateFacture ? formatDate(f.dateFacture) : "—"}
                              </TableCell>
                              <TableCell className="text-right text-sm font-medium tabular-nums">
                                {formatCurrency(f.total)}
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                  <PaginationBar
                    page={detailSafePage}
                    totalPages={detailTotalPages}
                    total={detailTotal}
                    pageSize={detailPageSize}
                    rangeFrom={detailFrom}
                    rangeTo={detailTo}
                    onPageChange={setDetailPage}
                    onPageSizeChange={(size) => {
                      setDetailPageSize(size)
                      setDetailPage(1)
                    }}
                    noun="factures"
                  />
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
