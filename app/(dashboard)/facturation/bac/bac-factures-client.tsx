"use client"

import * as React from "react"
import Link from "next/link"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { Inbox, Printer, Receipt } from "lucide-react"
import { FacturationTabs } from "@/components/shared/facturation-tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { formatCurrency, formatFactureNumero } from "@/lib/formatting"
import type { BacFactureRow } from "@/app/actions/bac-factures"

function sourceTypeLabel(t: BacFactureRow["sourceType"]) {
  if (t === "FEUILLE") return "Feuille"
  if (t === "PRESCRIPTION") return "Prescription"
  if (t === "MIXTE") return "Mixte"
  return "Facture"
}

export function BacFacturesClient({
  items,
  showBordereaux,
}: {
  items: BacFactureRow[]
  showBordereaux: boolean
}) {
  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">
            Bac à facture
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Factures à imprimer après encaissement caisse ({items.length} en attente).
          </p>
        </div>
      </div>

      <FacturationTabs showBordereaux={showBordereaux} />

      <Card className="border border-gray-100 shadow-sm rounded-2xl bg-white overflow-hidden">
        <CardContent className="p-0">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-gray-400">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gray-50">
                <Inbox className="h-6 w-6" />
              </div>
              <p className="text-sm font-semibold text-gray-500">Bac vide</p>
              <p className="text-xs text-gray-400 max-w-sm text-center">
                Les factures générées au paiement caisse apparaîtront ici jusqu&apos;à
                impression.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50/80">
                  <TableHead className="text-xs font-semibold">Facture</TableHead>
                  <TableHead className="text-xs font-semibold">Patient</TableHead>
                  <TableHead className="text-xs font-semibold hidden md:table-cell">
                    Source
                  </TableHead>
                  <TableHead className="text-xs font-semibold text-right">
                    Part patient
                  </TableHead>
                  <TableHead className="text-xs font-semibold text-right hidden sm:table-cell">
                    Part assurance
                  </TableHead>
                  <TableHead className="text-xs font-semibold hidden lg:table-cell">
                    Encaissé le
                  </TableHead>
                  <TableHead className="text-xs font-semibold w-[100px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((row) => (
                  <TableRow key={row.id} className="group">
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Receipt className="h-3.5 w-3.5 text-[#cd3b86] shrink-0" />
                        <span className="text-sm font-semibold text-gray-900">
                          {formatFactureNumero(row.factureNumero)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-gray-700">
                      {row.patientLabel ?? `#${row.patientId}`}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <div className="space-y-0.5">
                        <Badge
                          variant="secondary"
                          className="text-[10px] font-semibold"
                        >
                          {sourceTypeLabel(row.sourceType)}
                        </Badge>
                        {row.sourceLabel ? (
                          <p className="text-[11px] text-gray-500 truncate max-w-[180px]">
                            {row.sourceLabel}
                          </p>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell className="text-right text-sm tabular-nums">
                      {formatCurrency(row.montantPatient)}
                    </TableCell>
                    <TableCell className="text-right text-sm tabular-nums hidden sm:table-cell">
                      {formatCurrency(row.montantAssurance)}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-xs text-gray-500">
                      {row.createdAt
                        ? format(new Date(row.createdAt), "d MMM yyyy HH:mm", {
                            locale: fr,
                          })
                        : "—"}
                    </TableCell>
                    <TableCell>
                      <Button
                        asChild
                        size="sm"
                        className="gap-1.5 h-8 bg-[#cd3b86] hover:bg-[#b8307a] text-white"
                      >
                        <Link href={`/facturation/bac/${row.id}/imprimer`}>
                          <Printer className="h-3.5 w-3.5" />
                          Imprimer
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
