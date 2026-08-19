"use client"

import * as React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Plus, LayoutGrid, List, MoreHorizontal, Pencil, Receipt, Clock,
  Stethoscope, CalendarDays, Activity, CheckCircle2, Timer, CreditCard,
  Loader2, Filter, RefreshCw, CalendarClock,
  FileX, Eye, ScrollText,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { listVisites } from "@/app/actions/visites"
import type {
  VisiteRow, VisiteStats, MedecinOption, MotifOption, VisiteFilters,
} from "@/app/actions/visites"
import { NouvelleVisiteDialog } from "@/components/visites/nouvelle-visite-dialog"
import {
  ALL_STATUTS,
  STATUT_CONFIG,
  VisiteStatutBadge,
  type VisiteStatut,
} from "@/components/visites/visite-statut-badge"
import {
  KANBAN_STATUTS,
  groupVisitesByKanbanColumn,
  resolveKanbanColumn,
} from "@/lib/visites/kanban-column"
import { format } from "date-fns"
import { fr } from "date-fns/locale"

// ─── types ────────────────────────────────────────────────────────────────────

type ViewMode = "kanban" | "table"

// ─── helpers ──────────────────────────────────────────────────────────────────

function getInitials(patientId: string): string {
  const n = parseInt(patientId, 10)
  const L = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
  return L[n % 26] + L[Math.floor(n / 26) % 26]
}

function formatDT(iso: string) {
  const d = new Date(iso)
  return {
    date: format(d, "dd MMM yyyy", { locale: fr }),
    time: format(d, "HH:mm", { locale: fr }),
    dayLabel: format(d, "EEEE", { locale: fr }),
  }
}

function medecinLabel(v: VisiteRow) {
  const p = v.medecinTitre === "Docteur" ? "Dr." : v.medecinTitre === "Professeur" ? "Pr." : ""
  return p ? `${p} ${v.medecinNom}` : v.medecinNom
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────

function KpiCard({
  icon: Icon, label, value, color,
}: { icon: React.ElementType; label: string; value: number; color: string }) {
  return (
    <div
      className="bg-white rounded-2xl border border-gray-100 px-5 py-4 flex items-center justify-between gap-4 shadow-[0_2px_12px_rgba(0,0,0,0.05)] hover:shadow-[0_4px_20px_rgba(0,0,0,0.08)] transition-shadow duration-200"
    >
      <div>
        <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">{label}</p>
        <p className="text-[28px] font-extrabold leading-none tracking-tight text-gray-800">{value}</p>
      </div>
      <div
        className="h-11 w-11 rounded-2xl flex items-center justify-center shrink-0"
        style={{ backgroundColor: `${color}18` }}
      >
        <Icon className="h-5 w-5" style={{ color }} />
      </div>
    </div>
  )
}

// ─── Kanban card ──────────────────────────────────────────────────────────────

function VisiteCard({ visite }: { visite: VisiteRow }) {
  const { time, date } = formatDT(visite.dateVisite)
  const kanbanCol = resolveKanbanColumn(visite)
  const router = useRouter()

  const accentColor =
    kanbanCol === "EN_ATTENTE" ? "#f59e0b"
    : kanbanCol === "EN_COURS" ? "#3b82f6"
    : kanbanCol === "TERMINEE" ? "#10b981"
    : "#cd3b86"

  return (
    <div
      onClick={() => router.push(`/visites/${visite.id}`)}
      className="group relative bg-white rounded-2xl border border-gray-100/80 hover:border-gray-200 hover:shadow-[0_4px_20px_rgba(0,0,0,0.07)] transition-all duration-200 cursor-pointer overflow-hidden"
    >
      {/* Left accent bar */}
      <div
        className="absolute left-0 top-3 bottom-3 w-[3px] rounded-full opacity-70"
        style={{ backgroundColor: accentColor }}
      />

      <div className="pl-4 pr-3 py-3">
        {/* Top row */}
        <div className="flex items-center justify-between gap-2">
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-semibold text-gray-700 truncate leading-tight">
                {visite.patientLabel ?? (
                  <>
                    Patient{" "}
                    <span className="font-sans text-gray-400 font-normal text-[12px]">
                      #{visite.patientId}
                    </span>
                  </>
                )}
              </p>
              <p className="text-[11px] text-gray-400 mt-0.5 flex items-center gap-1 truncate">
                <Stethoscope className="h-3 w-3 shrink-0 text-gray-300" />
                <span className="truncate">{medecinLabel(visite)}</span>
              </p>
            </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-gray-300 hover:text-gray-500 hover:bg-gray-50"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontal className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem
                className="text-xs gap-2"
                onClick={(e) => { e.stopPropagation(); router.push(`/visites/${visite.id}`) }}
              >
                <Eye className="h-3.5 w-3.5" /> Voir détails
              </DropdownMenuItem>
              <DropdownMenuItem className="text-xs gap-2">
                <Pencil className="h-3.5 w-3.5" /> Modifier
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-xs gap-2"
                onClick={(e) => {
                  e.stopPropagation()
                  router.push(`/feuilles-circulation?visite=${visite.id}`)
                }}
              >
                <ScrollText className="h-3.5 w-3.5" /> Feuille de circulation
              </DropdownMenuItem>
              <DropdownMenuItem className="text-xs gap-2">
                <Receipt className="h-3.5 w-3.5" /> Facturer
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Footer row */}
        <div className="mt-2.5 flex items-center justify-between gap-2">
          <span
            className="text-[10px] font-medium px-2 py-0.5 rounded-full truncate"
            style={{ backgroundColor: `${accentColor}14`, color: accentColor }}
          >
            {visite.motifLibelle}
          </span>
          <div className="flex items-center gap-1 text-[11px] text-gray-400 shrink-0">
            <CalendarClock className="h-3 w-3 text-gray-300" />
            <span>{date}</span>
            <span className="font-medium text-gray-500">{time}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Kanban view ──────────────────────────────────────────────────────────────

function KanbanView({ visites }: { visites: VisiteRow[] }) {
  const grouped = React.useMemo(
    () => groupVisitesByKanbanColumn(visites),
    [visites],
  )

  const columnHints: Partial<Record<VisiteStatut, string>> = {
    EN_COURS: "Paramètres patient saisis",
    TERMINEE: "Dès le lendemain, hors hospitalisation",
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {KANBAN_STATUTS.map((statut) => {
        const cfg = STATUT_CONFIG[statut]
        const items = grouped[statut]
        const hint = columnHints[statut]
        return (
          <div key={statut} className="flex flex-col">
            {/* Column header */}
            <div className="flex items-center justify-between px-1 mb-2.5">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className={`h-2 w-2 rounded-full shrink-0 ${cfg.dot}`} />
                  <span className="text-[12px] font-semibold text-gray-500 uppercase tracking-wider">
                    {cfg.label}
                  </span>
                </div>
                {hint ? (
                  <p className="mt-0.5 pl-3.5 text-[10px] text-gray-400 leading-snug">{hint}</p>
                ) : null}
              </div>
              <span className="text-[11px] font-semibold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full shrink-0 ml-2">
                {items.length}
              </span>
            </div>

            {/* Cards */}
            <ScrollArea className="flex-1 max-h-[calc(100vh-300px)]">
              <div className="space-y-2 pr-0.5 pb-2">
                {items.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-gray-150 bg-gray-50/40 py-8 flex flex-col items-center gap-1.5">
                    <FileX className="h-5 w-5 text-gray-200" />
                    <p className="text-[11px] text-gray-300 font-medium">Aucune visite</p>
                  </div>
                ) : (
                  items.map((v) => <VisiteCard key={v.id} visite={v} />)
                )}
              </div>
            </ScrollArea>
          </div>
        )
      })}
    </div>
  )
}

// ─── Table view ───────────────────────────────────────────────────────────────

function TableView({ visites }: { visites: VisiteRow[] }) {
  const router = useRouter()
  if (visites.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-gray-100 shadow-sm">
        <div className="h-14 w-14 rounded-2xl bg-gray-50 flex items-center justify-center mb-3">
          <FileX className="h-7 w-7 text-gray-300" />
        </div>
        <p className="text-sm font-semibold text-gray-500">Aucune visite pour cette période</p>
        <p className="text-xs text-gray-400 mt-1">Modifiez les filtres ou créez une nouvelle visite.</p>
      </div>
    )
  }

  return (
    <Card className="border border-gray-100 shadow-sm rounded-2xl overflow-hidden">
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50/80 hover:bg-gray-50/80 border-b border-gray-100">
              <TableHead className="text-[11px] font-bold text-gray-500 uppercase tracking-wide py-3">Patient</TableHead>
              <TableHead className="hidden sm:table-cell text-[11px] font-bold text-gray-500 uppercase tracking-wide py-3">Médecin</TableHead>
              <TableHead className="text-[11px] font-bold text-gray-500 uppercase tracking-wide py-3">Date / Heure</TableHead>
              <TableHead className="hidden md:table-cell text-[11px] font-bold text-gray-500 uppercase tracking-wide py-3">Motif</TableHead>
              <TableHead className="text-[11px] font-bold text-gray-500 uppercase tracking-wide py-3">Statut</TableHead>
              <TableHead className="w-[44px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {visites.map((v, i) => {
              const { date, time } = formatDT(v.dateVisite)
              return (
                <TableRow
                  key={v.id}
                  onClick={() => router.push(`/visites/${v.id}`)}
                  className={`hover:bg-[#cd3b86]/3 transition-colors border-b border-gray-50 cursor-pointer ${i % 2 === 0 ? "" : "bg-gray-50/30"}`}
                >
                  <TableCell className="py-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8 shrink-0">
                        <AvatarFallback className="bg-[#cd3b86]/10 text-[#cd3b86] text-xs font-bold">
                          {v.patientLabel
                            ? v.patientLabel.charAt(0).toUpperCase()
                            : getInitials(v.patientId)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <span className="font-semibold text-sm text-gray-800">
                          {v.patientLabel ?? `Patient #${v.patientId}`}
                        </span>
                        {v.patientLabel && (
                          <p className="text-[11px] text-gray-400 font-sans">#{v.patientId}</p>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell py-3 text-sm text-gray-600">
                    {medecinLabel(v)}
                  </TableCell>
                  <TableCell className="py-3">
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-gray-800">{date}</span>
                      <span className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                        <Clock className="h-3 w-3" />{time}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell py-3">
                    <span className="text-xs font-medium text-gray-600 bg-gray-100 px-2.5 py-1 rounded-full">
                      {v.motifLibelle}
                    </span>
                  </TableCell>
                  <TableCell className="py-3">
                    <VisiteStatutBadge statut={v.statut} />
                  </TableCell>
                  <TableCell className="py-3">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-400 hover:text-gray-600">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40">
                        <DropdownMenuItem
                          className="text-xs gap-2"
                          onClick={(e) => { e.stopPropagation(); router.push(`/visites/${v.id}`) }}
                        >
                          <Eye className="h-3.5 w-3.5" /> Voir détails
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-xs gap-2">
                          <Pencil className="h-3.5 w-3.5" /> Modifier
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-xs gap-2"
                          onClick={(e) => {
                            e.stopPropagation()
                            router.push(`/feuilles-circulation?visite=${v.id}`)
                          }}
                        >
                          <ScrollText className="h-3.5 w-3.5" /> Feuille de circulation
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-xs gap-2">
                          <Receipt className="h-3.5 w-3.5" /> Facturer
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────

interface Props {
  initialVisites: VisiteRow[]
  stats: VisiteStats
  medecins: MedecinOption[]
  motifs: MotifOption[]
}

export function VisitesClient({ initialVisites, stats, medecins, motifs }: Props) {
  const [viewMode, setViewMode] = React.useState<ViewMode>("kanban")
  const [periode, setPeriode] = React.useState("week")
  const [filterMedecinId, setFilterMedecinId] = React.useState("all")
  const [filterStatut, setFilterStatut] = React.useState("all")
  const [visites, setVisites] = React.useState<VisiteRow[]>(initialVisites)
  const [loading, setLoading] = React.useState(false)
  const [dialogOpen, setDialogOpen] = React.useState(false)

  const activeFiltersCount = [
    periode !== "week",
    filterMedecinId !== "all",
    filterStatut !== "all",
  ].filter(Boolean).length

  const fetchVisites = React.useCallback(async (filters: VisiteFilters) => {
    setLoading(true)
    try { setVisites(await listVisites(filters)) }
    finally { setLoading(false) }
  }, [])

  const applyFilters = React.useCallback((p: string, m: string, s: string) => {
    fetchVisites({
      periode: p !== "all" ? p : undefined,
      medecinId: m !== "all" ? m : undefined,
      statut: s !== "all" ? s : undefined,
    })
  }, [fetchVisites])

  const handleCreated = React.useCallback(() => {
    applyFilters(periode, filterMedecinId, filterStatut)
  }, [applyFilters, periode, filterMedecinId, filterStatut])

  function resetFilters() {
    setPeriode("week"); setFilterMedecinId("all"); setFilterStatut("all")
    fetchVisites({ periode: "week" })
  }

  return (
    <>
      <NouvelleVisiteDialog open={dialogOpen} onClose={() => setDialogOpen(false)}
        medecins={medecins} motifs={motifs} onCreated={() => handleCreated()} />

      <div className="space-y-5">
        {/* ── Page header ─────────────────────────────── */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">Visites</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Gestion des consultations et rendez-vous patients
            </p>
          </div>
          <Button
            onClick={() => setDialogOpen(true)}
            className="gap-2 bg-gradient-to-r from-[#cd3b86] to-[#b8307a] hover:from-[#b8307a] hover:to-[#9b2563] text-white shadow-sm"
          >
            <Plus className="h-4 w-4" />
            Nouvelle visite
          </Button>
        </div>

        {/* ── KPI row ─────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <KpiCard icon={CalendarDays} label="Aujourd'hui"  value={stats.aujourd_hui} color="#cd3b86" />
          <KpiCard icon={Activity}     label="Total"         value={stats.total}        color="#525252" />
          <KpiCard icon={Timer}        label="En attente"    value={stats.enAttente}    color="#f59e0b" />
          <KpiCard icon={CreditCard}   label="Facturées"     value={stats.facturees}    color="#cd3b86" />
          <KpiCard icon={Stethoscope}  label="En consultation" value={stats.enCours}    color="#3b82f6" />
          <KpiCard icon={CheckCircle2} label="Terminées"     value={stats.terminees}    color="#10b981" />
        </div>

        {/* ── Filter bar ──────────────────────────────── */}
        <Card className="border border-gray-100 shadow-sm rounded-2xl bg-white">
          <CardContent className="px-4 py-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap items-center gap-2">
                {/* Filter icon badge */}
                <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-500">
                  <Filter className="h-3.5 w-3.5" />
                  Filtres
                  {activeFiltersCount > 0 && (
                    <span className="bg-[#cd3b86] text-white text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center">
                      {activeFiltersCount}
                    </span>
                  )}
                </div>
                <div className="w-px h-4 bg-gray-200" />

                {/* Période */}
                <Select value={periode} onValueChange={(v) => {
                  setPeriode(v); applyFilters(v, filterMedecinId, filterStatut)
                }}>
                  <SelectTrigger className="h-8 w-[155px] text-xs bg-gray-50 border-gray-200 rounded-lg">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="today">Aujourd&apos;hui</SelectItem>
                    <SelectItem value="yesterday">Hier</SelectItem>
                    <SelectItem value="week">7 derniers jours</SelectItem>
                    <SelectItem value="month">Ce mois</SelectItem>
                    <SelectItem value="all">Toutes les dates</SelectItem>
                  </SelectContent>
                </Select>

                {/* Médecin */}
                {medecins.length > 0 && (
                  <Select value={filterMedecinId} onValueChange={(v) => {
                    setFilterMedecinId(v); applyFilters(periode, v, filterStatut)
                  }}>
                    <SelectTrigger className="h-8 w-[170px] text-xs bg-gray-50 border-gray-200 rounded-lg">
                      <SelectValue placeholder="Tous les médecins" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les médecins</SelectItem>
                      {medecins.map((m) => (
                        <SelectItem key={m.id} value={m.id}>
                          {m.titre === "Docteur" ? `Dr. ${m.nom}` : m.titre === "Professeur" ? `Pr. ${m.nom}` : m.nom}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}

                {/* Statut */}
                <Select value={filterStatut} onValueChange={(v) => {
                  setFilterStatut(v); applyFilters(periode, filterMedecinId, v)
                }}>
                  <SelectTrigger className="h-8 w-[140px] text-xs bg-gray-50 border-gray-200 rounded-lg">
                    <SelectValue placeholder="Tous statuts" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous statuts</SelectItem>
                    {ALL_STATUTS.map((s) => (
                      <SelectItem key={s} value={s}>{STATUT_CONFIG[s].label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Reset */}
                {activeFiltersCount > 0 && (
                  <Button variant="ghost" size="sm" onClick={resetFilters}
                    className="h-8 text-xs text-gray-400 hover:text-gray-600 gap-1 px-2">
                    <RefreshCw className="h-3 w-3" /> Réinitialiser
                  </Button>
                )}

                {loading && (
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-[#cd3b86]" />
                )}
              </div>

              {/* View toggle */}
              <div className="flex items-center gap-0.5 bg-gray-100 rounded-lg p-0.5 shrink-0">
                <button
                  onClick={() => setViewMode("kanban")}
                  className={`flex items-center gap-1.5 h-7 px-3 text-xs font-medium rounded-md transition-all ${
                    viewMode === "kanban"
                      ? "bg-white shadow-sm text-[#cd3b86]"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  <LayoutGrid className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Kanban</span>
                </button>
                <button
                  onClick={() => setViewMode("table")}
                  className={`flex items-center gap-1.5 h-7 px-3 text-xs font-medium rounded-md transition-all ${
                    viewMode === "table"
                      ? "bg-white shadow-sm text-[#cd3b86]"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  <List className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Liste</span>
                </button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Result count */}
        <p className="text-[11px] text-gray-400 font-medium -mt-2">
          {loading ? "Chargement…" : `${visites.length} visite${visites.length > 1 ? "s" : ""} affichée${visites.length > 1 ? "s" : ""}`}
        </p>

        {/* ── View content ────────────────────────────── */}
        <div className={`transition-opacity duration-150 ${loading ? "opacity-50 pointer-events-none" : ""}`}>
          {viewMode === "kanban" ? <KanbanView visites={visites} /> : <TableView visites={visites} />}
        </div>
      </div>
    </>
  )
}
