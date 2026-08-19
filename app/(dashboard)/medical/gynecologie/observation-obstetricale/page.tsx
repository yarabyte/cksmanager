"use client"

import * as React from "react"
import Link from "next/link"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
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
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { DatePickerFr } from "@/components/ui/date-picker-fr"
import {
  Baby,
  Loader2,
  Search,
  ChevronRight,
  ChevronLeft,
  ChevronFirst,
  ChevronLast,
  CheckCircle2,
  CircleDashed,
  Eye,
  CalendarRange,
  X,
} from "lucide-react"
import { useVisitesEligiblesObsObstetricale } from "@/hooks/use-observation-obstetricale"
import { cn } from "@/lib/utils"

const cardSurface =
  "rounded-2xl border border-gray-100 bg-white shadow-[0_2px_12px_rgba(0,0,0,0.06)]"

const PAGE_SIZE = 20
const BASE = "/medical/gynecologie/observation-obstetricale"

export default function ObservationObstetricaleListPage() {
  const [searchQuery, setSearchQuery] = React.useState("")
  const [debouncedQ, setDebouncedQ] = React.useState("")
  const [onlyMissing, setOnlyMissing] = React.useState(true)
  const [periode, setPeriode] = React.useState("today")
  const [customDateFrom, setCustomDateFrom] = React.useState("")
  const [customDateTo, setCustomDateTo] = React.useState("")
  const [dateFilter, setDateFilter] = React.useState<{
    periode: string
    dateFrom?: string
    dateTo?: string
  }>({ periode: "today" })
  const [page, setPage] = React.useState(1)

  React.useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(searchQuery.trim()), 300)
    return () => clearTimeout(t)
  }, [searchQuery])

  // Recherche patiente : élargir période + afficher aussi les fiches déjà saisies
  React.useEffect(() => {
    if (!debouncedQ) return
    setOnlyMissing(false)
    setPeriode("all")
    setCustomDateFrom("")
    setCustomDateTo("")
    setDateFilter({ periode: "all" })
  }, [debouncedQ])

  React.useEffect(() => {
    setPage(1)
  }, [debouncedQ, onlyMissing, dateFilter])

  const { data, isLoading, error } = useVisitesEligiblesObsObstetricale({
    q: debouncedQ || undefined,
    onlyMissing: onlyMissing || undefined,
    page,
    pageSize: PAGE_SIZE,
    ...(dateFilter.periode !== "all"
      ? {
          periode: dateFilter.periode,
          dateFrom: dateFilter.dateFrom,
          dateTo: dateFilter.dateTo,
        }
      : {}),
  })

  function handlePeriodeChange(value: string) {
    setPeriode(value)
    if (value !== "custom") {
      setDateFilter({ periode: value })
      setCustomDateFrom("")
      setCustomDateTo("")
    }
  }

  function handleCustomApply() {
    if (!customDateFrom) return
    setDateFilter({
      periode: "custom",
      dateFrom: customDateFrom,
      dateTo: customDateTo || undefined,
    })
  }

  function resetPeriode() {
    setPeriode("today")
    setCustomDateFrom("")
    setCustomDateTo("")
    setDateFilter({ periode: "today" })
  }

  const items = data?.items ?? []
  const total = data?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const rangeFrom = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1
  const rangeTo = Math.min(page * PAGE_SIZE, total)

  React.useEffect(() => {
    if (page > totalPages) setPage(totalPages)
  }, [page, totalPages])

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-[11px] font-bold text-[#cd3b86] uppercase tracking-widest">
            Médical · Gynécologie
          </p>
          <h1 className="text-2xl font-bold text-gray-900 font-['DM_Sans',sans-serif] flex items-center gap-2">
            <Baby className="h-7 w-7 text-gray-700" />
            Observation obstétricale
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Patientes : fiches déjà saisies, ou visites dont la part patient est
            soldée.
          </p>
        </div>
      </div>

      <div className={cn(cardSurface, "p-4 space-y-3")}>
        <div className="flex flex-col lg:flex-row gap-3 lg:items-center">
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              className="pl-9 rounded-xl bg-gray-50 border-gray-200"
              placeholder="Patiente, motif, n° visite…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Select value={periode} onValueChange={handlePeriodeChange}>
            <SelectTrigger className="h-10 w-full sm:w-[170px] text-xs rounded-xl bg-gray-50 border-gray-200">
              <SelectValue placeholder="Période" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Aujourd&apos;hui</SelectItem>
              <SelectItem value="yesterday">Hier</SelectItem>
              <SelectItem value="week">Cette semaine</SelectItem>
              <SelectItem value="month">Ce mois</SelectItem>
              <SelectItem value="custom">Personnalisé</SelectItem>
              <SelectItem value="all">Toutes les dates</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex items-center gap-2 shrink-0">
            <Switch
              id="only-missing-obs-gyneco"
              checked={onlyMissing}
              onCheckedChange={setOnlyMissing}
            />
            <Label
              htmlFor="only-missing-obs-gyneco"
              className="text-sm text-gray-600 cursor-pointer"
            >
              À saisir uniquement
            </Label>
          </div>
          {periode !== "today" && (
            <Button
              variant="ghost"
              size="sm"
              className="h-9 gap-1 text-xs text-gray-500"
              onClick={resetPeriode}
            >
              <X className="h-3.5 w-3.5" />
              Reset période
            </Button>
          )}
        </div>

        {periode === "custom" && (
          <div className="flex flex-wrap items-end gap-2 rounded-xl border border-gray-100 bg-gray-50/60 p-3">
            <CalendarRange className="h-4 w-4 text-gray-400 mb-2.5" />
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-gray-500">Du</label>
              <DatePickerFr
                dateValue={customDateFrom}
                onDateChange={setCustomDateFrom}
                placeholder="Date de début"
                clearable={false}
                className="h-9 w-[180px] text-xs"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-gray-500">Au</label>
              <DatePickerFr
                dateValue={customDateTo}
                onDateChange={setCustomDateTo}
                placeholder="Date de fin"
                clearable={false}
                min={customDateFrom || undefined}
                className="h-9 w-[180px] text-xs"
              />
            </div>
            <Button
              size="sm"
              className="h-9 bg-[#cd3b86] hover:bg-[#b8307a] text-white"
              disabled={!customDateFrom}
              onClick={handleCustomApply}
            >
              Appliquer
            </Button>
          </div>
        )}
      </div>

      {error && (
        <div
          className={cn(
            cardSurface,
            "px-4 py-3 text-sm text-red-700 bg-red-50/80",
          )}
        >
          {error instanceof Error ? error.message : "Erreur de chargement"}
        </div>
      )}

      <div className={cn(cardSurface, "overflow-hidden")}>
        {isLoading ? (
          <div className="flex items-center justify-center py-20 text-gray-500 gap-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            Chargement…
          </div>
        ) : items.length === 0 ? (
          <Empty className="py-16">
            <EmptyHeader>
              <EmptyTitle>Aucune visite éligible</EmptyTitle>
              <EmptyDescription>
                Aucune fiche trouvée. Les observations obstétricales importées ou les visites
                soldées de patientes apparaissent ici.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50/80 hover:bg-gray-50/80">
                <TableHead>Patiente</TableHead>
                <TableHead className="hidden md:table-cell">Date</TableHead>
                <TableHead className="hidden lg:table-cell">Motif</TableHead>
                <TableHead className="hidden xl:table-cell">Médecin</TableHead>
                <TableHead className="w-36">Statut</TableHead>
                <TableHead className="w-28 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((r, i) => (
                <TableRow
                  key={r.id}
                  className={cn(i % 2 === 1 && "bg-gray-50/40")}
                >
                  <TableCell>
                    <Link
                      href={
                        r.observationRemplie
                          ? `${BASE}/${r.id}/voir`
                          : `${BASE}/${r.id}`
                      }
                      className="font-semibold text-gray-900 hover:text-[#cd3b86] transition-colors"
                    >
                      {r.patientLabel ?? `Patient #${r.patientId}`}
                    </Link>
                    {r.patientAge != null && (
                      <p className="text-xs text-gray-500 mt-0.5">
                        {r.patientAge} an{r.patientAge > 1 ? "s" : ""}
                      </p>
                    )}
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-sm text-gray-600">
                    {format(new Date(r.dateVisite), "dd MMM yyyy · HH:mm", {
                      locale: fr,
                    })}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-sm text-gray-600">
                    {r.motifLibelle}
                  </TableCell>
                  <TableCell className="hidden xl:table-cell text-sm text-gray-600">
                    {r.medecinNom}
                  </TableCell>
                  <TableCell>
                    {r.observationRemplie ? (
                      <Badge className="gap-1 rounded-full border-0 bg-[#58a639]/10 text-[#58a639] hover:bg-[#58a639]/10">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Saisie
                      </Badge>
                    ) : (
                      <Badge
                        variant="secondary"
                        className="gap-1 rounded-full border-0 bg-amber-50 text-amber-700"
                      >
                        <CircleDashed className="h-3.5 w-3.5" />
                        À saisir
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="inline-flex items-center gap-1">
                      {r.observationRemplie && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 rounded-lg gap-1.5 text-xs"
                          asChild
                        >
                          <Link href={`${BASE}/${r.id}/voir`}>
                            <Eye className="h-3.5 w-3.5" />
                            Fiche
                          </Link>
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-lg"
                        asChild
                      >
                        <Link
                          href={`${BASE}/${r.id}`}
                          aria-label={
                            r.observationRemplie ? "Modifier" : "Saisir"
                          }
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {total > 0 && (
        <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
          <p className="text-xs text-gray-400 order-2 sm:order-1">
            {rangeFrom}–{rangeTo} sur{" "}
            <span className="font-semibold text-gray-600">{total}</span>
            {" · "}
            Page <span className="font-semibold text-gray-600">{page}</span> sur{" "}
            {totalPages}
          </p>
          <div className="flex items-center gap-1 order-1 sm:order-2">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 rounded-lg"
              disabled={isLoading || page <= 1}
              onClick={() => setPage(1)}
              aria-label="Première page"
            >
              <ChevronFirst className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-1 rounded-lg px-3 text-xs"
              disabled={isLoading || page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              <ChevronLeft className="h-3.5 w-3.5" /> Précédent
            </Button>
            <div className="hidden sm:flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const start = Math.max(1, Math.min(page - 2, totalPages - 4))
                const p = start + i
                return p <= totalPages ? (
                  <Button
                    key={p}
                    variant={p === page ? "default" : "outline"}
                    size="icon"
                    className={cn(
                      "h-8 w-8 rounded-lg text-xs",
                      p === page &&
                        "bg-[#cd3b86] hover:bg-[#b8307a] text-white border-0",
                    )}
                    onClick={() => setPage(p)}
                  >
                    {p}
                  </Button>
                ) : null
              })}
            </div>
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-1 rounded-lg px-3 text-xs"
              disabled={isLoading || page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Suivant <ChevronRight className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 rounded-lg"
              disabled={isLoading || page >= totalPages}
              onClick={() => setPage(totalPages)}
              aria-label="Dernière page"
            >
              <ChevronLast className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
