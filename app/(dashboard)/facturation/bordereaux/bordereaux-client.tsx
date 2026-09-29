"use client"

import * as React from "react"
import Link from "next/link"
import {
  Building2,
  CheckCircle2,
  Eye,
  FileStack,
  Filter,
  Plus,
  Search,
  Send,
  X,
} from "lucide-react"
import { FacturationTabs } from "@/components/shared/facturation-tabs"
import { BordereauStatusBadge } from "@/components/shared/bordereau-status-badge"
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
import type { BordereauListRow } from "@/lib/types/bordereau"

export function BordereauxClient({
  bordereaux,
  assureurs,
}: {
  bordereaux: BordereauListRow[]
  assureurs: { id: string; nom: string; code: string | null }[]
}) {
  const [searchQuery, setSearchQuery] = React.useState("")
  const [statut, setStatut] = React.useState("all")
  const [assuranceId, setAssuranceId] = React.useState("all")

  const stats = React.useMemo(
    () => ({
      total: bordereaux.length,
      brouillons: bordereaux.filter((b) => b.statut === "BROUILLON").length,
      deposes: bordereaux.filter(
        (b) => b.statut === "DEPOSE" || b.statut === "PARTIEL",
      ).length,
      payes: bordereaux.filter((b) => b.statut === "PAYE").length,
      montantDepose: bordereaux
        .filter((b) => b.statut === "DEPOSE" || b.statut === "PARTIEL")
        .reduce((s, b) => s + b.montantTotal, 0),
    }),
    [bordereaux],
  )

  const filtered = React.useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    return bordereaux.filter((b) => {
      const matchStatut = statut === "all" || b.statut === statut
      const matchAss = assuranceId === "all" || b.assuranceId === assuranceId
      const matchSearch =
        q === "" ||
        b.numero.toLowerCase().includes(q) ||
        b.assuranceNom.toLowerCase().includes(q)
      return matchStatut && matchAss && matchSearch
    })
  }, [bordereaux, searchQuery, statut, assuranceId])

  const hasFilters = searchQuery !== "" || statut !== "all" || assuranceId !== "all"
  const activeCount =
    (searchQuery !== "" ? 1 : 0) + (statut !== "all" ? 1 : 0) + (assuranceId !== "all" ? 1 : 0)
  const montantAffiche = filtered.reduce((s, b) => s + b.montantTotal, 0)

  function resetFilters() {
    setSearchQuery("")
    setStatut("all")
    setAssuranceId("all")
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">Facturation</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Regroupement des parts assureur impayées pour dépôt et suivi des virements.
          </p>
        </div>
        <Button
          asChild
          className="gap-2 bg-gradient-to-r from-[#cd3b86] to-[#b8307a] hover:from-[#b8307a] hover:to-[#9b2563] text-white shadow-sm"
        >
          <Link href="/facturation/bordereaux/nouveau">
            <Plus className="h-4 w-4" />
            Nouveau bordereau
          </Link>
        </Button>
      </div>

      <FacturationTabs />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Total", value: String(stats.total), icon: FileStack },
          { label: "Brouillons", value: String(stats.brouillons), icon: Building2 },
          { label: "Déposés", value: String(stats.deposes), icon: Send },
          {
            label: "À encaisser",
            value: formatCurrency(stats.montantDepose),
            icon: CheckCircle2,
          },
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
        <div className="flex flex-col gap-3 border-b border-gray-100 px-4 py-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher par n° bordereau ou assureur…"
              className="pl-9 rounded-lg"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Select value={assuranceId} onValueChange={setAssuranceId}>
              <SelectTrigger className="w-[180px] rounded-lg">
                <SelectValue placeholder="Assureur" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les assureurs</SelectItem>
                {assureurs.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.nom}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statut} onValueChange={setStatut}>
              <SelectTrigger className="w-[150px] rounded-lg">
                <Filter className="h-3.5 w-3.5 mr-1.5 text-gray-400" />
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous statuts</SelectItem>
                <SelectItem value="BROUILLON">Brouillon</SelectItem>
                <SelectItem value="PARTIEL">Partiel</SelectItem>
                <SelectItem value="DEPOSE">Déposé</SelectItem>
                <SelectItem value="PAYE">Payé</SelectItem>
              </SelectContent>
            </Select>
            {hasFilters && (
              <Button variant="ghost" size="sm" onClick={resetFilters} className="gap-1">
                <X className="h-3.5 w-3.5" />
                Effacer ({activeCount})
              </Button>
            )}
          </div>
        </div>

        <div className="px-4 py-2 text-xs text-gray-500 border-b border-gray-50 bg-gray-50/40">
          {filtered.length} bordereau{filtered.length > 1 ? "x" : ""} · Total{" "}
          <strong className="text-gray-700">{formatCurrency(montantAffiche)}</strong>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50/80 hover:bg-gray-50/80">
                <TableHead className="pl-4">N° bordereau</TableHead>
                <TableHead>Assureur</TableHead>
                <TableHead className="text-center">Factures</TableHead>
                <TableHead className="text-right">Montant</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Dépôt</TableHead>
                <TableHead className="pr-4 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-10 text-center text-sm text-gray-500">
                    Aucun bordereau trouvé.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((b, i) => (
                  <TableRow
                    key={b.id}
                    className={cn(
                      "border-b border-gray-50 hover:bg-[#cd3b86]/3",
                      i % 2 !== 0 && "bg-gray-50/30",
                    )}
                  >
                    <TableCell className="pl-4 font-semibold text-sm text-gray-800">
                      {b.numero}
                    </TableCell>
                    <TableCell className="text-sm text-gray-700">{b.assuranceNom}</TableCell>
                    <TableCell className="text-center tabular-nums text-sm">{b.nbFactures}</TableCell>
                    <TableCell className="text-right font-medium tabular-nums text-sm">
                      {formatCurrency(b.montantTotal)}
                    </TableCell>
                    <TableCell>
                      <BordereauStatusBadge status={b.statut} />
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {b.dateDepot ? formatDate(b.dateDepot) : "—"}
                    </TableCell>
                    <TableCell className="pr-4 text-right">
                      <Button asChild variant="ghost" size="sm" className="gap-1.5">
                        <Link href={`/facturation/bordereaux/${b.id}`}>
                          <Eye className="h-4 w-4" />
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
