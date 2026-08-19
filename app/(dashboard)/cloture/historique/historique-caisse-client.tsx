"use client"

import * as React from "react"
import Link from "next/link"
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Eye,
  Filter,
  History,
  Lock,
  Search,
  Unlock,
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
import { formatCurrency, formatDateTime } from "@/lib/formatting"
import { cn } from "@/lib/utils"
import type { CaisseSessionHistoriqueRow } from "@/lib/types/caisse-session"

function StatutBadge({ statut }: { statut: "OUVERTE" | "FERMEE" }) {
  if (statut === "OUVERTE") {
    return (
      <Badge variant="secondary" className="font-medium bg-emerald-100 text-emerald-800">
        Ouverte
      </Badge>
    )
  }
  return (
    <Badge variant="secondary" className="font-medium bg-gray-100 text-gray-700">
      Fermée
    </Badge>
  )
}

export function HistoriqueCaisseClient({
  sessions,
}: {
  sessions: CaisseSessionHistoriqueRow[]
}) {
  const [searchQuery, setSearchQuery] = React.useState("")
  const [statut, setStatut] = React.useState("all")
  const [poste, setPoste] = React.useState("all")

  const postes = React.useMemo(() => {
    const set = new Set(sessions.map((s) => s.posteNom))
    return [...set].sort((a, b) => a.localeCompare(b, "fr"))
  }, [sessions])

  const stats = React.useMemo(() => {
    const ouvertes = sessions.filter((s) => s.statut === "OUVERTE").length
    const fermees = sessions.filter((s) => s.statut === "FERMEE").length
    const avecEcart = sessions.filter((s) => s.ecart != null && s.ecart !== 0).length
    return {
      total: sessions.length,
      ouvertes,
      fermees,
      avecEcart,
    }
  }, [sessions])

  const filtered = React.useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    return sessions.filter((s) => {
      const matchStatut = statut === "all" || s.statut === statut
      const matchPoste = poste === "all" || s.posteNom === poste
      const matchSearch =
        q === "" ||
        s.posteNom.toLowerCase().includes(q) ||
        s.caissierNom.toLowerCase().includes(q)
      return matchStatut && matchPoste && matchSearch
    })
  }, [sessions, searchQuery, statut, poste])

  const hasFilters = searchQuery !== "" || statut !== "all" || poste !== "all"
  const activeCount =
    (searchQuery !== "" ? 1 : 0) + (statut !== "all" ? 1 : 0) + (poste !== "all" ? 1 : 0)

  function resetFilters() {
    setSearchQuery("")
    setStatut("all")
    setPoste("all")
  }

  const kpis = [
    {
      label: "Total sessions",
      value: String(stats.total),
      icon: History,
      accent: "text-gray-900",
      bg: "bg-gray-100",
    },
    {
      label: "Ouvertes",
      value: String(stats.ouvertes),
      icon: Unlock,
      accent: "text-emerald-600",
      bg: "bg-emerald-50",
    },
    {
      label: "Fermées",
      value: String(stats.fermees),
      icon: Lock,
      accent: "text-gray-700",
      bg: "bg-gray-100",
    },
    {
      label: "Avec écart",
      value: String(stats.avecEcart),
      icon: AlertTriangle,
      accent: "text-amber-600",
      bg: "bg-amber-50",
    },
  ]

  return (
    <div className="space-y-5 pb-10">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link
            href="/cloture"
            className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 mb-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour à la clôture
          </Link>
          <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">
            Historique des caisses
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Sessions ouvertes et clôturées — détail et suivi des écarts.
          </p>
        </div>
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
                placeholder="Rechercher par poste ou caissier…"
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
              <Select value={poste} onValueChange={setPoste}>
                <SelectTrigger className="h-9 w-[160px] text-xs bg-gray-50 border-gray-200 rounded-lg">
                  <SelectValue placeholder="Poste" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les postes</SelectItem>
                  {postes.map((p) => (
                    <SelectItem key={p} value={p}>
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={statut} onValueChange={setStatut}>
                <SelectTrigger className="h-9 w-[150px] text-xs bg-gray-50 border-gray-200 rounded-lg">
                  <Filter className="h-3.5 w-3.5 mr-1.5 text-gray-400" />
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous statuts</SelectItem>
                  <SelectItem value="OUVERTE">Ouverte</SelectItem>
                  <SelectItem value="FERMEE">Fermée</SelectItem>
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
            : `${filtered.length} session${filtered.length > 1 ? "s" : ""}${hasFilters ? " (filtrées)" : ""}`}
        </p>
      </div>

      <Card className="border border-gray-100 shadow-sm rounded-2xl overflow-hidden bg-white">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50/80 hover:bg-gray-50/80 border-b border-gray-100">
                <TableHead className="pl-4 text-[11px] font-bold text-gray-500 uppercase tracking-wide">
                  Poste
                </TableHead>
                <TableHead className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">
                  Caissier
                </TableHead>
                <TableHead className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">
                  Ouverture
                </TableHead>
                <TableHead className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">
                  Clôture
                </TableHead>
                <TableHead className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">
                  Statut
                </TableHead>
                <TableHead className="text-right text-[11px] font-bold text-gray-500 uppercase tracking-wide">
                  Théorique
                </TableHead>
                <TableHead className="text-right text-[11px] font-bold text-gray-500 uppercase tracking-wide">
                  Réel
                </TableHead>
                <TableHead className="text-right text-[11px] font-bold text-gray-500 uppercase tracking-wide">
                  Écart
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
                        <History className="h-7 w-7 text-gray-300" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-600">
                          {hasFilters
                            ? "Aucune session ne correspond"
                            : "Aucune session enregistrée"}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {hasFilters
                            ? "Essayez d'autres filtres."
                            : "Les sessions apparaîtront après ouverture ou clôture."}
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
                filtered.map((s, i) => {
                  const hasEcart = s.ecart != null && s.ecart !== 0
                  return (
                    <TableRow
                      key={s.id}
                      className={cn(
                        "hover:bg-[#cd3b86]/3 transition-colors border-b border-gray-50",
                        i % 2 !== 0 && "bg-gray-50/30",
                      )}
                    >
                      <TableCell className="pl-4 font-semibold text-sm text-gray-800">
                        {s.posteNom}
                      </TableCell>
                      <TableCell className="text-sm text-gray-700">{s.caissierNom}</TableCell>
                      <TableCell className="text-sm text-gray-500 whitespace-nowrap">
                        {formatDateTime(s.openedAt)}
                      </TableCell>
                      <TableCell className="text-sm text-gray-500 whitespace-nowrap">
                        {s.closedAt ? formatDateTime(s.closedAt) : "—"}
                      </TableCell>
                      <TableCell>
                        <StatutBadge statut={s.statut} />
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-sm text-gray-700">
                        {s.soldeTheoriqueCloture != null
                          ? formatCurrency(s.soldeTheoriqueCloture)
                          : "—"}
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-sm text-gray-700">
                        {s.soldeReelCloture != null
                          ? formatCurrency(s.soldeReelCloture)
                          : "—"}
                      </TableCell>
                      <TableCell
                        className={cn(
                          "text-right tabular-nums text-sm font-medium",
                          hasEcart ? "text-amber-700" : "text-gray-500",
                        )}
                      >
                        {s.ecart != null ? (
                          <span className="inline-flex items-center gap-1 justify-end">
                            {hasEcart ? (
                              <AlertTriangle className="h-3.5 w-3.5" />
                            ) : (
                              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                            )}
                            {formatCurrency(s.ecart)}
                          </span>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          asChild
                          variant="ghost"
                          size="sm"
                          className="h-7 gap-1 text-xs text-gray-400 hover:text-gray-600 px-2"
                        >
                          <Link href={`/cloture/historique/${s.id}`}>
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
        </div>
      </Card>
    </div>
  )
}
