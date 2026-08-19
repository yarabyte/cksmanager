"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
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
import { Card, CardContent } from "@/components/ui/card"
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

  const [detailOpen, setDetailOpen] = React.useState(false)
  const [detailLoading, setDetailLoading] = React.useState(false)
  const [detail, setDetail] = React.useState<RapportCaDetail | null>(null)

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

  const filteredLignes = React.useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return rapport.lignes
    return rapport.lignes.filter((l) => l.label.toLowerCase().includes(q))
  }, [rapport.lignes, searchQuery])

  async function openDetail(cle: string) {
    setDetailOpen(true)
    setDetailLoading(true)
    setDetail(null)
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
    <div className="space-y-5 pb-10">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">Rapports</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            États du chiffre d&apos;affaires facturé (part patient + part assureur).
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
          },
          {
            label: "Part patient",
            value: formatCurrency(rapport.totaux.montantPatient),
            icon: Wallet,
            accent: "text-[#cd3b86]",
          },
          {
            label: "Part assurance",
            value: formatCurrency(rapport.totaux.montantAssurance),
            icon: ShieldCheck,
            accent: "text-emerald-600",
          },
          {
            label: "Factures",
            value: String(rapport.totaux.nbFactures),
            icon: Filter,
            accent: "text-gray-900",
          },
        ].map(({ label, value, icon: Icon, accent }) => (
          <Card key={label} className="border border-gray-100 shadow-sm rounded-2xl bg-white">
            <CardContent className="px-4 py-3">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">
                    {label}
                  </p>
                  <p className={cn("text-xl font-extrabold mt-1 tabular-nums", accent)}>{value}</p>
                </div>
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#cd3b86]/8 text-[#cd3b86]">
                  <Icon className="h-4 w-4" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border border-gray-100 shadow-sm rounded-2xl bg-white">
        <CardContent className="px-4 py-3 space-y-3">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filtrer les lignes affichées…"
                className="pl-9 bg-gray-50 border-gray-200 h-9 text-sm"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Select value={site} onValueChange={(v) => setSite(v as RapportSite)}>
                <SelectTrigger className="h-9 w-[150px] text-xs bg-gray-50 border-gray-200 rounded-lg">
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

              <Select value={vue} onValueChange={(v) => setVue(v as RapportVue)}>
                <SelectTrigger className="h-9 w-[160px] text-xs bg-gray-50 border-gray-200 rounded-lg">
                  <SelectValue placeholder="Voir par" />
                </SelectTrigger>
                <SelectContent>
                  {VUES.map((v) => (
                    <SelectItem key={v.value} value={v.value}>
                      Voir par {v.label.toLowerCase()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={periode}
                onValueChange={(v) => setPeriode(v as RapportPeriode)}
              >
                <SelectTrigger className="h-9 w-[170px] text-xs bg-gray-50 border-gray-200 rounded-lg">
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
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">
                Du
              </span>
              <DatePickerFr
                dateValue={dateDebut}
                onDateChange={setDateDebut}
                placeholder="Début"
                className="h-9 w-[150px] text-xs bg-gray-50 border-gray-200 rounded-lg"
              />
              <span className="text-xs text-gray-400">au</span>
              <DatePickerFr
                dateValue={dateFin}
                onDateChange={setDateFin}
                placeholder="Fin"
                className="h-9 w-[150px] text-xs bg-gray-50 border-gray-200 rounded-lg"
              />
            </div>
          )}

          <p className="text-xs text-gray-500">
            {rapport.periodeLabel}
            {rapport.site !== "all"
              ? ` · Site ${produitSitePharmaLabels[rapport.site]}`
              : " · Tous les sites"}
            {loading ? " · Chargement…" : ""}
          </p>
        </CardContent>
      </Card>

      <RapportCaCharts vue={rapport.vue} lignes={filteredLignes} />

      <Card className="border border-gray-100 shadow-sm rounded-2xl overflow-hidden bg-white">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50/80 hover:bg-gray-50/80">
                <TableHead className="pl-4">{vueLabel(rapport.vue)}</TableHead>
                <TableHead className="text-center">{countLabel(rapport.vue)}</TableHead>
                <TableHead className="text-right">Part patient</TableHead>
                <TableHead className="text-right">Part assurance</TableHead>
                <TableHead className="text-right">Total CA</TableHead>
                <TableHead className="text-right pr-4">%</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-12 text-center text-sm text-gray-500">
                    <Loader2 className="h-4 w-4 animate-spin inline mr-2" />
                    Chargement…
                  </TableCell>
                </TableRow>
              ) : filteredLignes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-12 text-center text-sm text-gray-500">
                    Aucune donnée pour cette période.
                  </TableCell>
                </TableRow>
              ) : (
                filteredLignes.map((l, i) => (
                  <TableRow
                    key={l.id}
                    className={cn(
                      "cursor-pointer hover:bg-[#cd3b86]/5 border-b border-gray-50",
                      i % 2 !== 0 && "bg-gray-50/30",
                    )}
                    onClick={() => void openDetail(l.id)}
                  >
                    <TableCell className="pl-4 font-medium text-sm text-gray-800">
                      {l.label}
                    </TableCell>
                    <TableCell className="text-center tabular-nums text-sm">{l.count}</TableCell>
                    <TableCell className="text-right tabular-nums text-sm text-[#cd3b86]">
                      {formatCurrency(l.montantPatient)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-sm text-emerald-600">
                      {formatCurrency(l.montantAssurance)}
                    </TableCell>
                    <TableCell className="text-right font-semibold tabular-nums text-sm">
                      {formatCurrency(l.total)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-sm text-gray-500 pr-4">
                      {l.partPct.toFixed(1)} %
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        {!loading && rapport.lignes.length > 0 && (
          <div className="flex flex-wrap items-center justify-end gap-4 border-t border-gray-100 bg-gray-50/50 px-4 py-3 text-sm">
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
        )}
      </Card>

      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="rounded-2xl sm:max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Détail — {detail?.label ?? "…"}
            </DialogTitle>
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
                  <p className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-2">
                    Lignes
                  </p>
                  <div className="overflow-x-auto rounded-xl border border-gray-100">
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
                            <TableCell className="text-center tabular-nums text-sm">
                              {l.quantite}
                            </TableCell>
                            <TableCell className="text-right tabular-nums text-sm">
                              {formatCurrency(l.montantPatient)}
                            </TableCell>
                            <TableCell className="text-right tabular-nums text-sm text-emerald-600">
                              {formatCurrency(l.montantAssurance)}
                            </TableCell>
                            <TableCell className="text-right font-medium tabular-nums text-sm">
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
                <p className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-2">
                  Factures ({detail.factures.length})
                </p>
                <div className="overflow-x-auto rounded-xl border border-gray-100">
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
                      {detail.factures.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="py-8 text-center text-sm text-gray-500">
                            Aucune facture
                          </TableCell>
                        </TableRow>
                      ) : (
                        detail.factures.map((f) => (
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
                            <TableCell className="hidden sm:table-cell text-sm text-gray-500">
                              {f.medecinNom ?? "—"}
                            </TableCell>
                            <TableCell className="text-sm text-gray-500">
                              {f.dateFacture ? formatDate(f.dateFacture) : "—"}
                            </TableCell>
                            <TableCell className="text-right font-medium tabular-nums text-sm">
                              {formatCurrency(f.total)}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
