"use client"

import Link from "next/link"
import {
  AlertTriangle,
  ArrowDownLeft,
  ArrowLeft,
  ArrowUpFromLine,
  Banknote,
  Calendar,
  CheckCircle2,
  Lock,
  Receipt,
  Scale,
  Unlock,
  User,
  Wallet,
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
import { formatCurrency, formatDateTime } from "@/lib/formatting"
import { cn } from "@/lib/utils"
import type { CaisseSessionDetail } from "@/lib/types/caisse-session"

function encaissementTypeLabel(type: string) {
  if (type === "FEUILLE") return "Feuille"
  if (type === "FACTURE") return "Facture"
  return type
}

function KpiTile({
  label,
  value,
  icon: Icon,
  accent,
  bg,
}: {
  label: string
  value: string
  icon: React.ComponentType<{ className?: string }>
  accent: string
  bg: string
}) {
  return (
    <Card className="border border-gray-100 shadow-sm rounded-2xl bg-white">
      <CardContent className="px-4 py-3">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">{label}</p>
            <p className={cn("text-lg font-extrabold mt-1 tabular-nums truncate", accent)}>
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
  )
}

export function SessionDetailClient({ session }: { session: CaisseSessionDetail }) {
  const isOpen = session.statut === "OUVERTE"
  const hasEcart = session.ecart != null && session.ecart !== 0
  const equilibrated =
    session.statut === "FERMEE" && session.ecart != null && session.ecart === 0

  return (
    <div className="space-y-5 pb-10">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link
            href="/cloture/historique"
            className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 mb-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour à l&apos;historique
          </Link>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">
              {session.posteNom}
            </h1>
            <Badge
              variant="secondary"
              className={cn(
                "font-medium",
                isOpen
                  ? "bg-emerald-100 text-emerald-800"
                  : "bg-gray-100 text-gray-700",
              )}
            >
              {isOpen ? "Ouverte" : "Clôturée"}
            </Badge>
            {hasEcart && (
              <Badge variant="secondary" className="font-medium bg-amber-100 text-amber-800">
                Écart
              </Badge>
            )}
            {equilibrated && (
              <Badge
                variant="secondary"
                className="font-medium bg-emerald-100 text-emerald-800"
              >
                Équilibrée
              </Badge>
            )}
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500">
            <span className="inline-flex items-center gap-1.5">
              <User className="h-3.5 w-3.5 text-gray-400" />
              {session.caissierNom}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-gray-400" />
              {formatDateTime(session.openedAt)}
              {session.closedAt ? ` → ${formatDateTime(session.closedAt)}` : ""}
            </span>
            <span className="text-xs text-gray-400">Session #{session.id}</span>
          </div>
        </div>
        {isOpen && (
          <Button
            asChild
            size="sm"
            className="gap-1.5 rounded-lg bg-gradient-to-r from-[#cd3b86] to-[#b8307a] hover:from-[#b8307a] hover:to-[#9b2563] text-white"
          >
            <Link href="/cloture">
              <Lock className="h-4 w-4" />
              Clôturer
            </Link>
          </Button>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <KpiTile
          label="Solde d'ouverture"
          value={formatCurrency(session.soldeOuverture)}
          icon={Wallet}
          accent="text-gray-900"
          bg="bg-gray-100"
        />
        <KpiTile
          label="Recharges"
          value={`+${formatCurrency(session.totalRecharges)}`}
          icon={Banknote}
          accent="text-emerald-600"
          bg="bg-emerald-50"
        />
        <KpiTile
          label="Versements"
          value={`−${formatCurrency(session.totalVersements)}`}
          icon={ArrowUpFromLine}
          accent="text-rose-600"
          bg="bg-rose-50"
        />
        <KpiTile
          label="Encaissements"
          value={formatCurrency(session.totalEncaissements)}
          icon={ArrowDownLeft}
          accent="text-blue-600"
          bg="bg-blue-50"
        />
      </div>

      {(session.soldeTheoriqueCloture != null || session.soldeReelCloture != null) && (
        <Card className="border border-gray-100 shadow-sm rounded-2xl bg-white overflow-hidden">
          <CardHeader className="pb-3 border-b border-gray-50">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Scale className="h-4 w-4 text-[#cd3b86]" />
              Clôture
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="grid sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-gray-50">
              <div className="px-5 py-4">
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">
                  Solde théorique
                </p>
                <p className="text-xl font-extrabold tabular-nums text-gray-900 mt-1">
                  {session.soldeTheoriqueCloture != null
                    ? formatCurrency(session.soldeTheoriqueCloture)
                    : "—"}
                </p>
              </div>
              <div className="px-5 py-4">
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">
                  Solde réel
                </p>
                <p className="text-xl font-extrabold tabular-nums text-gray-900 mt-1">
                  {session.soldeReelCloture != null
                    ? formatCurrency(session.soldeReelCloture)
                    : "—"}
                </p>
              </div>
              <div className="px-5 py-4">
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">
                  Écart
                </p>
                <p
                  className={cn(
                    "text-xl font-extrabold tabular-nums mt-1",
                    hasEcart ? "text-amber-600" : "text-emerald-600",
                  )}
                >
                  {session.ecart != null ? formatCurrency(session.ecart) : "—"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {hasEcart && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
              <AlertTriangle className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-semibold text-amber-900">Écart de clôture</p>
              <p className="text-lg font-extrabold tabular-nums text-amber-800 mt-0.5">
                {formatCurrency(session.ecart!)}
              </p>
              {session.commentaireEcart ? (
                <p className="mt-1.5 text-sm text-amber-800/90">{session.commentaireEcart}</p>
              ) : (
                <p className="mt-1 text-xs text-amber-700/80">Aucun commentaire saisi.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {equilibrated && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
              <CheckCircle2 className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-semibold text-emerald-900">Caisse équilibrée</p>
              <p className="text-xs text-emerald-800/80 mt-0.5">
                Le solde réel correspond au solde théorique.
              </p>
            </div>
          </div>
        </div>
      )}

      {isOpen && (
        <div className="rounded-2xl border border-blue-100 bg-blue-50/70 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
              <Unlock className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-semibold text-blue-900">Session en cours</p>
              <p className="text-xs text-blue-800/80 mt-0.5">
                Les soldes de clôture seront disponibles après fermeture de la caisse.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-2">
        <Card className="border border-gray-100 shadow-sm rounded-2xl overflow-hidden bg-white">
          <CardHeader className="pb-3 border-b border-gray-50">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <ArrowUpFromLine className="h-4 w-4 text-rose-600" />
              Versements
              <Badge
                variant="secondary"
                className="ml-auto font-medium bg-rose-50 text-rose-700"
              >
                {session.versements.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {session.versements.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-12 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-50">
                  <ArrowUpFromLine className="h-5 w-5 text-gray-300" />
                </div>
                <p className="text-sm text-gray-500">Aucun versement sur cette session.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50/80 hover:bg-gray-50/80">
                      <TableHead className="pl-4 text-[11px] font-bold text-gray-500 uppercase">
                        N°
                      </TableHead>
                      <TableHead className="text-[11px] font-bold text-gray-500 uppercase">
                        Libellé
                      </TableHead>
                      <TableHead className="text-[11px] font-bold text-gray-500 uppercase">
                        Date
                      </TableHead>
                      <TableHead className="text-right text-[11px] font-bold text-gray-500 uppercase">
                        Montant
                      </TableHead>
                      <TableHead className="w-[80px]" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {session.versements.map((v, i) => (
                      <TableRow
                        key={v.id}
                        className={cn(
                          "border-b border-gray-50",
                          i % 2 !== 0 && "bg-gray-50/30",
                        )}
                      >
                        <TableCell className="pl-4 text-xs font-semibold text-[#cd3b86]">
                          {v.numero}
                        </TableCell>
                        <TableCell className="max-w-[160px]">
                          <p className="text-sm text-gray-800 truncate" title={v.libelle}>
                            {v.libelle}
                          </p>
                          {v.beneficiaire && (
                            <p className="text-[11px] text-gray-400 truncate">
                              {v.beneficiaire}
                            </p>
                          )}
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-xs text-gray-500">
                          {formatDateTime(v.createdAt)}
                        </TableCell>
                        <TableCell className="text-right font-semibold tabular-nums text-sm text-rose-700">
                          −{formatCurrency(v.montant)}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 gap-1 text-xs text-gray-400 hover:text-gray-600 px-2"
                            asChild
                          >
                            <Link href={`/caisse/versement/${v.id}`} target="_blank">
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

        <Card className="border border-gray-100 shadow-sm rounded-2xl overflow-hidden bg-white">
          <CardHeader className="pb-3 border-b border-gray-50">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <ArrowDownLeft className="h-4 w-4 text-emerald-600" />
              Encaissements patients
              <Badge
                variant="secondary"
                className="ml-auto font-medium bg-emerald-50 text-emerald-700"
              >
                {session.encaissements.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {session.encaissements.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-12 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-50">
                  <ArrowDownLeft className="h-5 w-5 text-gray-300" />
                </div>
                <p className="text-sm text-gray-500">Aucun encaissement sur cette session.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50/80 hover:bg-gray-50/80">
                      <TableHead className="pl-4 text-[11px] font-bold text-gray-500 uppercase">
                        N°
                      </TableHead>
                      <TableHead className="text-[11px] font-bold text-gray-500 uppercase">
                        Type
                      </TableHead>
                      <TableHead className="text-[11px] font-bold text-gray-500 uppercase">
                        Date
                      </TableHead>
                      <TableHead className="text-right text-[11px] font-bold text-gray-500 uppercase">
                        Montant
                      </TableHead>
                      <TableHead className="w-[80px]" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {session.encaissements.map((e, i) => (
                      <TableRow
                        key={e.id}
                        className={cn(
                          "border-b border-gray-50",
                          i % 2 !== 0 && "bg-gray-50/30",
                        )}
                      >
                        <TableCell className="pl-4 text-xs font-semibold text-[#cd3b86]">
                          {e.numero}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="secondary"
                            className="font-medium bg-gray-100 text-gray-700"
                          >
                            {encaissementTypeLabel(e.type)}
                          </Badge>
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-xs text-gray-500">
                          {formatDateTime(e.createdAt)}
                        </TableCell>
                        <TableCell className="text-right font-semibold tabular-nums text-sm text-emerald-700">
                          +{formatCurrency(e.montant)}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 gap-1 text-xs text-gray-400 hover:text-gray-600 px-2"
                            asChild
                          >
                            <Link href={`/caisse/recu/${e.id}`} target="_blank">
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
      </div>
    </div>
  )
}
