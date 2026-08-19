"use client"

import {
  ArrowDownToLine,
  ArrowUpFromLine,
  Receipt,
  Scale,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { formatCurrency } from "@/lib/formatting"
import { cn } from "@/lib/utils"
import type { CaisseSessionActive } from "@/lib/types/caisse-session"

function BreakdownItem({
  label,
  value,
  accent,
}: {
  label: string
  value: string
  accent?: "neutral" | "positive" | "negative" | "primary"
}) {
  return (
    <div className="rounded-xl border border-gray-100 bg-gray-50/80 px-3 py-2.5">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">
        {label}
      </p>
      <p
        className={cn(
          "mt-0.5 text-sm font-bold tabular-nums",
          accent === "positive" && "text-emerald-600",
          accent === "negative" && "text-rose-600",
          accent === "primary" && "text-[#cd3b86]",
          accent === "neutral" && "text-gray-900",
        )}
      >
        {value}
      </p>
    </div>
  )
}

export function CaisseSoldeTheoriqueCard({
  session,
  encaissementsJour,
}: {
  session: CaisseSessionActive
  encaissementsJour: number
}) {
  const { stats } = session

  return (
    <Card className="overflow-hidden rounded-2xl border border-[#cd3b86]/15 shadow-[0_2px_12px_rgba(205,59,134,0.08)]">
      <CardContent className="p-0">
        <div className="grid lg:grid-cols-[1fr_auto]">
          <div className="bg-gradient-to-br from-[#cd3b86]/[0.06] via-white to-white px-6 py-5">
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#cd3b86]/10 text-[#cd3b86]">
                <Scale className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-500">
                  Solde théorique en caisse
                </p>
                <p className="mt-1 text-3xl font-extrabold tracking-tight text-[#cd3b86] tabular-nums">
                  {formatCurrency(session.soldeTheorique)}
                </p>
                <p className="mt-1.5 text-xs text-gray-500">
                  Après encaissements et mouvements de la session ·{" "}
                  <span className="font-medium text-gray-700">{session.posteNom}</span>
                </p>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-100 px-6 py-5 lg:border-l lg:border-t-0 lg:min-w-[420px]">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <BreakdownItem
                label="Ouverture"
                value={formatCurrency(session.soldeOuverture)}
                accent="neutral"
              />
              <BreakdownItem
                label={`Recharges (${stats.nbRecharges})`}
                value={`+${formatCurrency(stats.totalRecharges)}`}
                accent="positive"
              />
              <BreakdownItem
                label={`Versements (${stats.nbVersements})`}
                value={`−${formatCurrency(stats.totalVersements)}`}
                accent="negative"
              />
              <BreakdownItem
                label={`Encaissements (${stats.nbEncaissements})`}
                value={formatCurrency(stats.totalEncaissements)}
                accent="primary"
              />
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
              <span className="inline-flex items-center gap-1">
                <ArrowDownToLine className="h-3.5 w-3.5 text-emerald-600" />
                Recharges = espèces / mobile entrant en caisse
              </span>
              <span className="inline-flex items-center gap-1">
                <ArrowUpFromLine className="h-3.5 w-3.5 text-rose-600" />
                Versements = sorties de caisse
              </span>
              {encaissementsJour > 0 && (
                <span className="inline-flex items-center gap-1 font-medium text-gray-600">
                  <Receipt className="h-3.5 w-3.5 text-[#cd3b86]" />
                  Aujourd&apos;hui : {formatCurrency(encaissementsJour)} encaissé
                </span>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
