"use client"

import * as React from "react"
import Link from "next/link"
import {
  Calendar,
  Filter,
  Eye,
  Package,
  Plus,
  Search,
  Truck,
  User,
  Warehouse,
  X,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
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

export type ApprovisionnementRow = {
  id: string
  numero: string
  statut: string
  magasinNom: string
  fournisseurNom: string | null
  userNom: string
  dateReception: string
  nbLignes: number
  validatedAt: string | null
  createdAt: string | null
}

export function ApprovisionnementsClient({
  rows,
}: {
  rows: ApprovisionnementRow[]
}) {
  const [searchQuery, setSearchQuery] = React.useState("")
  const [magasin, setMagasin] = React.useState("all")
  const [statut, setStatut] = React.useState("all")

  const magasins = React.useMemo(() => {
    const set = new Set(rows.map((r) => r.magasinNom))
    return [...set].sort((a, b) => a.localeCompare(b, "fr"))
  }, [rows])

  const stats = React.useMemo(() => {
    const totalLignes = rows.reduce((s, r) => s + r.nbLignes, 0)
    const brouillons = rows.filter((r) => r.statut === "BROUILLON").length
    const valides = rows.filter((r) => r.statut === "VALIDE").length
    return {
      total: rows.length,
      totalLignes,
      brouillons,
      valides,
    }
  }, [rows])

  const filtered = React.useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    return rows.filter((r) => {
      const matchMagasin = magasin === "all" || r.magasinNom === magasin
      const matchStatut = statut === "all" || r.statut === statut
      const matchSearch =
        q === "" ||
        r.numero.toLowerCase().includes(q) ||
        r.magasinNom.toLowerCase().includes(q) ||
        (r.fournisseurNom?.toLowerCase().includes(q) ?? false) ||
        r.userNom.toLowerCase().includes(q)
      return matchMagasin && matchStatut && matchSearch
    })
  }, [rows, searchQuery, magasin, statut])

  const hasFilters = searchQuery !== "" || magasin !== "all" || statut !== "all"
  const activeCount =
    (searchQuery !== "" ? 1 : 0) +
    (magasin !== "all" ? 1 : 0) +
    (statut !== "all" ? 1 : 0)

  function resetFilters() {
    setSearchQuery("")
    setMagasin("all")
    setStatut("all")
  }

  const kpis = [
    {
      label: "Réceptions",
      value: String(stats.total),
      icon: Truck,
      accent: "text-gray-900",
      bg: "bg-gray-100",
    },
    {
      label: "Brouillons",
      value: String(stats.brouillons),
      icon: Package,
      accent: "text-amber-600",
      bg: "bg-amber-50",
    },
    {
      label: "Validées",
      value: String(stats.valides),
      icon: User,
      accent: "text-emerald-600",
      bg: "bg-emerald-50",
    },
    {
      label: "Lignes",
      value: String(stats.totalLignes),
      icon: Warehouse,
      accent: "text-[#cd3b86]",
      bg: "bg-[#cd3b86]/8",
    },
  ]

  return (
    <div className="space-y-5 pb-10">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">
            Approvisionnements
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Réceptions de stock avec lots et dates de péremption
          </p>
        </div>
        <Button
          asChild
          className="gap-1.5 rounded-lg bg-gradient-to-r from-[#cd3b86] to-[#b8307a] hover:from-[#b8307a] hover:to-[#9b2563] text-white shadow-sm"
        >
          <Link href="/pharmacie/approvisionnements/nouveau">
            <Plus className="h-4 w-4" />
            Nouvelle réception
          </Link>
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map(({ label, value, icon: Icon, accent, bg }) => (
          <Card
            key={label}
            className="border border-gray-100 shadow-sm rounded-2xl bg-white"
          >
            <CardContent className="px-4 py-3">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">
                    {label}
                  </p>
                  <p className={cn("text-xl font-extrabold mt-1 tabular-nums", accent)}>
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
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher par n°, magasin, fournisseur ou utilisateur…"
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
              <Select value={statut} onValueChange={setStatut}>
                <SelectTrigger className="h-9 w-[150px] text-xs bg-gray-50 border-gray-200 rounded-lg">
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="BROUILLON">Brouillon</SelectItem>
                  <SelectItem value="VALIDE">Validé</SelectItem>
                </SelectContent>
              </Select>

              <Select value={magasin} onValueChange={setMagasin}>
                <SelectTrigger className="h-9 w-[180px] text-xs bg-gray-50 border-gray-200 rounded-lg">
                  <Filter className="h-3.5 w-3.5 mr-1.5 text-gray-400" />
                  <SelectValue placeholder="Magasin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les magasins</SelectItem>
                  {magasins.map((m) => (
                    <SelectItem key={m} value={m}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

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
          {filtered.length === 0
            ? "Aucun résultat"
            : `${filtered.length} réception${filtered.length > 1 ? "s" : ""}${hasFilters ? " (filtrées)" : ""}`}
        </p>
      </div>

      <Card className="border border-gray-100 shadow-sm rounded-2xl overflow-hidden bg-white">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50/80 hover:bg-gray-50/80 border-b border-gray-100">
                <TableHead className="pl-4 text-[11px] font-bold text-gray-500 uppercase tracking-wide">
                  N°
                </TableHead>
                <TableHead className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">
                  Statut
                </TableHead>
                <TableHead className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">
                  Magasin
                </TableHead>
                <TableHead className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">
                  Fournisseur
                </TableHead>
                <TableHead className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">
                  Réception
                </TableHead>
                <TableHead className="text-center text-[11px] font-bold text-gray-500 uppercase tracking-wide">
                  Lignes
                </TableHead>
                <TableHead className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">
                  Enregistré par
                </TableHead>
                <TableHead className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">
                  Créé le
                </TableHead>
                <TableHead className="w-[90px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="h-52 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="h-14 w-14 rounded-2xl bg-gray-50 flex items-center justify-center">
                        <Truck className="h-7 w-7 text-gray-300" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-600">
                          {hasFilters
                            ? "Aucune réception ne correspond"
                            : "Aucune réception enregistrée"}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {hasFilters
                            ? "Essayez d'autres filtres."
                            : "Créez une réception pour entrer du stock avec lots."}
                        </p>
                      </div>
                      {hasFilters ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={resetFilters}
                          className="gap-1.5 text-xs"
                        >
                          <X className="h-3.5 w-3.5" /> Effacer les filtres
                        </Button>
                      ) : (
                        <Button
                          asChild
                          size="sm"
                          className="gap-1.5 rounded-lg bg-[#cd3b86] hover:bg-[#b8307a] text-white"
                        >
                          <Link href="/pharmacie/approvisionnements/nouveau">
                            <Plus className="h-3.5 w-3.5" />
                            Nouvelle réception
                          </Link>
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((r, i) => (
                  <TableRow
                    key={r.id}
                    className={cn(
                      "hover:bg-[#cd3b86]/3 transition-colors border-b border-gray-50",
                      i % 2 !== 0 && "bg-gray-50/30",
                    )}
                  >
                    <TableCell className="pl-4">
                      <Link
                        href={`/pharmacie/approvisionnements/${r.id}`}
                        className="font-semibold text-sm text-[#cd3b86] hover:underline"
                      >
                        {r.numero}
                      </Link>
                    </TableCell>
                    <TableCell>
                      {r.statut === "VALIDE" ? (
                        <Badge
                          variant="secondary"
                          className="font-medium bg-emerald-100 text-emerald-800"
                        >
                          Validé
                        </Badge>
                      ) : (
                        <Badge
                          variant="secondary"
                          className="font-medium bg-amber-100 text-amber-800"
                        >
                          Brouillon
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-sm text-gray-800">
                        <Warehouse className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                        {r.magasinNom}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-gray-700">
                      {r.fournisseurNom ?? (
                        <span className="text-gray-400">Sans fournisseur</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-gray-600 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-gray-400" />
                        {formatDate(r.dateReception)}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant="secondary"
                        className="font-medium bg-[#cd3b86]/10 text-[#cd3b86] tabular-nums"
                      >
                        {r.nbLignes}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      <span className="inline-flex items-center gap-1.5">
                        <User className="h-3.5 w-3.5 text-gray-400" />
                        {r.userNom}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-gray-500 whitespace-nowrap">
                      {r.createdAt ? formatDateTime(r.createdAt) : "—"}
                    </TableCell>
                    <TableCell>
                      <Button
                        asChild
                        variant="ghost"
                        size="sm"
                        className="h-7 gap-1 text-xs text-gray-400 hover:text-gray-600 px-2"
                      >
                        <Link href={`/pharmacie/approvisionnements/${r.id}`}>
                          <Eye className="h-3.5 w-3.5" />
                          Voir
                        </Link>
                      </Button>
                    </TableCell>
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
