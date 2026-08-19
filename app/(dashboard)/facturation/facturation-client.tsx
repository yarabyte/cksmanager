"use client"

import * as React from "react"
import Link from "next/link"
import {
  CheckCircle2,
  Columns3,
  Eye,
  FilePen,
  Filter,
  Plus,
  Receipt,
  Search,
  Wallet,
  X,
} from "lucide-react"
import { FacturePaiementGlobalBadge } from "@/components/shared/facture-db-status-badge"
import { FacturationTabs } from "@/components/shared/facturation-tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { DatePickerFr } from "@/components/ui/date-picker-fr"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
import {
  PAIEMENT_GLOBAL_LABEL,
  resolveFacturePaiementStatus,
  type FacturePaiementGlobal,
} from "@/lib/facture/paiement-status"
import { formatCurrency, formatDateTime, formatFactureNumero } from "@/lib/formatting"
import { cn } from "@/lib/utils"
import type { FactureListRow } from "@/lib/types/facture"

const PAIEMENT_FILTERS: { value: string; label: string }[] = [
  { value: "all", label: "Tous les paiements" },
  { value: "BROUILLON", label: PAIEMENT_GLOBAL_LABEL.BROUILLON },
  { value: "A_ENCAISSER", label: PAIEMENT_GLOBAL_LABEL.A_ENCAISSER },
  { value: "PAYE_PATIENT", label: PAIEMENT_GLOBAL_LABEL.PAYE_PATIENT },
  { value: "PAYE_ASSUREUR", label: PAIEMENT_GLOBAL_LABEL.PAYE_ASSUREUR },
  { value: "TOTALEMENT_PAYE", label: PAIEMENT_GLOBAL_LABEL.TOTALEMENT_PAYE },
]

const COLUMN_DEFS = [
  { id: "assureur", label: "Assureur" },
  { id: "feuilles", label: "Feuilles" },
  { id: "paiement", label: "Paiement" },
  { id: "partPatient", label: "Part patient" },
  { id: "partAssurance", label: "Part assurance" },
  { id: "dateCreation", label: "Créée le" },
] as const

type ColumnId = (typeof COLUMN_DEFS)[number]["id"]
type ColumnVisibility = Record<ColumnId, boolean>

const DEFAULT_COLUMNS: ColumnVisibility = {
  assureur: true,
  feuilles: true,
  paiement: true,
  partPatient: true,
  partAssurance: true,
  dateCreation: true,
}

const STORAGE_KEY = "facturation-columns"

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

function paiementOf(f: FactureListRow) {
  return resolveFacturePaiementStatus({
    statut: f.statut,
    montantPatient: f.montantPatient,
    montantAssurance: f.montantAssurance,
    suiviAssureur: f.suiviAssureur,
  })
}

function dateOnly(iso: string | null): string | null {
  if (!iso) return null
  return iso.slice(0, 10)
}

export function FacturationClient({
  factures,
  showBordereaux = false,
}: {
  factures: FactureListRow[]
  showBordereaux?: boolean
}) {
  const [searchQuery, setSearchQuery] = React.useState("")
  const [paiementFilter, setPaiementFilter] = React.useState("all")
  const [assuranceId, setAssuranceId] = React.useState("all")
  const [dateDebut, setDateDebut] = React.useState("")
  const [dateFin, setDateFin] = React.useState("")
  const [columns, setColumns] = React.useState<ColumnVisibility>(DEFAULT_COLUMNS)

  React.useEffect(() => {
    setColumns(loadColumns())
  }, [])

  React.useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(columns))
  }, [columns])

  const colCount = Object.values(columns).filter(Boolean).length
  const visibleColumnCount = 3 + colCount

  function toggleColumn(id: ColumnId) {
    setColumns((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  function showAllColumns() {
    setColumns(DEFAULT_COLUMNS)
  }

  const assureurs = React.useMemo(() => {
    const map = new Map<string, string>()
    for (const f of factures) {
      const id = f.suiviAssureur?.assuranceId
      const nom = f.suiviAssureur?.assuranceNom
      if (id && nom) map.set(id, nom)
    }
    return [...map.entries()]
      .map(([id, nom]) => ({ id, nom }))
      .sort((a, b) => a.nom.localeCompare(b.nom, "fr"))
  }, [factures])

  const stats = React.useMemo(() => {
    let brouillons = 0
    let aEncaisser = 0
    let payePatient = 0
    let totalementPaye = 0
    for (const f of factures) {
      const g = paiementOf(f).global
      if (g === "BROUILLON") brouillons++
      else if (g === "A_ENCAISSER") aEncaisser++
      else if (g === "PAYE_PATIENT" || g === "PAYE_ASSUREUR") payePatient++
      else if (g === "TOTALEMENT_PAYE") totalementPaye++
    }
    return {
      total: factures.length,
      brouillons,
      aEncaisser,
      partiel: payePatient,
      totalementPaye,
    }
  }, [factures])

  const filtered = React.useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    return factures.filter((f) => {
      const paiement = paiementOf(f)
      const matchPaiement =
        paiementFilter === "all" || paiement.global === (paiementFilter as FacturePaiementGlobal)
      const matchAss =
        assuranceId === "all" ||
        (assuranceId === "none"
          ? !f.suiviAssureur?.assuranceId
          : f.suiviAssureur?.assuranceId === assuranceId)
      const created = dateOnly(f.createdAt)
      const matchDebut = !dateDebut || (created != null && created >= dateDebut)
      const matchFin = !dateFin || (created != null && created <= dateFin)
      const matchSearch =
        q === "" ||
        f.numero.toLowerCase().includes(q) ||
        formatFactureNumero(f.numero).toLowerCase().includes(q) ||
        (f.patientLabel?.toLowerCase().includes(q) ?? false) ||
        f.patientId.includes(q) ||
        (f.suiviAssureur?.assuranceNom?.toLowerCase().includes(q) ?? false)
      return matchPaiement && matchAss && matchDebut && matchFin && matchSearch
    })
  }, [factures, searchQuery, paiementFilter, assuranceId, dateDebut, dateFin])

  const hasFilters =
    searchQuery !== "" ||
    paiementFilter !== "all" ||
    assuranceId !== "all" ||
    dateDebut !== "" ||
    dateFin !== ""
  const activeCount =
    (searchQuery !== "" ? 1 : 0) +
    (paiementFilter !== "all" ? 1 : 0) +
    (assuranceId !== "all" ? 1 : 0) +
    (dateDebut !== "" ? 1 : 0) +
    (dateFin !== "" ? 1 : 0)
  const montantAffiche = filtered.reduce((s, f) => s + f.montantPatient, 0)

  function resetFilters() {
    setSearchQuery("")
    setPaiementFilter("all")
    setAssuranceId("all")
    setDateDebut("")
    setDateFin("")
  }

  const statCards = [
    { key: "total" as const, label: "Total factures", icon: Receipt, value: stats.total },
    { key: "brouillons" as const, label: "Brouillons", icon: FilePen, value: stats.brouillons },
    { key: "aEncaisser" as const, label: "À encaisser", icon: Wallet, value: stats.aEncaisser },
    {
      key: "totalementPaye" as const,
      label: "Totalement payées",
      icon: CheckCircle2,
      value: stats.totalementPaye,
    },
  ]

  const headClass =
    "text-[11px] font-bold text-gray-500 uppercase tracking-wide py-3"

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">Facturation</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Regroupement de feuilles de circulation confirmées d&apos;une même visite (minimum une
            feuille validée).
          </p>
        </div>
        <Button
          asChild
          className="gap-2 bg-gradient-to-r from-[#cd3b86] to-[#b8307a] hover:from-[#b8307a] hover:to-[#9b2563] text-white shadow-sm transition-all"
        >
          <Link href="/facturation/nouvelle">
            <Plus className="h-4 w-4" />
            Nouvelle facture
          </Link>
        </Button>
      </div>

      {showBordereaux ? <FacturationTabs showBordereaux /> : null}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map(({ key, label, icon: Icon, value }) => (
          <Card key={key} className="border border-gray-100 shadow-sm rounded-2xl bg-white">
            <CardContent className="px-4 py-3">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">
                    {label}
                  </p>
                  <p className="text-2xl font-extrabold text-gray-900 mt-1 tabular-nums">{value}</p>
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
                placeholder="Rechercher par n° facture, patient ou assureur…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
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

            <div className="flex items-center gap-2 flex-wrap">
              <Select value={paiementFilter} onValueChange={setPaiementFilter}>
                <SelectTrigger className="h-9 w-[180px] text-xs bg-gray-50 border-gray-200 rounded-lg">
                  <Filter className="h-3.5 w-3.5 mr-1.5 text-gray-400" />
                  <SelectValue placeholder="Paiement" />
                </SelectTrigger>
                <SelectContent>
                  {PAIEMENT_FILTERS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={assuranceId} onValueChange={setAssuranceId}>
                <SelectTrigger className="h-9 w-[180px] text-xs bg-gray-50 border-gray-200 rounded-lg">
                  <SelectValue placeholder="Assureur" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les assureurs</SelectItem>
                  <SelectItem value="none">Sans assureur</SelectItem>
                  {assureurs.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.nom}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-9 gap-1.5 text-xs bg-gray-50 border-gray-200 rounded-lg"
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

              {hasFilters && (
                <div className="flex items-center gap-1.5">
                  <span className="flex items-center gap-1 text-xs font-semibold text-[#cd3b86] bg-[#cd3b86]/8 border border-[#cd3b86]/20 px-2 py-1 rounded-full">
                    <Filter className="h-3 w-3" />
                    {activeCount} filtre{activeCount > 1 ? "s" : ""}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={resetFilters}
                    className="h-7 text-xs text-gray-400 hover:text-gray-600 px-2 gap-1"
                  >
                    <X className="h-3 w-3" /> Effacer
                  </Button>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">
              Créée entre
            </span>
            <DatePickerFr
              dateValue={dateDebut}
              onDateChange={setDateDebut}
              placeholder="Du"
              className="h-9 w-[150px] text-xs bg-gray-50 border-gray-200 rounded-lg"
            />
            <span className="text-xs text-gray-400">et</span>
            <DatePickerFr
              dateValue={dateFin}
              onDateChange={setDateFin}
              placeholder="Au"
              className="h-9 w-[150px] text-xs bg-gray-50 border-gray-200 rounded-lg"
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <p className="text-[11px] text-gray-400 font-medium">
          {filtered.length === 0
            ? "Aucun résultat"
            : `${filtered.length} facture${filtered.length > 1 ? "s" : ""}${hasFilters ? " (filtrées)" : ""}`}
        </p>
        <p className="text-[11px] text-gray-400 font-medium">
          Part patient affichée :{" "}
          <span className="font-semibold text-gray-600">{formatCurrency(montantAffiche)}</span>
        </p>
      </div>

      <Card className="border border-gray-100 shadow-sm rounded-2xl overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50/80 hover:bg-gray-50/80 border-b border-gray-100">
                <TableHead className={cn(headClass, "pl-4")}>N° facture</TableHead>
                <TableHead className={headClass}>Patient</TableHead>
                {columns.assureur && <TableHead className={headClass}>Assureur</TableHead>}
                {columns.feuilles && (
                  <TableHead className={cn(headClass, "text-center")}>Feuilles</TableHead>
                )}
                {columns.paiement && <TableHead className={headClass}>Paiement</TableHead>}
                {columns.partPatient && (
                  <TableHead className={cn(headClass, "text-right")}>Part patient</TableHead>
                )}
                {columns.partAssurance && (
                  <TableHead className={cn(headClass, "text-right")}>Part assurance</TableHead>
                )}
                {columns.dateCreation && <TableHead className={headClass}>Créée le</TableHead>}
                <TableHead className="w-[90px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={visibleColumnCount} className="h-52 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="h-14 w-14 rounded-2xl bg-gray-50 flex items-center justify-center">
                        <Receipt className="h-7 w-7 text-gray-300" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-600">
                          {hasFilters
                            ? "Aucune facture ne correspond"
                            : "Aucune facture enregistrée"}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {hasFilters
                            ? "Essayez d'autres termes ou filtres."
                            : "Créez une facture à partir de feuilles confirmées."}
                        </p>
                      </div>
                      {hasFilters && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={resetFilters}
                          className="gap-1.5 text-xs"
                        >
                          <X className="h-3.5 w-3.5" /> Effacer les filtres
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((f, i) => {
                  const paiement = paiementOf(f)
                  return (
                    <TableRow
                      key={f.id}
                      className={cn(
                        "hover:bg-[#cd3b86]/3 transition-colors border-b border-gray-50",
                        i % 2 !== 0 && "bg-gray-50/30",
                      )}
                    >
                      <TableCell className="py-3 pl-4">
                        <Link
                          href={`/facturation/${f.id}`}
                          className="font-sans text-xs font-semibold text-[#cd3b86] hover:underline"
                        >
                          {formatFactureNumero(f.numero)}
                        </Link>
                      </TableCell>
                      <TableCell className="py-3 max-w-[180px]">
                        <p className="font-semibold text-sm text-gray-800 leading-tight truncate">
                          {f.patientLabel ?? `Patient #${f.patientId}`}
                        </p>
                      </TableCell>
                      {columns.assureur && (
                        <TableCell className="py-3 text-sm text-gray-600 max-w-[140px] truncate">
                          {f.suiviAssureur?.assuranceNom ?? "—"}
                        </TableCell>
                      )}
                      {columns.feuilles && (
                        <TableCell className="py-3 text-center text-sm text-gray-600 tabular-nums">
                          {f.nbFeuilles}
                        </TableCell>
                      )}
                      {columns.paiement && (
                        <TableCell className="py-3">
                          <FacturePaiementGlobalBadge status={paiement.global} />
                        </TableCell>
                      )}
                      {columns.partPatient && (
                        <TableCell className="py-3 text-right font-semibold text-sm text-gray-800 tabular-nums">
                          {formatCurrency(f.montantPatient)}
                        </TableCell>
                      )}
                      {columns.partAssurance && (
                        <TableCell className="py-3 text-right text-sm text-gray-600 tabular-nums">
                          {formatCurrency(f.montantAssurance)}
                        </TableCell>
                      )}
                      {columns.dateCreation && (
                        <TableCell className="py-3 whitespace-nowrap text-sm text-gray-600">
                          {f.createdAt ? formatDateTime(f.createdAt) : "—"}
                        </TableCell>
                      )}
                      <TableCell className="py-3">
                        <Button
                          asChild
                          variant="ghost"
                          size="sm"
                          className="h-7 gap-1 text-xs text-gray-400 hover:text-gray-600 px-2"
                        >
                          <Link href={`/facturation/${f.id}`}>
                            <Eye className="h-3.5 w-3.5" />
                            Voir
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
