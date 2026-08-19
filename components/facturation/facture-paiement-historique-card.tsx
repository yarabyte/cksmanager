"use client"

import Link from "next/link"
import { Receipt } from "lucide-react"
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
import { encaissementTypeLabel } from "@/lib/facture/payment-history"
import { formatCurrency, formatDateTime } from "@/lib/formatting"
import { cn } from "@/lib/utils"
import type { FacturePaiementHistoriqueRow } from "@/lib/types/facture"

export function FacturePaiementHistoriqueCard({
  historique,
  totalEncaisse,
  className,
}: {
  historique: FacturePaiementHistoriqueRow[]
  totalEncaisse: number
  className?: string
}) {
  return (
    <Card className={cn("border border-gray-100 shadow-sm rounded-2xl overflow-hidden bg-white", className)}>
      <CardHeader className="pb-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="text-base font-semibold">Historique de paiement</CardTitle>
          {historique.length > 0 && (
            <p className="text-sm text-gray-500">
              Total encaissé{" "}
              <span className="font-semibold text-emerald-700 tabular-nums">
                {formatCurrency(totalEncaisse)}
              </span>
            </p>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {historique.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-5 py-12 text-center text-gray-500">
            <Receipt className="h-8 w-8 mb-2 opacity-40" />
            <p className="text-sm font-medium text-gray-600">Aucun paiement enregistré</p>
            <p className="mt-1 text-xs text-gray-400">
              Les encaissements à la caisse apparaîtront ici.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50/80 hover:bg-gray-50/80 border-b border-gray-100">
                  <TableHead className="py-3 pl-4">Reçu</TableHead>
                  <TableHead className="py-3">Type</TableHead>
                  <TableHead className="py-3">Référence</TableHead>
                  <TableHead className="py-3">Date</TableHead>
                  <TableHead className="py-3 hidden md:table-cell">Caissier</TableHead>
                  <TableHead className="py-3 pr-4 text-right">Montant</TableHead>
                  <TableHead className="w-[72px] py-3 pr-4" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {historique.map((row, i) => (
                  <TableRow
                    key={row.id}
                    className={cn(
                      "border-b border-gray-50 hover:bg-[#cd3b86]/3",
                      i % 2 !== 0 && "bg-gray-50/30",
                    )}
                  >
                    <TableCell className="pl-4 font-sans text-sm font-semibold text-[#cd3b86]">
                      {row.numero}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className="font-medium bg-gray-100 text-gray-700"
                      >
                        {encaissementTypeLabel(row.type)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-gray-700">
                      {row.type === "FEUILLE" && row.feuilleNumero ? (
                        row.feuilleId ? (
                          <Link
                            href={`/feuilles-circulation/${row.feuilleId}`}
                            className="hover:text-[#cd3b86] hover:underline"
                          >
                            {row.feuilleNumero}
                          </Link>
                        ) : (
                          row.feuilleNumero
                        )
                      ) : (
                        <span className="text-gray-500">Facture groupée</span>
                      )}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-sm text-gray-600">
                      {formatDateTime(row.createdAt)}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-sm text-gray-600">
                      {row.caissierNom ?? "—"}
                    </TableCell>
                    <TableCell className="pr-4 text-right font-semibold tabular-nums text-emerald-700">
                      {formatCurrency(row.montant)}
                    </TableCell>
                    <TableCell className="pr-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 gap-1 px-2 text-xs text-gray-400 hover:text-gray-600"
                        asChild
                      >
                        <Link href={`/caisse/recu/${row.id}`} target="_blank">
                          <Receipt className="h-3.5 w-3.5" />
                          Reçu
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
