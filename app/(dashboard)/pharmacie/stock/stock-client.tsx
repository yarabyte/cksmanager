"use client"

import * as React from "react"
import Link from "next/link"
import {
  AlertTriangle,
  Calendar,
  Columns3,
  Filter,
  Package,
  Printer,
  Search,
  Warehouse,
  X,
} from "lucide-react"
import { listStockLots } from "@/app/actions/pharmacie-ops"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
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
import { formatCurrency, formatDate } from "@/lib/formatting"
import { cn } from "@/lib/utils"

export type StockLotRow = {
  id: string
  produitNom: string
  produitDosage: string
  produitForme: string
  produitConditionnement: string
  magasinId: string
  magasinNom: string
  numeroLot: string
  datePeremption: string
  quantite: number
  prixAchat: number
  valeur: number
  alerteStock: boolean
  alertePeremption: boolean
}

const COLUMN_DEFS = [
  { id: "produit", label: "Produit", required: true },
  { id: "forme", label: "Forme" },
  { id: "conditionnement", label: "Conditionnement" },
  { id: "magasin", label: "Magasin" },
  { id: "lot", label: "Lot" },
  { id: "peremption", label: "Péremption" },
  { id: "quantite", label: "Qté" },
  { id: "prixAchat", label: "PU achat" },
  { id: "valeur", label: "Valeur" },
] as const

type ColumnId = (typeof COLUMN_DEFS)[number]["id"]

type ColumnVisibility = Record<ColumnId, boolean>

const DEFAULT_COLUMNS: ColumnVisibility = {
  produit: true,
  forme: true,
  conditionnement: true,
  magasin: true,
  lot: true,
  peremption: true,
  quantite: true,
  prixAchat: true,
  valeur: true,
}

const STORAGE_KEY = "pharmacie-stock-columns"

function loadColumns(): ColumnVisibility {
  if (typeof window === "undefined") return DEFAULT_COLUMNS
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_COLUMNS
    const parsed = JSON.parse(raw) as Partial<ColumnVisibility>
    return { ...DEFAULT_COLUMNS, ...parsed, produit: true }
  } catch {
    return DEFAULT_COLUMNS
  }
}

export function StockClient({
  initial,
  magasins,
}: {
  initial: StockLotRow[]
  magasins: { id: string; nom: string }[]
}) {
  const [lots, setLots] = React.useState(initial)
  const [magasinId, setMagasinId] = React.useState("all")
  const [q, setQ] = React.useState("")
  const [alerteOnly, setAlerteOnly] = React.useState(false)
  const [loading, setLoading] = React.useState(false)
  const [columns, setColumns] = React.useState<ColumnVisibility>(DEFAULT_COLUMNS)

  React.useEffect(() => {
    setColumns(loadColumns())
  }, [])

  React.useEffect(() => {
    let cancelled = false
    setLoading(true)
    void listStockLots({ magasinId, q }).then((rows) => {
      if (!cancelled) {
        setLots(rows as StockLotRow[])
        setLoading(false)
      }
    })
    return () => {
      cancelled = true
    }
  }, [magasinId, q])

  function toggleColumn(id: ColumnId) {
    if (id === "produit") return
    setColumns((prev) => {
      const next = { ...prev, [id]: !prev[id] }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      return next
    })
  }

  function showAllColumns() {
    setColumns(DEFAULT_COLUMNS)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_COLUMNS))
  }

  const visibleCols = COLUMN_DEFS.filter((c) => columns[c.id])
  const colCount = visibleCols.length

  const filtered = React.useMemo(() => {
    if (!alerteOnly) return lots
    return lots.filter((l) => l.alerteStock || l.alertePeremption)
  }, [lots, alerteOnly])

  const stats = React.useMemo(() => {
    const totalUnites = lots.reduce((s, l) => s + l.quantite, 0)
    const valeurTotale = lots.reduce(
      (s, l) => s + (l.valeur ?? l.quantite * l.prixAchat),
      0,
    )
    const alertesStock = lots.filter((l) => l.alerteStock).length
    const alertesPeremption = lots.filter((l) => l.alertePeremption).length
    return {
      lots: lots.length,
      totalUnites,
      valeurTotale,
      alertes: alertesStock + alertesPeremption,
    }
  }, [lots])

  const hasFilters = q !== "" || magasinId !== "all" || alerteOnly
  const activeCount =
    (q !== "" ? 1 : 0) + (magasinId !== "all" ? 1 : 0) + (alerteOnly ? 1 : 0)

  function resetFilters() {
    setQ("")
    setMagasinId("all")
    setAlerteOnly(false)
  }

  const printHref = React.useMemo(() => {
    const params = new URLSearchParams()
    if (magasinId !== "all") params.set("magasinId", magasinId)
    if (q.trim()) params.set("q", q.trim())
    if (alerteOnly) params.set("alertes", "1")
    const cols = COLUMN_DEFS.filter((c) => columns[c.id]).map((c) => c.id)
    params.set("cols", cols.join(","))
    return `/pharmacie/stock/imprimer?${params.toString()}`
  }, [magasinId, q, alerteOnly, columns])

  const magasinLabel =
    magasinId === "all"
      ? "Tous les magasins"
      : (magasins.find((m) => m.id === magasinId)?.nom ?? "Magasin")

  const kpis = [
    {
      label: "Lots en stock",
      value: String(stats.lots),
      icon: Package,
      accent: "text-gray-900",
      bg: "bg-gray-100",
    },
    {
      label: "Unités",
      value: String(stats.totalUnites),
      icon: Warehouse,
      accent: "text-[#cd3b86]",
      bg: "bg-[#cd3b86]/8",
    },
    {
      label: "Valeur stock",
      value: formatCurrency(stats.valeurTotale),
      icon: Package,
      accent: "text-blue-600",
      bg: "bg-blue-50",
      compact: true,
    },
    {
      label: "Alertes",
      value: String(stats.alertes),
      icon: AlertTriangle,
      accent: stats.alertes > 0 ? "text-amber-600" : "text-emerald-600",
      bg: stats.alertes > 0 ? "bg-amber-50" : "bg-emerald-50",
    },
  ]

  function renderHead(id: ColumnId) {
    if (!columns[id]) return null
    const align =
      id === "quantite"
        ? "text-center"
        : id === "prixAchat" || id === "valeur"
          ? "text-right"
          : ""
    const pad = id === "produit" ? "pl-4" : id === "valeur" ? "pr-4" : ""
    const label = COLUMN_DEFS.find((c) => c.id === id)?.label ?? id
    return (
      <TableHead
        key={id}
        className={cn(
          "text-[11px] font-bold text-gray-500 uppercase tracking-wide",
          align,
          pad,
        )}
      >
        {label}
      </TableHead>
    )
  }

  function renderCell(l: StockLotRow, id: ColumnId) {
    if (!columns[id]) return null

    switch (id) {
      case "produit":
        return (
          <TableCell key={id} className="pl-4">
            <p className="font-semibold text-sm text-gray-800">{l.produitNom}</p>
            {l.produitDosage && (
              <p className="text-xs text-gray-400">{l.produitDosage}</p>
            )}
          </TableCell>
        )
      case "forme":
        return (
          <TableCell key={id} className="text-sm text-gray-600">
            {l.produitForme || "—"}
          </TableCell>
        )
      case "conditionnement":
        return (
          <TableCell key={id} className="text-sm text-gray-600">
            {l.produitConditionnement || "—"}
          </TableCell>
        )
      case "magasin":
        return (
          <TableCell key={id}>
            <div className="flex items-center gap-2 text-sm text-gray-800">
              <Warehouse className="h-3.5 w-3.5 text-gray-400 shrink-0" />
              {l.magasinNom}
            </div>
          </TableCell>
        )
      case "lot":
        return (
          <TableCell key={id} className="font-mono text-xs text-gray-700">
            {l.numeroLot}
          </TableCell>
        )
      case "peremption":
        return (
          <TableCell key={id} className="text-sm text-gray-600 whitespace-nowrap">
            <span className="inline-flex items-center gap-1.5">
              <Calendar
                className={cn(
                  "h-3.5 w-3.5",
                  l.alertePeremption ? "text-amber-500" : "text-gray-400",
                )}
              />
              <span
                className={cn(l.alertePeremption && "text-amber-700 font-medium")}
              >
                {formatDate(l.datePeremption)}
              </span>
            </span>
            {l.alertePeremption && (
              <Badge
                variant="secondary"
                className="ml-2 font-medium bg-amber-100 text-amber-800"
              >
                Proche
              </Badge>
            )}
          </TableCell>
        )
      case "quantite":
        return (
          <TableCell key={id} className="text-center">
            <span
              className={cn(
                "tabular-nums text-sm font-semibold",
                l.alerteStock && "text-rose-600",
              )}
            >
              {l.quantite}
            </span>
            {l.alerteStock && (
              <Badge
                variant="secondary"
                className="ml-2 font-medium bg-rose-100 text-rose-800"
              >
                Bas
              </Badge>
            )}
          </TableCell>
        )
      case "prixAchat":
        return (
          <TableCell
            key={id}
            className="text-right tabular-nums text-sm text-gray-600"
          >
            {formatCurrency(l.prixAchat)}
          </TableCell>
        )
      case "valeur":
        return (
          <TableCell
            key={id}
            className="text-right tabular-nums text-sm font-semibold pr-4"
          >
            {formatCurrency(l.valeur ?? l.quantite * l.prixAchat)}
          </TableCell>
        )
      default:
        return null
    }
  }

  return (
    <div className="space-y-5 pb-10">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">
            Stock
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Lots disponibles par magasin, avec alertes stock et péremption
          </p>
        </div>
        <Button
          asChild
          className="gap-1.5 rounded-lg bg-gradient-to-r from-[#cd3b86] to-[#b8307a] hover:from-[#b8307a] hover:to-[#9b2563] text-white shadow-sm"
        >
          <Link href={printHref}>
            <Printer className="h-4 w-4" />
            Imprimer le rapport
          </Link>
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map(({ label, value, icon: Icon, accent, bg, compact }) => (
          <Card
            key={label}
            className="border border-gray-100 shadow-sm rounded-2xl bg-white"
          >
            <CardContent className="px-4 py-3">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">
                    {label}
                  </p>
                  <p
                    className={cn(
                      "font-extrabold mt-1 tabular-nums truncate",
                      compact ? "text-base" : "text-xl",
                      accent,
                    )}
                  >
                    {value}
                  </p>
                </div>
                <div
                  className={cn(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
                    bg,
                    accent,
                  )}
                >
                  <Icon className="h-4 w-4" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border border-gray-100 shadow-sm rounded-2xl bg-white">
        <CardContent className="px-4 py-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Rechercher par produit ou n° de lot…"
                className="pl-9 bg-gray-50 border-gray-200 h-9 text-sm"
              />
              {q && (
                <button
                  type="button"
                  onClick={() => setQ("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Select value={magasinId} onValueChange={setMagasinId}>
                <SelectTrigger className="h-9 w-[180px] text-xs bg-gray-50 border-gray-200 rounded-lg">
                  <Filter className="h-3.5 w-3.5 mr-1.5 text-gray-400" />
                  <SelectValue placeholder="Magasin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les magasins</SelectItem>
                  {magasins.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.nom}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button
                type="button"
                variant={alerteOnly ? "default" : "outline"}
                size="sm"
                onClick={() => setAlerteOnly((v) => !v)}
                className={cn(
                  "h-9 gap-1.5 rounded-lg text-xs",
                  alerteOnly &&
                    "bg-amber-500 hover:bg-amber-600 text-white border-amber-500",
                )}
              >
                <AlertTriangle className="h-3.5 w-3.5" />
                Alertes
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-9 gap-1.5 rounded-lg text-xs"
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
                      disabled={"required" in col && col.required}
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
                    className="w-full px-2 py-1.5 text-left text-xs text-[#cd3b86] hover:bg-gray-50 rounded-sm"
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
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <p className="text-[11px] text-gray-400 font-medium">
          {loading
            ? "Chargement…"
            : filtered.length === 0
              ? "Aucun résultat"
              : `${filtered.length} lot${filtered.length > 1 ? "s" : ""}${hasFilters ? " (filtrés)" : ""} · ${magasinLabel}`}
        </p>
      </div>

      <Card className="border border-gray-100 shadow-sm rounded-2xl overflow-hidden bg-white">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50/80 hover:bg-gray-50/80 border-b border-gray-100">
                {COLUMN_DEFS.map((c) => renderHead(c.id))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={colCount} className="h-52 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="h-14 w-14 rounded-2xl bg-gray-50 flex items-center justify-center">
                        <Package className="h-7 w-7 text-gray-300" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-600">
                          {hasFilters
                            ? "Aucun lot ne correspond"
                            : "Aucun stock disponible"}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {hasFilters
                            ? "Essayez d'autres filtres."
                            : "Validez une réception pour entrer du stock."}
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
                filtered.map((l, i) => (
                  <TableRow
                    key={l.id}
                    className={cn(
                      "hover:bg-[#cd3b86]/3 transition-colors border-b border-gray-50",
                      i % 2 !== 0 && "bg-gray-50/30",
                      (l.alerteStock || l.alertePeremption) && "bg-amber-50/40",
                    )}
                  >
                    {COLUMN_DEFS.map((c) => renderCell(l, c.id))}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  )
}
