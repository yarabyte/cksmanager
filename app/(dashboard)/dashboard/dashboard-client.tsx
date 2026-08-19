"use client"

import * as React from "react"
import Link from "next/link"
import {
  ArrowRight,
  Eye,
  FileText,
  Receipt,
  ScrollText,
  Stethoscope,
  Users,
  Wallet,
} from "lucide-react"
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { KPICard } from "@/components/shared/kpi-card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { FacturePaiementGlobalBadge } from "@/components/shared/facture-db-status-badge"
import {
  formatCurrency,
  formatFactureNumero,
  formatTime,
  getInitials,
} from "@/lib/formatting"
import { resolveFacturePaiementStatus } from "@/lib/facture/paiement-status"
import { cn } from "@/lib/utils"
import type { DashboardData } from "@/lib/types/dashboard"
import type { FactureStatut } from "@/lib/types/facture"

const CHART_COLORS = {
  primary: "#cd3b86",
  secondary: "#3b82f6",
  amber: "#f59e0b",
  teal: "#14b8a6",
  orange: "#f97316",
  green: "#68b33d",
}

const PIE_COLORS = [
  CHART_COLORS.primary,
  CHART_COLORS.secondary,
  CHART_COLORS.amber,
  CHART_COLORS.teal,
  CHART_COLORS.orange,
  CHART_COLORS.green,
]

const VISITE_STATUT: Record<string, { label: string; className: string }> = {
  EN_ATTENTE: { label: "En attente", className: "bg-amber-100 text-amber-800" },
  EN_COURS: { label: "En cours", className: "bg-blue-100 text-blue-800" },
  TERMINEE: { label: "Terminée", className: "bg-emerald-100 text-emerald-800" },
  FACTUREE: { label: "Facturée", className: "bg-[#cd3b86]/15 text-[#b8307a]" },
}

function pctChange(current: number, previous: number): {
  change?: number
  changeType: "increase" | "decrease" | "neutral"
} {
  if (previous === 0 && current === 0) return { changeType: "neutral" }
  if (previous === 0) return { change: 100, changeType: "increase" }
  const pct = Math.round(((current - previous) / previous) * 100)
  if (pct === 0) return { change: 0, changeType: "neutral" }
  return {
    change: Math.abs(pct),
    changeType: pct > 0 ? "increase" : "decrease",
  }
}

function patientInitials(label: string | null): string {
  if (!label) return "?"
  const parts = label.replace(/^(M\.|Mme|Mlle)\s+/i, "").trim().split(/\s+/)
  if (parts.length >= 2) return getInitials(parts[1] ?? "", parts[0] ?? "")
  return (parts[0]?.slice(0, 2) ?? "?").toUpperCase()
}

export function DashboardClient({ data }: { data: DashboardData }) {
  const { kpis, visites30j, recettes7j, categoriesActes, recentVisites, recentFactures } =
    data

  const visitesChange = pctChange(kpis.visitesAujourdhui, kpis.visitesHier)
  const recettesChange = pctChange(kpis.recettesJour, kpis.recettesHier)

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">
          Tableau de bord
        </h1>
        <p className="text-sm text-gray-500">
          Activité réelle de la clinique — données à jour.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="Visites du jour"
          value={kpis.visitesAujourdhui}
          change={visitesChange.change}
          changeType={visitesChange.changeType}
          changeLabel="vs hier"
          icon={<Users className="h-6 w-6" />}
        />
        <KPICard
          title="Visites actives"
          value={kpis.visitesActives}
          icon={<Stethoscope className="h-6 w-6" />}
        />
        <KPICard
          title="Recettes du jour"
          value={formatCurrency(kpis.recettesJour)}
          change={recettesChange.change}
          changeType={recettesChange.changeType}
          changeLabel="vs hier"
          icon={<Receipt className="h-6 w-6" />}
        />
        <KPICard
          title={`À encaisser (${kpis.nbEnAttente})`}
          value={formatCurrency(kpis.montantEnAttente)}
          icon={<Wallet className="h-6 w-6" />}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Card className="border border-gray-100 shadow-sm rounded-2xl">
          <CardContent className="px-4 py-3 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">
                Patients
              </p>
              <p className="text-xl font-extrabold text-gray-900 mt-0.5 tabular-nums">
                {kpis.patientsTotal}
              </p>
            </div>
            <Users className="h-5 w-5 text-[#cd3b86]" />
          </CardContent>
        </Card>
        <Card className="border border-gray-100 shadow-sm rounded-2xl">
          <CardContent className="px-4 py-3 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">
                Feuilles du jour
              </p>
              <p className="text-xl font-extrabold text-gray-900 mt-0.5 tabular-nums">
                {kpis.feuillesAujourdhui}
              </p>
            </div>
            <ScrollText className="h-5 w-5 text-[#cd3b86]" />
          </CardContent>
        </Card>
        <Card className="border border-gray-100 shadow-sm rounded-2xl">
          <CardContent className="px-4 py-3 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">
                Factures à encaisser
              </p>
              <p className="text-xl font-extrabold text-gray-900 mt-0.5 tabular-nums">
                {kpis.facturesConfirmees}
              </p>
            </div>
            <FileText className="h-5 w-5 text-[#cd3b86]" />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2 border border-gray-100 shadow-sm rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base font-semibold">
              Visites des 30 derniers jours
            </CardTitle>
            <Badge variant="secondary" className="text-xs">
              Réel
            </Badge>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={visites30j} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorVisites" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={CHART_COLORS.primary} stopOpacity={0.35} />
                      <stop offset="100%" stopColor={CHART_COLORS.primary} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#e5e7eb"
                    strokeOpacity={0.8}
                    vertical={false}
                  />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11, fill: "#6b7280" }}
                    tickLine={false}
                    axisLine={false}
                    interval="preserveStartEnd"
                    dy={10}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "#6b7280" }}
                    tickLine={false}
                    axisLine={false}
                    width={35}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#ffffff",
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                    formatter={(value: number) => [`${value} visite${value > 1 ? "s" : ""}`, ""]}
                  />
                  <Area
                    type="monotone"
                    dataKey="visites"
                    stroke={CHART_COLORS.primary}
                    strokeWidth={2.5}
                    fill="url(#colorVisites)"
                    dot={false}
                    activeDot={{ r: 5, fill: CHART_COLORS.primary, stroke: "#fff", strokeWidth: 2 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-gray-100 shadow-sm rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">
              Actes par catégorie
            </CardTitle>
          </CardHeader>
          <CardContent>
            {categoriesActes.length === 0 ? (
              <p className="py-16 text-center text-sm text-gray-400">Aucune ligne facturée</p>
            ) : (
              <>
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoriesActes}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={3}
                        dataKey="value"
                        strokeWidth={2}
                        stroke="#fff"
                      >
                        {categoriesActes.map((_, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={PIE_COLORS[index % PIE_COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#ffffff",
                          border: "1px solid #e5e7eb",
                          borderRadius: "8px",
                          fontSize: "12px",
                        }}
                        formatter={(value: number, name: string) => [`${value} lignes`, name]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-3 grid grid-cols-1 gap-1.5">
                  {categoriesActes.map((entry, index) => (
                    <div
                      key={entry.name}
                      className="flex items-center gap-2 rounded-md px-2 py-1"
                    >
                      <div
                        className="h-2.5 w-2.5 rounded-sm shrink-0"
                        style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }}
                      />
                      <span className="text-xs text-gray-500 truncate">{entry.name}</span>
                      <span className="text-xs font-semibold ml-auto tabular-nums">
                        {entry.value}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="border border-gray-100 shadow-sm rounded-2xl">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-base font-semibold">Recettes de la semaine</CardTitle>
          <Badge variant="secondary" className="text-xs">
            7 derniers jours
          </Badge>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={recettes7j} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#e5e7eb"
                  strokeOpacity={0.8}
                  vertical={false}
                />
                <XAxis
                  dataKey="day"
                  tick={{ fontSize: 11, fill: "#6b7280" }}
                  tickLine={false}
                  axisLine={false}
                  dy={8}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "#6b7280" }}
                  tickLine={false}
                  axisLine={false}
                  width={50}
                  tickFormatter={(value) =>
                    value >= 1000 ? `${(value / 1000).toFixed(0)}k` : `${value}`
                  }
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#ffffff",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                  formatter={(value: number) => [formatCurrency(value), "Recettes"]}
                />
                <Bar
                  dataKey="revenue"
                  fill={CHART_COLORS.primary}
                  radius={[4, 4, 0, 0]}
                  maxBarSize={40}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2 border border-gray-100 shadow-sm rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base font-semibold">Dernières visites</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/visites" className="gap-1">
                Voir tout
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {recentVisites.length === 0 ? (
              <p className="py-10 text-center text-sm text-gray-400">Aucune visite</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Patient</TableHead>
                    <TableHead className="hidden sm:table-cell">Médecin</TableHead>
                    <TableHead className="hidden md:table-cell">Heure</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="w-[50px]" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentVisites.map((visite) => {
                    const st = VISITE_STATUT[visite.statut] ?? {
                      label: visite.statut,
                      className: "bg-gray-100 text-gray-700",
                    }
                    const medecin = visite.medecinTitre
                      ? `${visite.medecinTitre} ${visite.medecinNom}`
                      : visite.medecinNom
                    return (
                      <TableRow key={visite.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="bg-[#cd3b86]/10 text-[#cd3b86] text-xs">
                                {patientInitials(visite.patientLabel)}
                              </AvatarFallback>
                            </Avatar>
                            <p className="font-medium text-sm text-gray-800">
                              {visite.patientLabel ?? `Patient #${visite.patientId}`}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell text-sm text-gray-600">
                          {medecin || "—"}
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-sm text-gray-600">
                          {formatTime(visite.dateVisite)}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="secondary"
                            className={cn("font-medium", st.className)}
                          >
                            {st.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon" asChild>
                            <Link href={`/visites/${visite.id}`}>
                              <Eye className="h-4 w-4" />
                              <span className="sr-only">Voir</span>
                            </Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card className="border border-gray-100 shadow-sm rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base font-semibold">Dernières factures</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/facturation" className="gap-1">
                Voir tout
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentFactures.length === 0 ? (
              <p className="py-10 text-center text-sm text-gray-400">Aucune facture</p>
            ) : (
              recentFactures.map((f) => {
                const paiement = resolveFacturePaiementStatus({
                  statut: f.statut as FactureStatut,
                  montantPatient: f.montantPatient,
                  montantAssurance: f.montantAssurance,
                  suiviAssureur:
                    f.montantAssurance > 0
                      ? {
                          statut: f.assureurPaye ? "PAYE" : "A_DEPOSER",
                          bordereauId: null,
                          bordereauNumero: null,
                          assuranceId: null,
                          assuranceNom: null,
                        }
                      : null,
                })
                return (
                  <Link
                    key={f.id}
                    href={`/facturation/${f.id}`}
                    className="flex items-start justify-between gap-2 rounded-xl border border-gray-50 bg-gray-50/50 px-3 py-2.5 hover:bg-[#cd3b86]/5 transition-colors"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[#cd3b86]">
                        {formatFactureNumero(f.numero)}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {f.patientLabel ?? "Patient"}
                      </p>
                      <div className="mt-1">
                        <FacturePaiementGlobalBadge status={paiement.global} />
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-semibold tabular-nums text-gray-800">
                        {formatCurrency(f.montantPatient)}
                      </p>
                      {f.montantAssurance > 0 && (
                        <p className="text-[11px] text-emerald-600 tabular-nums">
                          +{formatCurrency(f.montantAssurance)}
                        </p>
                      )}
                    </div>
                  </Link>
                )
              })
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
