"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { DatePickerFr } from "@/components/ui/date-picker-fr"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { KPICard } from "@/components/shared/kpi-card"
import {
  Search,
  Plus,
  ScrollText,
  FileCheck2,
  FilePen,
  Wallet,
  X,
  Eye,
  Filter,
  Loader2,
  CalendarRange,
  Columns3,
} from "lucide-react"
import { formatCurrency, formatBirthAge, formatDateTime } from "@/lib/formatting"
import type { FeuilleListRow, FeuilleStats } from "@/lib/types/feuille-circulation"
import { listFeuilles, type FeuilleFilters } from "@/app/actions/feuilles-circulation"

const COLUMN_DEFS = [
  { id: "dateCreation", label: "Date création" },
  { id: "lignes", label: "Lignes" },
  { id: "partAssurance", label: "Part assurance" },
  { id: "partPatient", label: "Part patient" },
  { id: "statut", label: "Statut" },
] as const

type ColumnId = (typeof COLUMN_DEFS)[number]["id"]
type ColumnVisibility = Record<ColumnId, boolean>

const DEFAULT_COLUMNS: ColumnVisibility = {
  dateCreation: true,
  lignes: true,
  partAssurance: true,
  partPatient: true,
  statut: true,
}

const STORAGE_KEY = "feuilles-circulation-columns"

function loadColumns(): ColumnVisibility {
  if (typeof window === "undefined") return DEFAULT_COLUMNS
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_COLUMNS
    const parsed = JSON.parse(raw) as Partial<ColumnVisibility>
    return { ...DEFAULT_COLUMNS, ...parsed }
  } catch {
    return DEFAULT_COLUMNS
  }
}

function StatutBadge({ statut }: { statut: string }) {
  if (statut === "CONFIRMEE") {
    return (
      <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400">
        Confirmée
      </Badge>
    )
  }
  return (
    <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400">
      Brouillon
    </Badge>
  )
}

export function FeuillesCirculationClient({
  initialFeuilles,
  stats,
}: {
  initialFeuilles: FeuilleListRow[]
  stats: FeuilleStats
}) {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = React.useState("")
  const [statut, setStatut] = React.useState("all")
  const [periode, setPeriode] = React.useState("all")
  const [customDateFrom, setCustomDateFrom] = React.useState("")
  const [customDateTo, setCustomDateTo] = React.useState("")
  const [feuilles, setFeuilles] = React.useState<FeuilleListRow[]>(initialFeuilles)
  const [loading, setLoading] = React.useState(false)
  const [columns, setColumns] = React.useState<ColumnVisibility>(DEFAULT_COLUMNS)

  React.useEffect(() => {
    setColumns(loadColumns())
  }, [])

  React.useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(columns))
  }, [columns])

  const colCount = Object.values(columns).filter(Boolean).length

  function toggleColumn(id: ColumnId) {
    setColumns((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  function showAllColumns() {
    setColumns(DEFAULT_COLUMNS)
  }

  const visibleColumnCount = 4 + colCount

  const fetchFeuilles = React.useCallback(async (filters: FeuilleFilters) => {
    setLoading(true)
    try {
      setFeuilles(await listFeuilles(filters))
    } finally {
      setLoading(false)
    }
  }, [])

  const buildServerFilters = React.useCallback(
    (p: string, s: string, from: string, to: string): FeuilleFilters => ({
      periode: p !== "all" ? p : undefined,
      statut: s !== "all" ? s : undefined,
      dateFrom: p === "custom" && from ? from : undefined,
      dateTo: p === "custom" && to ? to : undefined,
    }),
    [],
  )

  const applyFilters = React.useCallback(
    (p: string, s: string, from: string, to: string) => {
      void fetchFeuilles(buildServerFilters(p, s, from, to))
    },
    [fetchFeuilles, buildServerFilters],
  )

  const filtered = React.useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    return feuilles.filter((f) => {
      const matchSearch =
        q === "" ||
        f.numero.toLowerCase().includes(q) ||
        (f.patientLabel?.toLowerCase().includes(q) ?? false) ||
        (f.libelle?.toLowerCase().includes(q) ?? false)
      return matchSearch
    })
  }, [feuilles, searchQuery])

  const hasFilters =
    searchQuery !== "" ||
    statut !== "all" ||
    periode !== "all" ||
    (periode === "custom" && (customDateFrom !== "" || customDateTo !== ""))

  const activeFiltersCount = [
    periode !== "all",
    statut !== "all",
    searchQuery !== "",
  ].filter(Boolean).length

  function resetFilters() {
    setSearchQuery("")
    setStatut("all")
    setPeriode("all")
    setCustomDateFrom("")
    setCustomDateTo("")
    void fetchFeuilles({})
  }

  function handlePeriodeChange(value: string) {
    setPeriode(value)
    if (value !== "custom") {
      applyFilters(value, statut, customDateFrom, customDateTo)
    }
  }

  function handleCustomApply() {
    if (!customDateFrom) return
    applyFilters("custom", statut, customDateFrom, customDateTo)
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            Feuilles de circulation
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Actes et produits facturables du parcours patient (part assurance / part patient).
          </p>
        </div>
        <Button asChild className="gap-2 bg-[#cd3b86] hover:bg-[#b8307a] text-white">
          <Link href="/feuilles-circulation/nouvelle">
            <Plus className="h-4 w-4" />
            Nouvelle feuille de circulation
          </Link>
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard title="Total feuilles de circulation" value={stats.total} icon={<ScrollText className="h-6 w-6" />} />
        <KPICard
          title="Brouillons"
          value={stats.brouillon}
          icon={<FilePen className="h-6 w-6" />}
        />
        <KPICard
          title="Confirmées"
          value={stats.confirmees}
          icon={<FileCheck2 className="h-6 w-6" />}
        />
        <KPICard
          title="Part patient (brouillons)"
          value={formatCurrency(stats.totalPatientEnCours)}
          icon={<Wallet className="h-6 w-6" />}
        />
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Rechercher par numéro, patient ou libellé..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                <Filter className="h-3.5 w-3.5" />
                Filtres
                {activeFiltersCount > 0 && (
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#cd3b86] text-[10px] font-bold text-white">
                    {activeFiltersCount}
                  </span>
                )}
              </div>

              <Select value={periode} onValueChange={handlePeriodeChange}>
                <SelectTrigger className="h-9 w-[160px] text-xs">
                  <SelectValue placeholder="Période" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les dates</SelectItem>
                  <SelectItem value="today">Aujourd&apos;hui</SelectItem>
                  <SelectItem value="yesterday">Hier</SelectItem>
                  <SelectItem value="week">Cette semaine</SelectItem>
                  <SelectItem value="month">Ce mois</SelectItem>
                  <SelectItem value="custom">Personnalisé</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={statut}
                onValueChange={(v) => {
                  setStatut(v)
                  applyFilters(periode, v, customDateFrom, customDateTo)
                }}
              >
                <SelectTrigger className="h-9 w-[160px] text-xs">
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="BROUILLON">Brouillon</SelectItem>
                  <SelectItem value="CONFIRMEE">Confirmée</SelectItem>
                </SelectContent>
              </Select>

              {hasFilters && (
                <Button variant="ghost" size="sm" onClick={resetFilters} className="gap-1 h-9">
                  <X className="h-4 w-4" />
                  Effacer
                </Button>
              )}

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-9 gap-1.5 text-xs"
                  >
                    <Columns3 className="h-3.5 w-3.5" />
                    Colonnes
                    <Badge
                      variant="secondary"
                      className="ml-0.5 h-5 min-w-5 justify-center px-1.5 text-[10px] font-semibold"
                    >
                      {colCount}
                    </Badge>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52">
                  <DropdownMenuLabel className="text-xs">
                    Afficher les colonnes
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {COLUMN_DEFS.map((col) => (
                    <DropdownMenuCheckboxItem
                      key={col.id}
                      checked={columns[col.id]}
                      onCheckedChange={() => toggleColumn(col.id)}
                      onSelect={(e) => e.preventDefault()}
                    >
                      {col.label}
                    </DropdownMenuCheckboxItem>
                  ))}
                  <DropdownMenuSeparator />
                  <button
                    type="button"
                    onClick={showAllColumns}
                    className="w-full rounded-sm px-2 py-1.5 text-left text-xs text-[#cd3b86] hover:bg-gray-50"
                  >
                    Tout afficher
                  </button>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {periode === "custom" && (
            <div className="flex flex-wrap items-end gap-2 rounded-lg border bg-muted/30 p-3">
              <CalendarRange className="h-4 w-4 text-muted-foreground mb-2.5" />
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-muted-foreground">Du</label>
                <DatePickerFr
                  dateValue={customDateFrom}
                  onDateChange={setCustomDateFrom}
                  placeholder="Date de début"
                  clearable={false}
                  className="h-9 w-[180px] text-xs"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-muted-foreground">Au</label>
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

          {loading && (
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Chargement…
            </p>
          )}
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>N° / Libellé</TableHead>
                <TableHead>Patient</TableHead>
                {columns.dateCreation && <TableHead>Date création</TableHead>}
                {columns.lignes && <TableHead className="text-center">Lignes</TableHead>}
                {columns.partAssurance && (
                  <TableHead className="text-right">Part assurance</TableHead>
                )}
                {columns.partPatient && <TableHead className="text-right">Part patient</TableHead>}
                <TableHead className="text-right">Total</TableHead>
                {columns.statut && <TableHead>Statut</TableHead>}
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={visibleColumnCount} className="h-32 text-center">
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <ScrollText className="h-8 w-8" />
                      <p>Aucune feuille de circulation</p>
                      {hasFilters ? (
                        <Button variant="link" size="sm" onClick={resetFilters}>
                          Effacer les filtres
                        </Button>
                      ) : (
                        <Button asChild variant="link" size="sm">
                          <Link href="/feuilles-circulation/nouvelle">Créer une feuille de circulation</Link>
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((f) => (
                  <TableRow
                    key={f.id}
                    className="cursor-pointer"
                    onClick={() => router.push(`/feuilles-circulation/${f.id}`)}
                  >
                    <TableCell className="font-medium">
                      <span className="font-sans text-sm">{f.numero}</span>
                      {f.libelle && (
                        <div className="text-xs text-muted-foreground">{f.libelle}</div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        {f.patientDob && (
                          <span className="text-[11px] text-muted-foreground">
                            {formatBirthAge(f.patientDob)}
                          </span>
                        )}
                        <span>
                          {f.patientLabel ?? (
                            <span className="font-sans text-muted-foreground">#{f.patientId}</span>
                          )}
                        </span>
                      </div>
                    </TableCell>
                    {columns.dateCreation && (
                      <TableCell>{f.createdAt ? formatDateTime(f.createdAt) : "-"}</TableCell>
                    )}
                    {columns.lignes && (
                      <TableCell className="text-center">{f.nbLignes}</TableCell>
                    )}
                    {columns.partAssurance && (
                      <TableCell className="text-right text-emerald-600">
                        {formatCurrency(f.totalAssurance)}
                      </TableCell>
                    )}
                    {columns.partPatient && (
                      <TableCell className="text-right font-semibold">
                        {formatCurrency(f.totalPatient)}
                      </TableCell>
                    )}
                    <TableCell className="text-right">{formatCurrency(f.total)}</TableCell>
                    {columns.statut && (
                      <TableCell>
                        <StatutBadge statut={f.statut} />
                      </TableCell>
                    )}
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation()
                          router.push(`/feuilles-circulation/${f.id}`)
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
