"use client"

import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { formatCurrency, formatDateTime } from "@/lib/formatting"
import type { PatientWalletDetail } from "@/lib/types/wallet"
import { ArrowDownLeft, ArrowUpRight, Loader2, Wallet } from "lucide-react"
import { cn } from "@/lib/utils"

const TYPE_LABELS: Record<string, string> = {
  recharge: "Recharge",
  paiement: "Paiement",
  annulation: "Annulation",
  reservation: "Réservation",
}

function typeLabel(type: string): string {
  return TYPE_LABELS[type] ?? type
}

function typeBadgeClass(type: string): string {
  if (type === "recharge") return "bg-emerald-100 text-emerald-800 hover:bg-emerald-100"
  if (type === "paiement") return "bg-rose-100 text-rose-800 hover:bg-rose-100"
  if (type === "annulation") return "bg-amber-100 text-amber-800 hover:bg-amber-100"
  return "bg-muted text-muted-foreground"
}

export function PatientPortemonnaieSection({
  wallet,
  isPending,
}: {
  wallet: PatientWalletDetail | null | undefined
  isPending: boolean
}) {
  if (isPending) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <Loader2 className="h-8 w-8 mb-2 animate-spin" />
        <p>Chargement du portemonnaie…</p>
      </div>
    )
  }

  if (!wallet) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <Wallet className="h-10 w-10 mb-3" />
        <p>Portemonnaie introuvable</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="flex items-center gap-3 rounded-xl border border-border/80 bg-gradient-to-br from-[#cd3b86]/5 to-transparent p-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#cd3b86]/10">
              <Wallet className="h-5 w-5 text-[#cd3b86]" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Solde actuel</p>
              <p className="text-lg font-bold tabular-nums text-foreground truncate">
                {formatCurrency(wallet.solde)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-xl border border-border/80 bg-white p-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50">
              <ArrowDownLeft className="h-5 w-5 text-emerald-600" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Cumul entrées</p>
              <p className="text-lg font-bold tabular-nums text-emerald-600 truncate">
                {formatCurrency(wallet.totalEntrees)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-xl border border-border/80 bg-white p-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-rose-50">
              <ArrowUpRight className="h-5 w-5 text-rose-600" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Cumul sorties</p>
              <p className="text-lg font-bold tabular-nums text-rose-600 truncate">
                {formatCurrency(wallet.totalSorties)}
              </p>
            </div>
          </div>
        </div>
        {wallet.createdAt && (
          <p className="text-xs text-muted-foreground">
            Portemonnaie créé le {formatDateTime(wallet.createdAt)}
          </p>
        )}
      </div>

      <div>
        <h3 className="mb-3 text-sm font-semibold text-foreground">Historique des mouvements</h3>
        {wallet.transactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-10 text-muted-foreground">
            <Wallet className="h-8 w-8 mb-2 opacity-50" />
            <p className="text-sm">Aucun mouvement enregistré</p>
            <p className="text-xs mt-1">Le solde est de 0 FCFA</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Montant</TableHead>
                <TableHead className="hidden sm:table-cell">Motif</TableHead>
                <TableHead className="hidden md:table-cell">Par</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {wallet.transactions.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="whitespace-nowrap text-sm">
                    {t.createdAt ? formatDateTime(t.createdAt) : "—"}
                  </TableCell>
                  <TableCell>
                    <Badge className={cn("font-normal", typeBadgeClass(t.type))}>
                      {typeLabel(t.type)}
                    </Badge>
                  </TableCell>
                  <TableCell
                    className={cn(
                      "text-right font-medium tabular-nums",
                      t.montant >= 0 ? "text-emerald-600" : "text-rose-600",
                    )}
                  >
                    {t.montant >= 0 ? "+" : ""}
                    {formatCurrency(t.montant)}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell max-w-[240px] truncate text-sm text-muted-foreground">
                    {[
                      t.description,
                      t.modePaiement === "ESPECES"
                        ? "Espèces"
                        : t.modePaiement === "MOBILE_MONEY"
                          ? "Mobile Money"
                          : null,
                    ]
                      .filter(Boolean)
                      .join(" · ") || "—"}
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                    {t.userName ?? "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  )
}
