"use client"

import * as React from "react"
import Link from "next/link"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import {
  CalendarRange,
  ChevronFirst,
  ChevronLast,
  ChevronLeft,
  ChevronRight,
  Filter,
  Inbox,
  Printer,
  Receipt,
  X,
} from "lucide-react"
import { FacturationTabs } from "@/components/shared/facturation-tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { DatePickerFr } from "@/components/ui/date-picker-fr"
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
import { formatCurrency, formatFactureNumero } from "@/lib/formatting"
import {
  endOfDayDouala,
  getZonedParts,
  parseDoualaIsoDate,
  shiftDoualaDays,
  startOfDayDouala,
  zonedDateTimeToUtc,
} from "@/lib/timezone"
import { cn } from "@/lib/utils"
import type { BacFactureRow } from "@/app/actions/bac-factures"

const PAGE_SIZE_OPTIONS = [10, 20, 50] as const

const PERIODE_OPTIONS = [
  { value: "today", label: "Aujourd'hui" },
  { value: "yesterday", label: "Hier" },
  { value: "week", label: "7 derniers jours" },
  { value: "month", label: "Ce mois" },
  { value: "all", label: "Toutes les dates" },
  { value: "custom", label: "Personnalisé" },
] as const

type Periode = (typeof PERIODE_OPTIONS)[number]["value"]

function sourceTypeLabel(t: BacFactureRow["sourceType"]) {
  if (t === "FEUILLE") return "Feuille"
  if (t === "PRESCRIPTION") return "Prescription"
  if (t === "MIXTE") return "Mixte"
  return "Facture"
}

function getPeriodeRange(
  periode: Periode,
  dateFrom?: string,
  dateTo?: string,
): { gte: Date; lte: Date } | null {
  const now = new Date()

  if (periode === "all") return null

  if (periode === "custom") {
    if (!dateFrom) return null
    const from = parseDoualaIsoDate(dateFrom)
    const toDate = dateTo ? parseDoualaIsoDate(dateTo) : from
    if (!from || !toDate) return null
    const gte = startOfDayDouala(from)
    const lte = endOfDayDouala(toDate)
    return { gte, lte: lte < gte ? endOfDayDouala(from) : lte }
  }

  if (periode === "today") {
    return { gte: startOfDayDouala(now), lte: endOfDayDouala(now) }
  }

  if (periode === "yesterday") {
    const y = shiftDoualaDays(now, -1)
    return { gte: startOfDayDouala(y), lte: endOfDayDouala(y) }
  }

  if (periode === "week") {
    return {
      gte: startOfDayDouala(shiftDoualaDays(now, -6)),
      lte: endOfDayDouala(now),
    }
  }

  if (periode === "month") {
    const z = getZonedParts(now)
    return {
      gte: zonedDateTimeToUtc(z.year, z.month, 1, 0, 0, 0, 0),
      lte: endOfDayDouala(now),
    }
  }

  return null
}

function filterByPeriode(
  items: BacFactureRow[],
  periode: Periode,
  dateFrom?: string,
  dateTo?: string,
) {
  const range = getPeriodeRange(periode, dateFrom, dateTo)
  if (!range) {
    // custom without dates → show nothing until applied
    if (periode === "custom" && !dateFrom) return []
    return items
  }
  return items.filter((row) => {
    if (!row.createdAt) return false
    const t = new Date(row.createdAt).getTime()
    return t >= range.gte.getTime() && t <= range.lte.getTime()
  })
}

export function BacFacturesClient({
  items,
  showBordereaux,
}: {
  items: BacFactureRow[]
  showBordereaux: boolean
}) {
  const [page, setPage] = React.useState(1)
  const [pageSize, setPageSize] = React.useState(20)
  const [periode, setPeriode] = React.useState<Periode>("all")
  const [customDateFrom, setCustomDateFrom] = React.useState("")
  const [customDateTo, setCustomDateTo] = React.useState("")
  const [appliedDateFrom, setAppliedDateFrom] = React.useState("")
  const [appliedDateTo, setAppliedDateTo] = React.useState("")

  const filteredItems = React.useMemo(
    () =>
      filterByPeriode(
        items,
        periode,
        periode === "custom" ? appliedDateFrom : undefined,
        periode === "custom" ? appliedDateTo || appliedDateFrom : undefined,
      ),
    [items, periode, appliedDateFrom, appliedDateTo],
  )

  const totalPending = items.length
  const total = filteredItems.length
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const safePage = Math.min(page, totalPages)
  const skip = (safePage - 1) * pageSize
  const rangeFrom = total === 0 ? 0 : skip + 1
  const rangeTo = Math.min(skip + pageSize, total)
  const pageItems = filteredItems.slice(skip, skip + pageSize)

  React.useEffect(() => {
    if (page > totalPages) setPage(totalPages)
  }, [page, totalPages])

  React.useEffect(() => {
    setPage(1)
  }, [periode, appliedDateFrom, appliedDateTo, pageSize])

  function handlePeriodeChange(value: string) {
    const next = value as Periode
    setPeriode(next)
    if (next !== "custom") {
      setAppliedDateFrom("")
      setAppliedDateTo("")
    }
  }

  function handleCustomApply() {
    if (!customDateFrom) return
    setAppliedDateFrom(customDateFrom)
    setAppliedDateTo(customDateTo)
  }

  function resetFilters() {
    setPeriode("all")
    setCustomDateFrom("")
    setCustomDateTo("")
    setAppliedDateFrom("")
    setAppliedDateTo("")
  }

  const hasActiveFilter = periode !== "all"

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">
            Bac à facture
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Factures à imprimer après encaissement caisse ({totalPending} en
            attente).
          </p>
        </div>
      </div>

      <FacturationTabs showBordereaux={showBordereaux} />

      {totalPending > 0 ? (
        <Card className="border border-gray-100 shadow-sm rounded-2xl bg-white">
          <CardContent className="px-4 py-3 space-y-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-500">
                  <Filter className="h-3.5 w-3.5" />
                  Période
                  {hasActiveFilter ? (
                    <span className="bg-[#cd3b86] text-white text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center">
                      1
                    </span>
                  ) : null}
                </div>
                <div className="w-px h-4 bg-gray-200" />
                <Select value={periode} onValueChange={handlePeriodeChange}>
                  <SelectTrigger className="h-8 w-[170px] text-xs bg-gray-50 border-gray-200 rounded-lg">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PERIODE_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {hasActiveFilter ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={resetFilters}
                    className="h-8 text-xs text-gray-400 hover:text-gray-600 px-2 gap-1"
                  >
                    <X className="h-3 w-3" /> Effacer
                  </Button>
                ) : null}
              </div>
            </div>

            {periode === "custom" ? (
              <div className="flex flex-wrap items-end gap-2 rounded-lg border bg-muted/30 p-3">
                <CalendarRange className="mb-2.5 h-4 w-4 text-muted-foreground" />
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-muted-foreground">
                    Du
                  </label>
                  <DatePickerFr
                    dateValue={customDateFrom}
                    onDateChange={setCustomDateFrom}
                    placeholder="Date de début"
                    clearable={false}
                    className="h-9 w-[180px] text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-muted-foreground">
                    Au
                  </label>
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
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      {totalPending > 0 ? (
        <div className="flex items-center justify-between">
          <p className="text-[11px] text-gray-400 font-medium">
            {total === 0
              ? "Aucun résultat"
              : `${rangeFrom}–${rangeTo} sur ${total} facture${total > 1 ? "s" : ""}`}
          </p>
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-gray-400">Lignes :</span>
            <Select
              value={String(pageSize)}
              onValueChange={(v) => {
                setPageSize(Number(v))
                setPage(1)
              }}
            >
              <SelectTrigger className="h-7 w-16 text-xs bg-white border-gray-200 rounded-lg">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAGE_SIZE_OPTIONS.map((n) => (
                  <SelectItem key={n} value={String(n)}>
                    {n}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      ) : null}

      <Card className="border border-gray-100 shadow-sm rounded-2xl bg-white overflow-hidden">
        <CardContent className="p-0">
          {totalPending === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-gray-400">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gray-50">
                <Inbox className="h-6 w-6" />
              </div>
              <p className="text-sm font-semibold text-gray-500">Bac vide</p>
              <p className="text-xs text-gray-400 max-w-sm text-center">
                Les factures générées au paiement caisse apparaîtront ici jusqu&apos;à
                impression.
              </p>
            </div>
          ) : total === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-gray-400">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gray-50">
                <Filter className="h-6 w-6" />
              </div>
              <p className="text-sm font-semibold text-gray-500">
                Aucune facture pour cette période
              </p>
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs rounded-lg"
                onClick={resetFilters}
              >
                Voir toutes les dates
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50/80">
                  <TableHead className="text-xs font-semibold">Facture</TableHead>
                  <TableHead className="text-xs font-semibold">Patient</TableHead>
                  <TableHead className="text-xs font-semibold hidden md:table-cell">
                    Source
                  </TableHead>
                  <TableHead className="text-xs font-semibold text-right">
                    Part patient
                  </TableHead>
                  <TableHead className="text-xs font-semibold text-right hidden sm:table-cell">
                    Part assurance
                  </TableHead>
                  <TableHead className="text-xs font-semibold hidden lg:table-cell">
                    Encaissé le
                  </TableHead>
                  <TableHead className="text-xs font-semibold w-[100px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {pageItems.map((row) => (
                  <TableRow key={row.id} className="group">
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Receipt className="h-3.5 w-3.5 text-[#cd3b86] shrink-0" />
                        <span className="text-sm font-semibold text-gray-900">
                          {formatFactureNumero(row.factureNumero)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-gray-700">
                      {row.patientLabel ?? `#${row.patientId}`}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <div className="space-y-0.5">
                        <Badge
                          variant="secondary"
                          className="text-[10px] font-semibold"
                        >
                          {sourceTypeLabel(row.sourceType)}
                        </Badge>
                        {row.sourceLabel ? (
                          <p className="text-[11px] text-gray-500 truncate max-w-[180px]">
                            {row.sourceLabel}
                          </p>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell className="text-right text-sm tabular-nums">
                      {formatCurrency(row.montantPatient)}
                    </TableCell>
                    <TableCell className="text-right text-sm tabular-nums hidden sm:table-cell">
                      {formatCurrency(row.montantAssurance)}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-xs text-gray-500">
                      {row.createdAt
                        ? format(new Date(row.createdAt), "d MMM yyyy HH:mm", {
                            locale: fr,
                          })
                        : "—"}
                    </TableCell>
                    <TableCell>
                      <Button
                        asChild
                        size="sm"
                        className="gap-1.5 h-8 bg-[#cd3b86] hover:bg-[#b8307a] text-white"
                      >
                        <Link href={`/facturation/bac/${row.id}/imprimer`}>
                          <Printer className="h-3.5 w-3.5" />
                          Imprimer
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {total > 0 ? (
        <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
          <p className="text-xs text-gray-400 order-2 sm:order-1">
            Page <span className="font-semibold text-gray-600">{safePage}</span> sur{" "}
            {totalPages}
          </p>
          <div className="flex items-center gap-1 order-1 sm:order-2">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 rounded-lg"
              disabled={safePage <= 1}
              onClick={() => setPage(1)}
              aria-label="Première page"
            >
              <ChevronFirst className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-1 rounded-lg px-3 text-xs"
              disabled={safePage <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              <ChevronLeft className="h-3.5 w-3.5" /> Précédent
            </Button>

            <div className="hidden sm:flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const start = Math.max(1, Math.min(safePage - 2, totalPages - 4))
                const p = start + i
                return p <= totalPages ? (
                  <Button
                    key={p}
                    variant={p === safePage ? "default" : "outline"}
                    size="icon"
                    className={cn(
                      "h-8 w-8 rounded-lg text-xs",
                      p === safePage &&
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
              disabled={safePage >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Suivant <ChevronRight className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 rounded-lg"
              disabled={safePage >= totalPages}
              onClick={() => setPage(totalPages)}
              aria-label="Dernière page"
            >
              <ChevronLast className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
