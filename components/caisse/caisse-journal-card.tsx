"use client"

import * as React from "react"
import {
  ArrowDownLeft,
  ArrowUpRight,
  BookOpen,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { formatCurrency, formatDateTime, formatTime } from "@/lib/formatting"
import type { JournalCaisseJour } from "@/lib/types/caisse"

export function CaisseJournalCard({
  journal,
  title = "Journal de caisse — session",
  emptyMessage = "Aucun mouvement enregistré pour cette période.",
}: {
  journal: JournalCaisseJour
  title?: string
  emptyMessage?: string
}) {
  const showDateColumn = React.useMemo(() => {
    const days = new Set(journal.lignes.map((l) => l.createdAt.slice(0, 10)))
    return days.size > 1
  }, [journal.lignes])

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            {title}
          </CardTitle>
          <div className="flex flex-wrap gap-4 text-sm">
            <span className="flex items-center gap-1 text-emerald-700">
              <ArrowDownLeft className="h-4 w-4" />
              Encaissements : {formatCurrency(journal.totalEncaissements)}
            </span>
            <span className="flex items-center gap-1 text-rose-700">
              <ArrowUpRight className="h-4 w-4" />
              Décaissements : {formatCurrency(journal.totalDecaissements)}
            </span>
            <span className="font-medium">Solde : {formatCurrency(journal.solde)}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {journal.lignes.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">{emptyMessage}</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{showDateColumn ? "Date" : "Heure"}</TableHead>
                  <TableHead>Sens</TableHead>
                  <TableHead>Libellé</TableHead>
                  <TableHead>Patient</TableHead>
                  <TableHead>Mode</TableHead>
                  <TableHead className="text-right">Montant</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {journal.lignes.map((l) => (
                  <TableRow key={l.id}>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {showDateColumn
                        ? formatDateTime(l.createdAt)
                        : formatTime(l.createdAt)}
                    </TableCell>
                    <TableCell>
                      <span
                        className={
                          l.sens === "ENCAISSEMENT"
                            ? "inline-flex items-center gap-1 text-emerald-700 text-xs font-medium"
                            : "inline-flex items-center gap-1 text-rose-700 text-xs font-medium"
                        }
                      >
                        {l.sens === "ENCAISSEMENT" ? (
                          <ArrowDownLeft className="h-3 w-3" />
                        ) : (
                          <ArrowUpRight className="h-3 w-3" />
                        )}
                        {l.sens === "ENCAISSEMENT" ? "Enc." : "Déc."}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm max-w-[240px] truncate" title={l.libelle}>
                      {l.libelle}
                    </TableCell>
                    <TableCell className="text-sm">{l.patientLabel ?? "—"}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {l.modePaiement === "ESPECES"
                        ? "Espèces"
                        : l.modePaiement === "MOBILE_MONEY"
                          ? "MoMo"
                          : l.modePaiement === "PORTEFEUILLE"
                            ? "Portemonnaie"
                            : "—"}
                    </TableCell>
                    <TableCell
                      className={`text-right font-medium ${
                        l.sens === "ENCAISSEMENT" ? "text-emerald-700" : "text-rose-700"
                      }`}
                    >
                      {l.sens === "ENCAISSEMENT" ? "+" : "−"}
                      {formatCurrency(l.montant)}
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
