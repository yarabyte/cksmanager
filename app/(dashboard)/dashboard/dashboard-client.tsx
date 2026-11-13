"use client"

import * as React from "react"
import Link from "next/link"
import {
  AlertTriangle,
  ArrowRight,
  BedDouble,
  Eye,
  FileText,
  Inbox,
  Package,
  PackageCheck,
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
  formatDate,
  formatTime,
  getInitials,
} from "@/lib/formatting"
import { resolveFacturePaiementStatus } from "@/lib/facture/paiement-status"
import { cn } from "@/lib/utils"
import type {
  DashboardCaisseItem,
  DashboardCategoryPoint,
  DashboardChartPoint,
  DashboardData,
  DashboardProfile,
  DashboardRecentFacture,
  DashboardRecentVisite,
  DashboardRevenuePoint,
  DashboardSortieItem,
  DashboardStockAlerte,
} from "@/lib/types/dashboard"
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

const PROFILE_SUBTITLE: Record<DashboardProfile, string> = {
  Admin: "Vue direction — activité clinique et financière.",
  Manager: "Vue direction — activité clinique et financière.",
  Médecin: "Ma journée — file d'attente et consultations.",
  "Sage femme": "Suivi du jour — visites, feuilles et hospitalisations.",
  "Front Office": "Accueil — file du jour et bac à imprimer.",
  Caisse: "Vue caisse — encaissements et files d'attente.",
  Pharmacie: "Stock et dispensation du jour.",
  "Commis Pharmacie": "Dispensation — sorties et retours du jour.",
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

function MiniStat({
  label,
  value,
  icon,
}: {
  label: string
  value: React.ReactNode
  icon: React.ReactNode
}) {
  return (
    <Card className="border border-gray-100 shadow-sm rounded-2xl">
      <CardContent className="px-4 py-3 flex items-center justify-between">
        <div>
          <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">
            {label}
          </p>
          <p className="text-xl font-extrabold text-gray-900 mt-0.5 tabular-nums">
            {value}
          </p>
        </div>
        <div className="text-[#cd3b86]">{icon}</div>
      </CardContent>
    </Card>
  )
}

function VisitesChart({
  data,
  title = "Visites des 30 derniers jours",
}: {
  data: DashboardChartPoint[]
  title?: string
}) {
  return (
    <Card className="lg:col-span-2 border border-gray-100 shadow-sm rounded-2xl">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base font-semibold">{title}</CardTitle>
        <Badge variant="secondary" className="text-xs">
          30 jours
        </Badge>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
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
                activeDot={{
                  r: 5,
                  fill: CHART_COLORS.primary,
                  stroke: "#fff",
                  strokeWidth: 2,
                }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}

function CategoriesChart({ data }: { data: DashboardCategoryPoint[] }) {
  return (
    <Card className="border border-gray-100 shadow-sm rounded-2xl">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base font-semibold">Actes par catégorie</CardTitle>
        <Badge variant="secondary" className="text-xs">
          30 jours
        </Badge>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="py-16 text-center text-sm text-gray-400">Aucune ligne facturée</p>
        ) : (
          <>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                    strokeWidth={2}
                    stroke="#fff"
                  >
                    {data.map((_, index) => (
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
              {data.map((entry, index) => (
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
  )
}

function RecettesChart({ data }: { data: DashboardRevenuePoint[] }) {
  return (
    <Card className="border border-gray-100 shadow-sm rounded-2xl">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base font-semibold">
          Encaissements de la semaine
        </CardTitle>
        <Badge variant="secondary" className="text-xs">
          7 derniers jours
        </Badge>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
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
                formatter={(value: number) => [formatCurrency(value), "Encaissements"]}
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
  )
}

function VisitesTable({
  items,
  title = "File du jour",
  href = "/visites",
  showMedecin = true,
}: {
  items: DashboardRecentVisite[]
  title?: string
  href?: string
  showMedecin?: boolean
}) {
  return (
    <Card className="lg:col-span-2 border border-gray-100 shadow-sm rounded-2xl">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base font-semibold">{title}</CardTitle>
        <Button variant="ghost" size="sm" asChild>
          <Link href={href} className="gap-1">
            Voir tout
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="py-10 text-center text-sm text-gray-400">Aucune visite</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Patient</TableHead>
                {showMedecin ? (
                  <TableHead className="hidden sm:table-cell">Médecin</TableHead>
                ) : null}
                <TableHead className="hidden md:table-cell">Heure</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="w-[50px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((visite) => {
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
                    {showMedecin ? (
                      <TableCell className="hidden sm:table-cell text-sm text-gray-600">
                        {medecin || "—"}
                      </TableCell>
                    ) : null}
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
  )
}

function FacturesList({ items }: { items: DashboardRecentFacture[] }) {
  return (
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
        {items.length === 0 ? (
          <p className="py-10 text-center text-sm text-gray-400">Aucune facture</p>
        ) : (
          items.map((f) => {
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
  )
}

function BacCard({ count }: { count: number }) {
  return (
    <Card className="border border-gray-100 shadow-sm rounded-2xl">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base font-semibold">Bac à facture</CardTitle>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/facturation/bac" className="gap-1">
            Ouvrir
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-3 rounded-xl bg-gray-50 px-4 py-5">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#cd3b86]/10">
            <Inbox className="h-5 w-5 text-[#cd3b86]" />
          </div>
          <div>
            <p className="text-2xl font-extrabold tabular-nums text-gray-900">{count}</p>
            <p className="text-xs text-gray-500">
              facture{count > 1 ? "s" : ""} en attente d&apos;impression
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function CaisseEnAttenteList({ items }: { items: DashboardCaisseItem[] }) {
  return (
    <Card className="lg:col-span-2 border border-gray-100 shadow-sm rounded-2xl">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base font-semibold">À encaisser</CardTitle>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/caisse" className="gap-1">
            Caisse
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent className="space-y-2">
        {items.length === 0 ? (
          <p className="py-10 text-center text-sm text-gray-400">Rien en attente</p>
        ) : (
          items.map((item) => (
            <Link
              key={`${item.type}-${item.id}`}
              href={
                item.type === "FACTURE"
                  ? `/facturation/${item.id}`
                  : `/caisse`
              }
              className="flex items-center justify-between gap-3 rounded-xl border border-gray-50 bg-gray-50/50 px-3 py-2.5 hover:bg-[#cd3b86]/5 transition-colors"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-[10px]">
                    {item.type === "FACTURE" ? "Facture" : "Feuille"}
                  </Badge>
                  <p className="text-sm font-semibold text-gray-800 truncate">
                    {item.numero}
                  </p>
                </div>
                <p className="text-xs text-gray-500 truncate mt-0.5">
                  {item.patientLabel ?? "Patient"}
                </p>
              </div>
              <p className="text-sm font-semibold tabular-nums shrink-0">
                {formatCurrency(item.montantPatient)}
              </p>
            </Link>
          ))
        )}
      </CardContent>
    </Card>
  )
}

function StockAlertesList({ items }: { items: DashboardStockAlerte[] }) {
  return (
    <Card className="lg:col-span-2 border border-gray-100 shadow-sm rounded-2xl">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base font-semibold">Alertes stock</CardTitle>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/pharmacie/stock" className="gap-1">
            Stock
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent className="space-y-2">
        {items.length === 0 ? (
          <p className="py-10 text-center text-sm text-gray-400">Aucune alerte</p>
        ) : (
          items.map((a) => (
            <div
              key={a.id}
              className="flex items-start justify-between gap-3 rounded-xl border border-gray-50 bg-gray-50/50 px-3 py-2.5"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <Badge
                    variant="secondary"
                    className={cn(
                      "text-[10px]",
                      a.kind === "STOCK"
                        ? "bg-amber-100 text-amber-800"
                        : "bg-orange-100 text-orange-800",
                    )}
                  >
                    {a.kind === "STOCK" ? "Stock bas" : "Péremption"}
                  </Badge>
                  <p className="text-sm font-semibold text-gray-800 truncate">
                    {a.produitNom}
                  </p>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">
                  Lot {a.numeroLot} · {a.magasinNom} · exp. {formatDate(a.datePeremption)}
                </p>
              </div>
              <p className="text-sm font-semibold tabular-nums shrink-0">
                {a.quantite}
              </p>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  )
}

function SortiesList({ items }: { items: DashboardSortieItem[] }) {
  return (
    <Card className="border border-gray-100 shadow-sm rounded-2xl">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base font-semibold">Sorties du jour</CardTitle>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/pharmacie/sorties" className="gap-1">
            Voir tout
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent className="space-y-2">
        {items.length === 0 ? (
          <p className="py-10 text-center text-sm text-gray-400">Aucune sortie</p>
        ) : (
          items.map((s) => (
            <div
              key={s.id}
              className="flex items-center justify-between gap-3 rounded-xl border border-gray-50 bg-gray-50/50 px-3 py-2.5"
            >
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-800">{s.numero}</p>
                <p className="text-xs text-gray-500 truncate">
                  {s.patientLabel ?? "Patient"}
                </p>
              </div>
              <Badge variant="secondary" className="text-[10px]">
                {s.statut}
              </Badge>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  )
}

function AdminManagerView({ data }: { data: DashboardData }) {
  const { kpis, visites30j, recettes7j, categoriesActes, recentVisites, recentFactures } =
    data
  const visitesChange = pctChange(kpis.visitesAujourdhui, kpis.visitesHier)
  const recettesChange = pctChange(kpis.recettesJour, kpis.recettesHier)

  return (
    <>
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
          title="Visites actives (jour)"
          value={kpis.visitesActives}
          icon={<Stethoscope className="h-6 w-6" />}
        />
        <KPICard
          title="Encaissements du jour"
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

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MiniStat
          label="Patients"
          value={kpis.patientsTotal}
          icon={<Users className="h-5 w-5" />}
        />
        <MiniStat
          label="Feuilles du jour"
          value={kpis.feuillesAujourdhui}
          icon={<ScrollText className="h-5 w-5" />}
        />
        <MiniStat
          label="Factures patient à encaisser"
          value={kpis.facturesConfirmees}
          icon={<FileText className="h-5 w-5" />}
        />
        <MiniStat
          label="Bac à imprimer"
          value={kpis.bacPending}
          icon={<Inbox className="h-5 w-5" />}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <VisitesChart data={visites30j} />
        <CategoriesChart data={categoriesActes} />
      </div>

      <RecettesChart data={recettes7j} />

      <div className="grid gap-6 lg:grid-cols-3">
        <VisitesTable items={recentVisites} title="Dernières visites" />
        <FacturesList items={recentFactures} />
      </div>
    </>
  )
}

function MedecinView({ data }: { data: DashboardData }) {
  const { kpis, visites30j, recentVisites } = data
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="Mes visites du jour"
          value={kpis.mesVisitesAujourdhui}
          icon={<Users className="h-6 w-6" />}
        />
        <KPICard
          title="En attente"
          value={kpis.mesEnAttente}
          icon={<Stethoscope className="h-6 w-6" />}
        />
        <KPICard
          title="En cours"
          value={kpis.mesEnCours}
          icon={<Stethoscope className="h-6 w-6" />}
        />
        <KPICard
          title="Terminées / facturées"
          value={kpis.mesTerminees}
          icon={<FileText className="h-6 w-6" />}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-1">
        <VisitesChart data={visites30j} title="Mes visites — 30 jours" />
      </div>

      <div className="grid gap-6 lg:grid-cols-1">
        <VisitesTable
          items={recentVisites}
          title="Ma file du jour"
          showMedecin={false}
        />
      </div>
    </>
  )
}

function SageFemmeView({ data }: { data: DashboardData }) {
  const { kpis, visites30j, recentVisites } = data
  const visitesChange = pctChange(kpis.visitesAujourdhui, kpis.visitesHier)
  return (
    <>
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
          title="Visites actives (jour)"
          value={kpis.visitesActives}
          icon={<Stethoscope className="h-6 w-6" />}
        />
        <KPICard
          title="Hospitalisations en cours"
          value={kpis.hospitalisationsEnCours}
          icon={<BedDouble className="h-6 w-6" />}
        />
        <KPICard
          title="Feuilles du jour"
          value={kpis.feuillesAujourdhui}
          icon={<ScrollText className="h-6 w-6" />}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <VisitesChart data={visites30j} />
        <Card className="border border-gray-100 shadow-sm rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Accès rapides</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button asChild variant="outline" className="w-full justify-between rounded-xl">
              <Link href="/hospitalisation">
                Hospitalisation
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-between rounded-xl">
              <Link href="/feuilles-circulation">
                Feuilles de circulation
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-between rounded-xl">
              <Link href="/visites">
                Visites
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <VisitesTable items={recentVisites} />
    </>
  )
}

function FrontOfficeView({ data }: { data: DashboardData }) {
  const { kpis, visites30j, recentVisites } = data
  const visitesChange = pctChange(kpis.visitesAujourdhui, kpis.visitesHier)
  return (
    <>
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
          title="Visites actives (jour)"
          value={kpis.visitesActives}
          icon={<Stethoscope className="h-6 w-6" />}
        />
        <KPICard
          title="Feuilles du jour"
          value={kpis.feuillesAujourdhui}
          icon={<ScrollText className="h-6 w-6" />}
        />
        <KPICard
          title="Bac à imprimer"
          value={kpis.bacPending}
          icon={<Inbox className="h-6 w-6" />}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <VisitesChart data={visites30j} />
        <BacCard count={kpis.bacPending} />
      </div>

      <VisitesTable items={recentVisites} />
    </>
  )
}

function CaisseView({ data }: { data: DashboardData }) {
  const { kpis, recettes7j, recentFactures, caisseEnAttente } = data
  const recettesChange = pctChange(kpis.recettesJour, kpis.recettesHier)
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="Encaissements du jour"
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
        <KPICard
          title="Factures patient à encaisser"
          value={kpis.facturesConfirmees}
          icon={<FileText className="h-6 w-6" />}
        />
        <KPICard
          title="Bac à imprimer"
          value={kpis.bacPending}
          icon={<Inbox className="h-6 w-6" />}
        />
      </div>

      <RecettesChart data={recettes7j} />

      <div className="grid gap-6 lg:grid-cols-3">
        <CaisseEnAttenteList items={caisseEnAttente} />
        <FacturesList items={recentFactures} />
      </div>
    </>
  )
}

function PharmacieView({ data }: { data: DashboardData }) {
  const { kpis, stockAlertes, recentSorties } = data
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <KPICard
          title="Alertes stock bas"
          value={kpis.stockAlertesCount}
          icon={<AlertTriangle className="h-6 w-6" />}
        />
        <KPICard
          title="Lots bientôt périmés"
          value={kpis.peremptionAlertesCount}
          icon={<Package className="h-6 w-6" />}
        />
        <KPICard
          title="Sorties du jour"
          value={kpis.sortiesJour}
          icon={<PackageCheck className="h-6 w-6" />}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <StockAlertesList items={stockAlertes} />
        <SortiesList items={recentSorties} />
      </div>
    </>
  )
}

function CommisPharmacieView({ data }: { data: DashboardData }) {
  const { kpis, recentSorties } = data
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        <KPICard
          title="Sorties du jour"
          value={kpis.sortiesJour}
          icon={<PackageCheck className="h-6 w-6" />}
        />
        <KPICard
          title="Retours du jour"
          value={kpis.retoursJour}
          icon={<Package className="h-6 w-6" />}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <SortiesList items={recentSorties} />
        <Card className="border border-gray-100 shadow-sm rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Accès rapides</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button asChild variant="outline" className="w-full justify-between rounded-xl">
              <Link href="/pharmacie/sorties">
                Sorties produits
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-between rounded-xl">
              <Link href="/pharmacie/retours">
                Retours patients
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </>
  )
}

export function DashboardClient({
  data,
  profile,
}: {
  data: DashboardData
  profile: DashboardProfile
}) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">
          Tableau de bord
        </h1>
        <p className="text-sm text-gray-500">
          {PROFILE_SUBTITLE[profile] ?? "Activité réelle de la clinique — données à jour."}
        </p>
      </div>

      {(profile === "Admin" || profile === "Manager") && (
        <AdminManagerView data={data} />
      )}
      {profile === "Médecin" && <MedecinView data={data} />}
      {profile === "Sage femme" && <SageFemmeView data={data} />}
      {profile === "Front Office" && <FrontOfficeView data={data} />}
      {profile === "Caisse" && <CaisseView data={data} />}
      {profile === "Pharmacie" && <PharmacieView data={data} />}
      {profile === "Commis Pharmacie" && <CommisPharmacieView data={data} />}
    </div>
  )
}
