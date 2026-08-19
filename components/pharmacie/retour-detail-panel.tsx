"use client"

import * as React from "react"
import Link from "next/link"
import { Loader2, Package, RotateCcw, User, Wallet } from "lucide-react"
import { getRetour } from "@/app/actions/pharmacie-retour"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { formatCurrency, formatDate, formatDateTime } from "@/lib/formatting"
import { cn } from "@/lib/utils"
import type { RetourPharmacieDetail } from "@/lib/types/pharmacie-retour"

export function RetourDetailContent({
  detail,
  compact = false,
}: {
  detail: RetourPharmacieDetail
  compact?: boolean
}) {
  const totalQty = detail.lignes.reduce((s, l) => s + l.quantite, 0)

  return (
    <div className="space-y-4">
      {!compact && (
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-[#cd3b86]">{detail.numero}</h3>
            <p className="text-sm text-gray-500">
              {detail.createdAt ? formatDateTime(detail.createdAt) : "—"} · par{" "}
              {detail.userNom}
            </p>
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-gray-600">
        <span className="inline-flex items-center gap-1.5">
          <User className="h-3.5 w-3.5 text-gray-400" />
          {detail.patientLabel ?? `Patient #${detail.patientId}`}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Package className="h-3.5 w-3.5 text-gray-400" />
          {detail.pharmacieNom}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <RotateCcw className="h-3.5 w-3.5 text-gray-400" />
          Sortie{" "}
          <Link
            href={`/pharmacie/sorties/${detail.sortieId}`}
            className="font-medium text-[#cd3b86] hover:underline"
          >
            {detail.sortieNumero}
          </Link>
        </span>
        <span className="inline-flex items-center gap-1.5 font-semibold text-emerald-700">
          <Wallet className="h-3.5 w-3.5" />
          Avoir {formatCurrency(detail.montantAvoir)}
        </span>
      </div>

      {detail.motif && (
        <p className="rounded-xl border border-gray-100 bg-gray-50/80 px-3 py-2 text-sm text-gray-600">
          <span className="font-medium text-gray-700">Motif :</span> {detail.motif}
        </p>
      )}

      {detail.lignes.length === 0 ? (
        <p className="py-4 text-center text-sm text-gray-500">Aucune ligne enregistrée.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-100">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50/80 hover:bg-gray-50/80">
                <TableHead className="pl-4">Produit</TableHead>
                <TableHead className="text-center">Qté retournée</TableHead>
                <TableHead>N° lot</TableHead>
                <TableHead>Péremption</TableHead>
                <TableHead className="text-right pr-4">P.U. patient</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {detail.lignes.map((l) => (
                <TableRow key={l.id}>
                  <TableCell className="pl-4">
                    <p className="font-medium text-gray-900">{l.produitNom}</p>
                    {l.produitDosage && (
                      <p className="text-xs text-gray-400">{l.produitDosage}</p>
                    )}
                  </TableCell>
                  <TableCell className="text-center font-semibold tabular-nums text-[#cd3b86]">
                    {l.quantite}
                  </TableCell>
                  <TableCell className="font-mono text-xs">{l.numeroLot}</TableCell>
                  <TableCell className="text-sm text-gray-600">
                    {formatDate(l.datePeremption)}
                  </TableCell>
                  <TableCell className="text-right pr-4 text-sm tabular-nums">
                    {formatCurrency(l.montantUnitaire)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-gray-100 pt-3 text-sm">
        <span className="text-gray-500">
          {detail.lignes.length} ligne{detail.lignes.length > 1 ? "s" : ""} · {totalQty} unité
          {totalQty > 1 ? "s" : ""} retournée{totalQty > 1 ? "s" : ""}
        </span>
        {compact && (
          <Button asChild variant="ghost" size="sm" className="h-8 text-xs text-[#cd3b86]">
            <Link href={`/pharmacie/sorties/${detail.sortieId}`}>Voir la sortie</Link>
          </Button>
        )}
      </div>
    </div>
  )
}

export function RetourDetailPanel({
  retourId,
  compact = false,
}: {
  retourId: string
  compact?: boolean
}) {
  const [detail, setDetail] = React.useState<RetourPharmacieDetail | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    void getRetour(retourId)
      .then((data) => {
        if (cancelled) return
        if (!data) setError("Retour introuvable.")
        else setDetail(data)
      })
      .catch((e) => {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Erreur de chargement")
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [retourId])

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-8 text-sm text-gray-500">
        <Loader2 className="h-4 w-4 animate-spin text-[#cd3b86]" />
        Chargement du détail…
      </div>
    )
  }

  if (error || !detail) {
    return (
      <p className="py-6 text-center text-sm text-red-600">{error ?? "Retour introuvable."}</p>
    )
  }

  return (
    <div className={cn(compact && "px-4 py-4")}>
      <RetourDetailContent detail={detail} compact={compact} />
    </div>
  )
}
