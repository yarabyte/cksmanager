"use client"

import * as React from "react"
import Link from "next/link"
import { Eye, FileText, Printer, Search, X } from "lucide-react"
import { FacturationTabs } from "@/components/shared/facturation-tabs"
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
import { formatCurrency, formatDate } from "@/lib/formatting"
import { cn } from "@/lib/utils"
import type { AvoirFeuilleListRow } from "@/lib/types/avoir-feuille"

const NATURE_LABEL = {
  SOLDE: "Solde",
  EXONERATION: "Exonération",
} as const

export function AvoirsClient({
  avoirs,
  showBordereaux,
}: {
  avoirs: AvoirFeuilleListRow[]
  showBordereaux: boolean
}) {
  const [searchQuery, setSearchQuery] = React.useState("")
  const [statut, setStatut] = React.useState("all")
  const [nature, setNature] = React.useState("all")

  const stats = React.useMemo(
    () => ({
      total: avoirs.length,
      actifs: avoirs.filter((a) => a.statut === "ACTIF").length,
      montantActif: avoirs
        .filter((a) => a.statut === "ACTIF")
        .reduce((s, a) => s + a.montant, 0),
    }),
    [avoirs],
  )

  const filtered = React.useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    return avoirs.filter((a) => {
      const matchStatut = statut === "all" || a.statut === statut
      const matchNature = nature === "all" || a.nature === nature
      const matchSearch =
        q === "" ||
        a.numero.toLowerCase().includes(q) ||
        a.feuilleNumero.toLowerCase().includes(q) ||
        (a.patientLabel ?? "").toLowerCase().includes(q) ||
        a.motif.toLowerCase().includes(q)
      return matchStatut && matchNature && matchSearch
    })
  }, [avoirs, searchQuery, statut, nature])

  const hasFilters = searchQuery !== "" || statut !== "all" || nature !== "all"
  const activeCount =
    (searchQuery !== "" ? 1 : 0) + (statut !== "all" ? 1 : 0) + (nature !== "all" ? 1 : 0)
  const montantAffiche = filtered
    .filter((a) => a.statut === "ACTIF")
    .reduce((s, a) => s + a.montant, 0)

  function resetFilters() {
    setSearchQuery("")
    setStatut("all")
    setNature("all")
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">Facturation</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Avoirs de feuilles de circulation : soldes manuels et exonérations de la part patient.
        </p>
      </div>

      <FacturationTabs showBordereaux={showBordereaux} />

      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { label: "Total", value: String(stats.total), icon: FileText },
          { label: "Actifs", value: String(stats.actifs), icon: FileText },
          { label: "Montant actif", value: formatCurrency(stats.montantActif), icon: FileText },
        ].map(({ label, value, icon: Icon }) => (
          <Card key={label} className="border border-gray-100 shadow-sm rounded-2xl bg-white">
            <CardContent className="px-4 py-3">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">
                    {label}
                  </p>
                  <p className="text-xl font-extrabold mt-1 tabular-nums text-gray-900">{value}</p>
                </div>
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#cd3b86]/8 text-[#cd3b86]">
                  <Icon className="h-4 w-4" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border border-gray-100 shadow-sm rounded-2xl overflow-hidden bg-white">
        <div className="flex flex-col gap-3 border-b border-gray-100 px-4 py-3 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher par n° avoir, feuille, patient ou motif…"
              className="pl-9 rounded-lg"
            />
          </div>
          <Select value={nature} onValueChange={setNature}>
            <SelectTrigger className="w-full lg:w-44">
              <SelectValue placeholder="Nature" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les natures</SelectItem>
              <SelectItem value="SOLDE">Solde</SelectItem>
              <SelectItem value="EXONERATION">Exonération</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statut} onValueChange={setStatut}>
            <SelectTrigger className="w-full lg:w-40">
              <SelectValue placeholder="Statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              <SelectItem value="ACTIF">Actif</SelectItem>
              <SelectItem value="ANNULE">Annulé</SelectItem>
            </SelectContent>
          </Select>
          {hasFilters && (
            <Button variant="ghost" size="sm" onClick={resetFilters} className="gap-1">
              <X className="h-3.5 w-3.5" />
              Effacer ({activeCount})
            </Button>
          )}
        </div>

        <div className="px-4 py-2 text-xs text-gray-500 border-b border-gray-50 bg-gray-50/40">
          {filtered.length} avoir{filtered.length > 1 ? "s" : ""} · Actifs{" "}
          <strong className="text-gray-700">{formatCurrency(montantAffiche)}</strong>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50/80 hover:bg-gray-50/80">
                <TableHead className="pl-4">N° avoir</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Patient</TableHead>
                <TableHead>Feuille</TableHead>
                <TableHead>Nature</TableHead>
                <TableHead className="text-right">Montant</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="pr-4 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="py-10 text-center text-sm text-gray-500">
                    Aucun avoir trouvé.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((a, i) => {
                  const printHref =
                    a.nature === "EXONERATION"
                      ? `/feuilles-circulation/${a.feuilleId}/avoir/imprimer?nature=EXONERATION`
                      : `/feuilles-circulation/${a.feuilleId}/avoir/imprimer`
                  return (
                    <TableRow
                      key={a.id}
                      className={cn(
                        "border-b border-gray-50 hover:bg-[#cd3b86]/3",
                        i % 2 !== 0 && "bg-gray-50/30",
                      )}
                    >
                      <TableCell className="pl-4 font-semibold text-sm text-gray-800">
                        {a.numero}
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {a.createdAt ? formatDate(a.createdAt) : "—"}
                      </TableCell>
                      <TableCell className="text-sm text-gray-700">
                        {a.patientLabel ?? "—"}
                      </TableCell>
                      <TableCell className="font-mono text-sm text-gray-700">
                        {a.feuilleNumero}
                      </TableCell>
                      <TableCell className="text-sm text-gray-700">
                        {NATURE_LABEL[a.nature]}
                      </TableCell>
                      <TableCell className="text-right font-medium tabular-nums text-sm">
                        {formatCurrency(a.montant)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={cn(
                            a.statut === "ACTIF"
                              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                              : "border-gray-200 bg-gray-50 text-gray-500",
                          )}
                        >
                          {a.statut === "ACTIF" ? "Actif" : "Annulé"}
                        </Badge>
                      </TableCell>
                      <TableCell className="pr-4 text-right">
                        <div className="flex justify-end gap-1">
                          <Button asChild variant="ghost" size="sm" className="gap-1.5">
                            <Link href={`/feuilles-circulation/${a.feuilleId}`}>
                              <Eye className="h-4 w-4" />
                              Feuille
                            </Link>
                          </Button>
                          {a.statut === "ACTIF" && (
                            <Button asChild variant="ghost" size="sm" className="gap-1.5">
                              <Link href={printHref}>
                                <Printer className="h-4 w-4" />
                                Imprimer
                              </Link>
                            </Button>
                          )}
                        </div>
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
