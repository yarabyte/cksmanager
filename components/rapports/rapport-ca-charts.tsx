"use client"

import * as React from "react"
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCurrency } from "@/lib/formatting"
import type { RapportCaLigne, RapportVue } from "@/lib/types/rapport"

const COLORS = {
  primary: "#cd3b86",
  patient: "#cd3b86",
  assurance: "#10b981",
  muted: "#94a3b8",
}

const PIE_COLORS = [
  "#cd3b86",
  "#10b981",
  "#f59e0b",
  "#0ea5e9",
  "#8b5cf6",
  "#f97316",
  "#14b8a6",
  "#64748b",
]

const tooltipStyle = {
  backgroundColor: "#ffffff",
  border: "1px solid #e5e7eb",
  borderRadius: "8px",
  fontSize: "12px",
}

function shortLabel(label: string, max = 18): string {
  const t = label.trim()
  if (t.length <= max) return t
  return `${t.slice(0, max - 1)}…`
}

function vueChartTitle(vue: RapportVue): string {
  switch (vue) {
    case "patient":
      return "CA par patient"
    case "medecin":
      return "CA par médecin"
    case "assureur":
      return "CA par assureur"
    case "categorie":
      return "CA par catégorie"
    case "jour":
      return "Évolution du CA par jour"
  }
}

function formatAxisCurrency(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1000) return `${(value / 1000).toFixed(0)}k`
  return String(value)
}

export function RapportCaCharts({
  vue,
  lignes,
}: {
  vue: RapportVue
  lignes: RapportCaLigne[]
  totaux?: RapportCaTotaux
}) {
  const topBars = React.useMemo(() => {
    const toPoint = (l: RapportCaLigne) => ({
      name: shortLabel(l.label, vue === "jour" ? 10 : 16),
      fullName: l.label,
      patient: l.montantPatient,
      assurance: l.montantAssurance,
      total: l.total,
      partPct: l.partPct,
    })
    if (vue === "jour") {
      return lignes.map(toPoint)
    }
    return [...lignes]
      .sort((a, b) => b.total - a.total)
      .slice(0, 10)
      .map(toPoint)
  }, [lignes, vue])

  const pieData = React.useMemo(() => {
    const sorted = [...lignes].sort((a, b) => b.total - a.total)
    const top = sorted.slice(0, 7)
    const restTotal = sorted.slice(7).reduce((s, l) => s + l.total, 0)
    const data = top
      .filter((l) => l.total > 0)
      .map((l) => ({
        name: shortLabel(l.label, 22),
        fullName: l.label,
        value: l.total,
      }))
    if (restTotal > 0) {
      data.push({ name: "Autres", fullName: "Autres", value: restTotal })
    }
    return data
  }, [lignes])

  const compositionData = React.useMemo(() => {
    const patient = lignes.reduce((s, l) => s + l.montantPatient, 0)
    const assurance = lignes.reduce((s, l) => s + l.montantAssurance, 0)
    return [
      { name: "Part patient", value: patient, fill: COLORS.patient },
      { name: "Part assurance", value: assurance, fill: COLORS.assurance },
    ].filter((d) => d.value > 0)
  }, [lignes])

  if (lignes.length === 0) {
    return (
      <Card className="border border-gray-100 shadow-sm rounded-2xl bg-white">
        <CardContent className="py-12 text-center text-sm text-gray-400">
          Aucune donnée à afficher pour ces filtres.
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <Card className="lg:col-span-2 border border-gray-100 shadow-sm rounded-2xl bg-white">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">{vueChartTitle(vue)}</CardTitle>
          <p className="text-xs text-muted-foreground">
            {vue === "jour"
              ? "Évolution journalière (part patient / assurance)"
              : "Top 10 — barres empilées patient + assurance"}
          </p>
        </CardHeader>
        <CardContent className="pt-2">
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              {vue === "jour" ? (
                <AreaChart data={topBars} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="rapportPatient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={COLORS.patient} stopOpacity={0.35} />
                      <stop offset="100%" stopColor={COLORS.patient} stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="rapportAssurance" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={COLORS.assurance} stopOpacity={0.3} />
                      <stop offset="100%" stopColor={COLORS.assurance} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 11, fill: "#6b7280" }}
                    tickLine={false}
                    axisLine={false}
                    dy={8}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "#6b7280" }}
                    tickLine={false}
                    axisLine={false}
                    width={48}
                    tickFormatter={formatAxisCurrency}
                  />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    formatter={(value: number, name: string) => [
                      formatCurrency(value),
                      name === "patient" ? "Part patient" : "Part assurance",
                    ]}
                    labelFormatter={(_, payload) =>
                      String(payload?.[0]?.payload?.fullName ?? "")
                    }
                  />
                  <Legend
                    wrapperStyle={{ fontSize: 12 }}
                    formatter={(value) =>
                      value === "patient" ? "Part patient" : "Part assurance"
                    }
                  />
                  <Area
                    type="monotone"
                    dataKey="patient"
                    stackId="1"
                    stroke={COLORS.patient}
                    fill="url(#rapportPatient)"
                    strokeWidth={2}
                  />
                  <Area
                    type="monotone"
                    dataKey="assurance"
                    stackId="1"
                    stroke={COLORS.assurance}
                    fill="url(#rapportAssurance)"
                    strokeWidth={2}
                  />
                </AreaChart>
              ) : (
                <BarChart
                  data={topBars}
                  layout="vertical"
                  margin={{ top: 4, right: 12, left: 4, bottom: 4 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={false} />
                  <XAxis
                    type="number"
                    tick={{ fontSize: 11, fill: "#6b7280" }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={formatAxisCurrency}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={110}
                    tick={{ fontSize: 11, fill: "#6b7280" }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    formatter={(value: number, name: string) => [
                      formatCurrency(value),
                      name === "patient" ? "Part patient" : "Part assurance",
                    ]}
                    labelFormatter={(_, payload) =>
                      String(payload?.[0]?.payload?.fullName ?? "")
                    }
                  />
                  <Legend
                    wrapperStyle={{ fontSize: 12 }}
                    formatter={(value) =>
                      value === "patient" ? "Part patient" : "Part assurance"
                    }
                  />
                  <Bar dataKey="patient" stackId="a" fill={COLORS.patient} radius={[0, 0, 0, 0]} />
                  <Bar
                    dataKey="assurance"
                    stackId="a"
                    fill={COLORS.assurance}
                    radius={[0, 4, 4, 0]}
                  />
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <Card className="border border-gray-100 shadow-sm rounded-2xl bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Répartition CA</CardTitle>
            <p className="text-xs text-muted-foreground">
              Selon le filtre « {vueChartTitle(vue).replace(/^CA par |^Évolution du /, "")} »
            </p>
          </CardHeader>
          <CardContent>
            <div className="h-[180px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={48}
                    outerRadius={72}
                    paddingAngle={2}
                    stroke="#fff"
                    strokeWidth={2}
                  >
                    {pieData.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={tooltipStyle}
                    formatter={(value: number, _name, item) => [
                      formatCurrency(value),
                      String(
                        (item?.payload as { fullName?: string } | undefined)?.fullName ?? "",
                      ),
                    ]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-2 max-h-28 space-y-1 overflow-y-auto">
              {pieData.map((entry, i) => (
                <div key={entry.fullName} className="flex items-center gap-2 px-1 text-xs">
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-sm"
                    style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }}
                  />
                  <span className="min-w-0 flex-1 truncate text-gray-500">{entry.fullName}</span>
                  <span className="tabular-nums font-medium text-gray-700">
                    {formatCurrency(entry.value)}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border border-gray-100 shadow-sm rounded-2xl bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Patient / Assurance</CardTitle>
          </CardHeader>
          <CardContent>
            {compositionData.length === 0 ? (
              <p className="py-6 text-center text-sm text-gray-400">Aucun montant</p>
            ) : (
              <div className="h-[140px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={compositionData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={36}
                      outerRadius={58}
                      paddingAngle={3}
                      stroke="#fff"
                      strokeWidth={2}
                    >
                      {compositionData.map((d) => (
                        <Cell key={d.name} fill={d.fill} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={tooltipStyle}
                      formatter={(value: number, name: string) => [
                        formatCurrency(value),
                        name,
                      ]}
                    />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
