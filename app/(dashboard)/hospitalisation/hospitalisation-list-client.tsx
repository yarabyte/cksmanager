"use client"

import * as React from "react"
import Link from "next/link"
import {
  BedDouble,
  CheckCircle2,
  Eye,
  LogOut,
  Plus,
  ScrollText,
  Search,
  UserRound,
  X,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { formatDate } from "@/lib/formatting"
import { cn } from "@/lib/utils"
import type { HospitalisationListRow } from "@/lib/types/hospitalisation"

function StatutBadge({ statut }: { statut: string }) {
  if (statut === "EN_COURS") {
    return (
      <Badge className="bg-sky-100 text-sky-800 hover:bg-sky-100 font-medium gap-1">
        <span className="h-1.5 w-1.5 rounded-full bg-sky-500 animate-pulse" />
        En cours
      </Badge>
    )
  }
  return (
    <Badge className="bg-gray-100 text-gray-700 hover:bg-gray-100 font-medium">
      Sorti
    </Badge>
  )
}

function initials(label: string | null, patientId: string) {
  if (!label) return patientId.slice(-2)
  const parts = label.trim().split(/\s+/).filter(Boolean)
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
  return label.slice(0, 2).toUpperCase()
}

function daysSince(iso: string) {
  const start = new Date(iso)
  const today = new Date()
  const a = Date.UTC(start.getFullYear(), start.getMonth(), start.getDate())
  const b = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate())
  return Math.max(0, Math.round((b - a) / 86_400_000))
}

const FILTERS = [
  { value: "EN_COURS", label: "En cours" },
  { value: "SORTI", label: "Sortis" },
  { value: "all", label: "Tous" },
] as const

export function HospitalisationListClient({
  initialRows,
}: {
  initialRows: HospitalisationListRow[]
}) {
  const [searchQuery, setSearchQuery] = React.useState("")
  const [statut, setStatut] = React.useState("EN_COURS")

  const stats = React.useMemo(() => {
    const enCours = initialRows.filter((h) => h.statut === "EN_COURS")
    const sortis = initialRows.filter((h) => h.statut === "SORTI")
    return {
      total: initialRows.length,
      enCours: enCours.length,
      sortis: sortis.length,
      feuillesEnCours: enCours.reduce((s, h) => s + h.nbFeuilles, 0),
    }
  }, [initialRows])

  const filtered = React.useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    return initialRows.filter((h) => {
      const matchStatut = statut === "all" || h.statut === statut
      const matchSearch =
        q === "" ||
        (h.patientLabel?.toLowerCase().includes(q) ?? false) ||
        h.patientId.includes(q) ||
        (h.medecinNom?.toLowerCase().includes(q) ?? false)
      return matchStatut && matchSearch
    })
  }, [initialRows, searchQuery, statut])

  const hasFilters = searchQuery !== "" || statut !== "EN_COURS"

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">
            Hospitalisation
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Suivi des séjours — admissions liées à une visite.
          </p>
        </div>
        <Button
          asChild
          className="gap-2 bg-gradient-to-r from-[#cd3b86] to-[#b8307a] hover:from-[#b8307a] hover:to-[#9b2563] text-white shadow-sm"
        >
          <Link href="/hospitalisation/nouvelle">
            <Plus className="h-4 w-4" />
            Nouvelle admission
          </Link>
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          {
            label: "En cours",
            value: String(stats.enCours),
            icon: BedDouble,
            hint: "séjours actifs",
          },
          {
            label: "Sortis",
            value: String(stats.sortis),
            icon: LogOut,
            hint: "séjours clôturés",
          },
          {
            label: "Total",
            value: String(stats.total),
            icon: CheckCircle2,
            hint: "admissions",
          },
          {
            label: "Feuilles (en cours)",
            value: String(stats.feuillesEnCours),
            icon: ScrollText,
            hint: "sur séjours actifs",
          },
        ].map(({ label, value, icon: Icon, hint }) => (
          <Card
            key={label}
            className="border border-gray-100 shadow-sm rounded-2xl bg-white overflow-hidden"
          >
            <CardContent className="px-4 py-3.5">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">
                    {label}
                  </p>
                  <p className="text-2xl font-extrabold text-gray-900 mt-1 tabular-nums">
                    {value}
                  </p>
                  <p className="text-[11px] text-gray-400 mt-0.5">{hint}</p>
                </div>
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#cd3b86]/10 text-[#cd3b86]">
                  <Icon className="h-4 w-4" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border border-gray-100 shadow-sm rounded-2xl overflow-hidden bg-white">
        <div className="flex flex-col gap-3 border-b border-gray-100 px-4 py-3">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher patient ou médecin…"
                className="pl-9 rounded-lg bg-gray-50 border-gray-200 h-9"
              />
              {searchQuery ? (
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  onClick={() => setSearchQuery("")}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              ) : null}
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              {FILTERS.map((f) => (
                <button
                  key={f.value}
                  type="button"
                  onClick={() => setStatut(f.value)}
                  className={cn(
                    "h-8 rounded-lg px-3 text-xs font-semibold transition-colors",
                    statut === f.value
                      ? "bg-[#cd3b86] text-white shadow-sm"
                      : "bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-100",
                  )}
                >
                  {f.label}
                  {f.value === "EN_COURS" ? (
                    <span className="ml-1.5 tabular-nums opacity-80">{stats.enCours}</span>
                  ) : null}
                </button>
              ))}
              {hasFilters ? (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 text-xs text-gray-500"
                  onClick={() => {
                    setSearchQuery("")
                    setStatut("EN_COURS")
                  }}
                >
                  Réinitialiser
                </Button>
              ) : null}
            </div>
          </div>
          <p className="text-xs text-gray-400">
            {filtered.length} séjour{filtered.length > 1 ? "s" : ""}
            {hasFilters ? " (filtrés)" : ""}
          </p>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50/80 hover:bg-gray-50/80">
                <TableHead className="pl-4">Patient</TableHead>
                <TableHead>Médecin</TableHead>
                <TableHead>Entrée</TableHead>
                <TableHead>Séjour</TableHead>
                <TableHead className="text-center">Feuilles</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="pr-4 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-14 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-50 text-sky-500">
                        <BedDouble className="h-7 w-7" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-700">
                          Aucune hospitalisation
                        </p>
                        <p className="text-xs text-gray-400 mt-1 max-w-xs mx-auto">
                          {statut === "EN_COURS"
                            ? "Aucun patient hospitalisé pour le moment."
                            : "Aucun résultat pour ces filtres."}
                        </p>
                      </div>
                      {statut === "EN_COURS" && !searchQuery ? (
                        <Button
                          asChild
                          size="sm"
                          className="mt-1 gap-1.5 bg-[#cd3b86] hover:bg-[#b8307a] text-white"
                        >
                          <Link href="/hospitalisation/nouvelle">
                            <Plus className="h-3.5 w-3.5" />
                            Nouvelle admission
                          </Link>
                        </Button>
                      ) : null}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((h, i) => {
                  const jours = daysSince(h.dateEntree)
                  return (
                    <TableRow
                      key={h.id}
                      className={cn(
                        "border-b border-gray-50 hover:bg-[#cd3b86]/[0.04] transition-colors",
                        i % 2 !== 0 && "bg-gray-50/30",
                      )}
                    >
                      <TableCell className="pl-4 py-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#cd3b86]/15 to-[#cd3b86]/5 text-[11px] font-bold text-[#b8307a]">
                            {initials(h.patientLabel, h.patientId)}
                          </div>
                          <div className="min-w-0">
                            <Link
                              href={`/hospitalisation/${h.id}`}
                              className="font-semibold text-sm text-gray-800 hover:text-[#cd3b86] truncate block"
                            >
                              {h.patientLabel ?? `Patient #${h.patientId}`}
                            </Link>
                            <p className="text-[11px] text-gray-400 flex items-center gap-1 mt-0.5">
                              <UserRound className="h-3 w-3" />
                              #{h.patientId}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-gray-600 max-w-[160px] truncate">
                        {h.medecinNom ?? "—"}
                      </TableCell>
                      <TableCell className="text-sm text-gray-700 whitespace-nowrap">
                        {formatDate(h.dateEntree)}
                      </TableCell>
                      <TableCell className="text-sm text-gray-600 whitespace-nowrap">
                        {h.statut === "EN_COURS" ? (
                          <span className="tabular-nums">
                            {jours === 0
                              ? "Aujourd’hui"
                              : `${jours} jour${jours > 1 ? "s" : ""}`}
                          </span>
                        ) : h.dateSortie ? (
                          <span className="text-gray-500">
                            Sortie {formatDate(h.dateSortie)}
                          </span>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="inline-flex min-w-[1.75rem] justify-center rounded-md bg-gray-50 px-2 py-0.5 text-sm tabular-nums font-medium text-gray-700 border border-gray-100">
                          {h.nbFeuilles}
                        </span>
                      </TableCell>
                      <TableCell>
                        <StatutBadge statut={h.statut} />
                      </TableCell>
                      <TableCell className="pr-4 text-right">
                        <Button
                          asChild
                          variant="ghost"
                          size="sm"
                          className="gap-1.5 text-gray-500 hover:text-[#cd3b86]"
                        >
                          <Link href={`/hospitalisation/${h.id}`}>
                            <Eye className="h-4 w-4" />
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
