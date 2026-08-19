"use client"

import * as React from "react"
import Link from "next/link"
import {
  ChevronDown,
  ChevronRight,
  Clock,
  Package,
  Plus,
  RotateCcw,
  Search,
  User,
  Wallet,
} from "lucide-react"
import { RetourDetailPanel } from "@/components/pharmacie/retour-detail-panel"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { formatCurrency, formatDateTime } from "@/lib/formatting"
import { cn } from "@/lib/utils"
import type { RetourPharmacieRow } from "@/lib/types/pharmacie-retour"

function isToday(iso: string | null) {
  if (!iso) return false
  const d = new Date(iso)
  const now = new Date()
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  )
}

function RetourCard({ row }: { row: RetourPharmacieRow }) {
  const [open, setOpen] = React.useState(false)

  return (
    <Card
      className={cn(
        "border border-gray-100 border-l-4 border-l-emerald-400 shadow-[0_2px_12px_rgba(0,0,0,0.06)] rounded-2xl overflow-hidden bg-white transition-shadow hover:shadow-[0_4px_20px_rgba(0,0,0,0.08)]",
      )}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full text-left px-5 py-4 hover:bg-gray-50/60 transition-colors"
      >
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#cd3b86]/10 text-[#cd3b86]">
            <RotateCcw className="h-4 w-4" />
          </div>

          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-bold text-gray-900">{row.numero}</span>
              <Badge
                variant="outline"
                className="rounded-md border-emerald-200 bg-emerald-50 text-[10px] font-semibold text-emerald-700"
              >
                <Wallet className="mr-1 h-3 w-3 inline" />
                {formatCurrency(row.montantAvoir)}
              </Badge>
              <Badge
                variant="secondary"
                className="rounded-md bg-gray-100 text-gray-700 text-[10px] font-semibold"
              >
                {row.nbLignes} ligne{row.nbLignes > 1 ? "s" : ""}
              </Badge>
            </div>

            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500">
              <span className="inline-flex items-center gap-1.5">
                <User className="h-3.5 w-3.5 text-gray-400" />
                {row.patientLabel ?? `Patient #${row.patientId}`}
              </span>
              <span>
                Sortie{" "}
                <Link
                  href={`/pharmacie/sorties/${row.sortieId}`}
                  className="font-medium text-[#cd3b86] hover:underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  {row.sortieNumero}
                </Link>
              </span>
              <span>{row.pharmacieNom}</span>
              <span>Par {row.userNom}</span>
              {row.createdAt && (
                <span className="inline-flex items-center gap-1 text-gray-400">
                  <Clock className="h-3 w-3" />
                  {formatDateTime(row.createdAt)}
                </span>
              )}
            </div>

            {row.motif && (
              <p className="text-xs text-gray-400 line-clamp-2">
                <span className="font-medium text-gray-500">Motif :</span> {row.motif}
              </p>
            )}
          </div>

          <span className="shrink-0 text-gray-400">
            {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </span>
        </div>
      </button>

      {open && (
        <CardContent className="border-t border-gray-100 p-0">
          <RetourDetailPanel retourId={row.id} compact />
        </CardContent>
      )}
    </Card>
  )
}

export function RetoursClient({ initial }: { initial: RetourPharmacieRow[] }) {
  const [rows] = React.useState(initial)
  const [search, setSearch] = React.useState("")

  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return rows
    return rows.filter(
      (r) =>
        r.numero.toLowerCase().includes(q) ||
        r.sortieNumero.toLowerCase().includes(q) ||
        r.pharmacieNom.toLowerCase().includes(q) ||
        r.userNom.toLowerCase().includes(q) ||
        (r.patientLabel?.toLowerCase().includes(q) ?? false) ||
        (r.motif?.toLowerCase().includes(q) ?? false),
    )
  }, [rows, search])

  const kpis = React.useMemo(() => {
    const totalAvoir = filtered.reduce((s, r) => s + r.montantAvoir, 0)
    const todayCount = filtered.filter((r) => isToday(r.createdAt)).length
    const totalLignes = filtered.reduce((s, r) => s + r.nbLignes, 0)
    return [
      {
        label: "Retours",
        value: filtered.length.toString(),
        icon: RotateCcw,
        accent: "text-[#cd3b86]",
        bg: "bg-[#cd3b86]/10",
      },
      {
        label: "Avoir total",
        value: formatCurrency(totalAvoir),
        icon: Wallet,
        accent: "text-emerald-700",
        bg: "bg-emerald-50",
      },
      {
        label: "Aujourd'hui",
        value: todayCount.toString(),
        icon: Package,
        accent: "text-sky-700",
        bg: "bg-sky-50",
      },
      {
        label: "Lignes retournées",
        value: totalLignes.toString(),
        icon: Package,
        accent: "text-amber-700",
        bg: "bg-amber-50",
      },
    ]
  }, [filtered])

  return (
    <div className="space-y-5 pb-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">
            Retours patients
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Réintégration stock et crédit portefeuille patient
          </p>
        </div>
        <Button
          asChild
          className="gap-1.5 rounded-lg bg-gradient-to-r from-[#cd3b86] to-[#b8307a] hover:from-[#b8307a] hover:to-[#9b2563] text-white shadow-sm"
        >
          <Link href="/pharmacie/retours/nouveau">
            <Plus className="h-4 w-4" />
            Nouveau retour
          </Link>
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map(({ label, value, icon: Icon, accent, bg }) => (
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
                  <p className={cn("text-xl font-extrabold mt-1 tabular-nums truncate", accent)}>
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

      <Card className="border border-gray-100 shadow-sm rounded-2xl">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="N° retour, sortie, patient, pharmacie, motif…"
              className="rounded-xl pl-9"
            />
          </div>
        </CardContent>
      </Card>

      {filtered.length === 0 ? (
        <Card className="border border-dashed border-gray-200 rounded-2xl">
          <CardContent className="py-16 text-center text-gray-500">
            <RotateCcw className="mx-auto h-10 w-10 mb-3 opacity-40" />
            <p className="font-medium text-gray-700">
              {search ? "Aucun retour trouvé" : "Aucun retour enregistré"}
            </p>
            <p className="mt-1 text-sm">
              {search
                ? "Essayez une autre recherche."
                : "Les retours de produits apparaîtront ici après enregistrement."}
            </p>
            {!search && (
              <Button
                asChild
                size="sm"
                className="mt-4 gap-1.5 rounded-lg bg-[#cd3b86] hover:bg-[#b8307a] text-white"
              >
                <Link href="/pharmacie/retours/nouveau">
                  <Plus className="h-3.5 w-3.5" />
                  Nouveau retour
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          <p className="text-xs text-gray-500">
            {filtered.length} retour{filtered.length > 1 ? "s" : ""}
            {search && " (filtrés)"}
          </p>
          {filtered.map((row) => (
            <RetourCard key={row.id} row={row} />
          ))}
        </div>
      )}
    </div>
  )
}
