"use client"

import Link from "next/link"
import {
  ArrowLeft,
  ArrowLeftRight,
  Calendar,
  Download,
  Package,
  User,
  Warehouse,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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

type TransfertDetail = {
  id: string
  numero: string
  magasinSourceNom: string
  magasinDestNom: string
  userNom: string
  statut: string
  note: string | null
  createdAt: string | null
  lignes: {
    id: string
    produitNom: string
    produitDosage: string
    numeroLot: string
    datePeremption: string
    quantite: number
  }[]
}

export function TransfertDetailClient({ transfert }: { transfert: TransfertDetail }) {
  const totalQte = transfert.lignes.reduce((s, l) => s + l.quantite, 0)

  return (
    <div className="space-y-5 pb-10">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link
            href="/pharmacie/transferts"
            className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 mb-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour aux transferts
          </Link>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">
              {transfert.numero}
            </h1>
            <Badge
              variant="secondary"
              className="font-medium bg-emerald-100 text-emerald-800"
            >
              {transfert.statut === "EFFECTUE" ? "Effectué" : transfert.statut}
            </Badge>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500">
            <span className="inline-flex items-center gap-1.5">
              <User className="h-3.5 w-3.5 text-gray-400" />
              {transfert.userNom}
            </span>
            {transfert.createdAt && (
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-gray-400" />
                {formatDateTime(transfert.createdAt)}
              </span>
            )}
          </div>
        </div>
        <Button
          asChild
          variant="outline"
          size="sm"
          className="gap-1.5 rounded-lg"
        >
          <Link href={`/pharmacie/transferts/${transfert.id}/imprimer`}>
            <Download className="h-4 w-4" />
            Télécharger PDF
          </Link>
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Card className="border border-gray-100 shadow-sm rounded-2xl bg-white">
          <CardContent className="px-4 py-3">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">
                  Magasin source
                </p>
                <p className="text-base font-extrabold text-gray-900 mt-1 truncate">
                  {transfert.magasinSourceNom}
                </p>
              </div>
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
                <Warehouse className="h-4 w-4" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border border-gray-100 shadow-sm rounded-2xl bg-white">
          <CardContent className="px-4 py-3">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">
                  Magasin destination
                </p>
                <p className="text-base font-extrabold text-gray-900 mt-1 truncate">
                  {transfert.magasinDestNom}
                </p>
              </div>
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <Warehouse className="h-4 w-4" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border border-gray-100 shadow-sm rounded-2xl bg-white">
          <CardContent className="px-4 py-3">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">
                  Quantité totale
                </p>
                <p className="text-xl font-extrabold tabular-nums text-[#cd3b86] mt-1">
                  {totalQte}
                </p>
              </div>
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#cd3b86]/8 text-[#cd3b86]">
                <Package className="h-4 w-4" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border border-gray-100 shadow-sm rounded-2xl bg-white overflow-hidden">
        <CardContent className="px-5 py-4">
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <div className="inline-flex items-center gap-2 rounded-xl border border-rose-100 bg-rose-50/80 px-3 py-2 font-semibold text-rose-800">
              <Warehouse className="h-4 w-4" />
              {transfert.magasinSourceNom}
            </div>
            <ArrowLeftRight className="h-4 w-4 text-gray-400" />
            <div className="inline-flex items-center gap-2 rounded-xl border border-emerald-100 bg-emerald-50/80 px-3 py-2 font-semibold text-emerald-800">
              <Warehouse className="h-4 w-4" />
              {transfert.magasinDestNom}
            </div>
          </div>
          {transfert.note && (
            <p className="mt-3 text-sm text-gray-600">
              <span className="font-semibold text-gray-800">Note : </span>
              {transfert.note}
            </p>
          )}
        </CardContent>
      </Card>

      <Card className="border border-gray-100 shadow-sm rounded-2xl overflow-hidden bg-white">
        <CardHeader className="pb-3 border-b border-gray-50">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Package className="h-4 w-4 text-[#cd3b86]" />
            Lignes transférées
            <Badge
              variant="secondary"
              className="ml-auto font-medium bg-[#cd3b86]/10 text-[#cd3b86]"
            >
              {transfert.lignes.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {transfert.lignes.length === 0 ? (
            <p className="py-12 text-center text-sm text-gray-500">Aucune ligne</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50/80 hover:bg-gray-50/80">
                    <TableHead className="pl-4 text-[11px] font-bold text-gray-500 uppercase tracking-wide">
                      Produit
                    </TableHead>
                    <TableHead className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">
                      N° lot
                    </TableHead>
                    <TableHead className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">
                      Péremption
                    </TableHead>
                    <TableHead className="text-right text-[11px] font-bold text-gray-500 uppercase tracking-wide pr-4">
                      Quantité
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transfert.lignes.map((l, i) => (
                    <TableRow
                      key={l.id}
                      className={cn(
                        "border-b border-gray-50",
                        i % 2 !== 0 && "bg-gray-50/30",
                      )}
                    >
                      <TableCell className="pl-4">
                        <p className="font-semibold text-sm text-gray-800">{l.produitNom}</p>
                        {l.produitDosage && (
                          <p className="text-xs text-gray-400">{l.produitDosage}</p>
                        )}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-gray-700">
                        {l.numeroLot}
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {formatDate(l.datePeremption)}
                      </TableCell>
                      <TableCell className="text-right font-semibold tabular-nums text-sm pr-4">
                        {l.quantite}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          {transfert.lignes.length > 0 && (
            <div className="flex justify-end border-t border-gray-100 bg-gray-50/50 px-4 py-3 text-sm">
              <span className="text-gray-500">
                Total unités :{" "}
                <strong className="text-gray-900 tabular-nums">{totalQte}</strong>
              </span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
