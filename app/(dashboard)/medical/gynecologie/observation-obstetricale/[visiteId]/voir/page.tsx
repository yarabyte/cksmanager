"use client"

import * as React from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  ArrowLeft,
  Baby,
  Loader2,
  CalendarDays,
  Stethoscope,
  Pencil,
  ClipboardList,
  MessageSquareText,
  Hand,
  Scan,
  Lightbulb,
  ChevronLeft,
  ChevronRight,
  type LucideIcon,
} from "lucide-react"
import { useObservationObstetricaleByVisite } from "@/hooks/use-observation-obstetricale"
import type { ObservationObstetricaleDetail } from "@/app/actions/observation-obstetricale"
import {
  OBS_OBST_TABS,
  type ObsObstTabDef,
} from "@/components/medical/observation-obstetricale/fields"
import { cn } from "@/lib/utils"

const BASE = "/medical/gynecologie/observation-obstetricale"

const TAB_ICONS: Record<string, LucideIcon> = {
  motif: ClipboardList,
  interrogatoire: MessageSquareText,
  examen: Hand,
  toucher: Stethoscope,
  echo: Scan,
  hypotheses: Lightbulb,
}

function displayValue(v: string | number | null | undefined): string {
  if (v == null || String(v).trim() === "") return "—"
  return String(v)
}

function isFilled(v: string | number | null | undefined): boolean {
  return v != null && String(v).trim() !== ""
}

function countFilled(
  tab: ObsObstTabDef,
  observation: ObservationObstetricaleDetail | null,
) {
  if (!observation) return 0
  return tab.fields.filter((f) => isFilled(observation[f.key])).length
}

function patientInitials(label: string | null, patientId: string) {
  if (!label) return patientId.slice(-2)
  const parts = label
    .replace(/^(Mme|Mlle|M\.|Dr)\s+/i, "")
    .split(/\s+/)
    .filter(Boolean)
  if (parts.length >= 2) return `${parts[0]![0]}${parts[1]![0]}`.toUpperCase()
  return (parts[0] ?? "P").slice(0, 2).toUpperCase()
}

export default function ObservationObstetricaleViewPage() {
  const params = useParams()
  const visiteId = params.visiteId as string
  const { data, isPending, error } =
    useObservationObstetricaleByVisite(visiteId)
  const [activeTab, setActiveTab] = React.useState(OBS_OBST_TABS[0]!.id)

  if (isPending) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-28">
        <Loader2 className="h-10 w-10 animate-spin text-[#cd3b86]" />
        <p className="text-sm text-gray-500">Chargement de la fiche…</p>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="space-y-6 pb-10">
        <Button variant="ghost" className="rounded-xl -ml-2" asChild>
          <Link href={BASE}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Link>
        </Button>
        <div className="rounded-2xl border border-gray-100 bg-white px-6 py-12 text-center shadow-[0_2px_16px_rgba(0,0,0,0.05)]">
          <Baby className="h-10 w-10 text-gray-300 mx-auto mb-3" />
          <p className="text-lg font-bold text-gray-800">Visite introuvable</p>
          <Button
            asChild
            className="mt-6 rounded-xl bg-[#cd3b86] hover:bg-[#b8307a]"
          >
            <Link href={BASE}>Retour à la liste</Link>
          </Button>
        </div>
      </div>
    )
  }

  const { visite, observation } = data
  const tabIndex = OBS_OBST_TABS.findIndex((t) => t.id === activeTab)

  function goTab(delta: number) {
    const next = tabIndex + delta
    if (next < 0 || next >= OBS_OBST_TABS.length) return
    setActiveTab(OBS_OBST_TABS[next]!.id)
  }

  return (
    <div className="relative space-y-5 pb-12">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[360px] bg-[radial-gradient(ellipse_80%_60%_at_20%_0%,_rgba(205,59,134,0.1),_transparent_55%)]"
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Button
          variant="ghost"
          className="rounded-xl -ml-2 w-fit text-gray-500 hover:text-gray-800"
          asChild
        >
          <Link href={BASE}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Observation obstétricale
          </Link>
        </Button>
        <Button
          className="rounded-xl h-10 bg-[#cd3b86] hover:bg-[#b8307a] text-white gap-2 w-fit"
          asChild
        >
          <Link href={`${BASE}/${visiteId}`}>
            <Pencil className="h-4 w-4" />
            Modifier
          </Link>
        </Button>
      </div>

      <header className="relative overflow-hidden rounded-2xl border border-white/70 bg-white/85 shadow-[0_8px_32px_rgba(15,23,42,0.06)] backdrop-blur-sm">
        <div className="h-1.5 bg-gradient-to-r from-[#cd3b86] via-[#e879b3] to-[#58a639]" />
        <div className="px-5 sm:px-6 py-5">
          <div className="flex items-start gap-4 min-w-0">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#cd3b86] to-[#a82e6d] text-base font-bold text-white shadow-lg shadow-[#cd3b86]/20">
              {patientInitials(visite.patientLabel, visite.patientId)}
            </div>
            <div className="min-w-0 space-y-2">
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#cd3b86]">
                Lecture · Observation obstétricale
              </p>
              <h1 className="font-['DM_Sans',sans-serif] text-xl sm:text-2xl font-extrabold text-gray-900 leading-snug break-words">
                {visite.patientLabel ?? `Patiente #${visite.patientId}`}
              </h1>
              <div className="flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-gray-50 px-2.5 py-1 text-xs text-gray-600 ring-1 ring-gray-100">
                  <CalendarDays className="h-3.5 w-3.5 text-[#cd3b86]/70" />
                  {format(new Date(visite.dateVisite), "dd MMM yyyy · HH:mm", {
                    locale: fr,
                  })}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-gray-50 px-2.5 py-1 text-xs text-gray-600 ring-1 ring-gray-100">
                  <Stethoscope className="h-3.5 w-3.5 text-[#cd3b86]/70" />
                  {visite.motifLibelle}
                </span>
                {visite.patientAge != null && (
                  <span className="inline-flex items-center gap-1.5 rounded-lg bg-gray-50 px-2.5 py-1 text-xs text-gray-600 ring-1 ring-gray-100">
                    {visite.patientAge} an{visite.patientAge > 1 ? "s" : ""}
                  </span>
                )}
                <Badge
                  variant="secondary"
                  className="rounded-full border-0 bg-gray-100 text-gray-600"
                >
                  Visite #{visite.id}
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </header>

      {!observation ? (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-white px-6 py-14 text-center">
          <Baby className="h-10 w-10 text-gray-300 mx-auto mb-3" />
          <p className="font-semibold text-gray-800">Aucune fiche saisie</p>
          <p className="text-sm text-gray-500 mt-1">
            Cette visite n’a pas encore d’observation obstétricale.
          </p>
          <Button
            asChild
            className="mt-6 rounded-xl bg-[#cd3b86] hover:bg-[#b8307a]"
          >
            <Link href={`${BASE}/${visiteId}`}>Saisir la fiche</Link>
          </Button>
        </div>
      ) : (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="gap-4">
          <div className="sticky top-0 z-20 -mx-1 px-1 py-1">
            <div className="rounded-2xl border border-white/80 bg-white/90 p-1.5 shadow-[0_4px_24px_rgba(15,23,42,0.06)] backdrop-blur-md">
              <TabsList className="h-auto w-full flex flex-nowrap justify-start gap-1 overflow-x-auto bg-transparent p-0 scrollbar-none">
                {OBS_OBST_TABS.map((tab) => {
                  const Icon = TAB_ICONS[tab.id] ?? Baby
                  const filled = countFilled(tab, observation)
                  const total = tab.fields.length
                  return (
                    <TabsTrigger
                      key={tab.id}
                      value={tab.id}
                      className={cn(
                        "group relative flex h-auto shrink-0 flex-col items-start gap-0.5 rounded-xl px-3 py-2.5 text-left transition-all",
                        "data-[state=active]:shadow-md data-[state=active]:shadow-[#cd3b86]/10",
                        "text-gray-500 data-[state=active]:bg-[#cd3b86] data-[state=active]:text-white",
                      )}
                    >
                      <span className="flex items-center gap-1.5">
                        <Icon className="h-3.5 w-3.5 opacity-80" />
                        <span className="text-[11px] font-bold whitespace-nowrap">
                          <span className="sm:hidden">
                            {tab.shortLabel ?? tab.label}
                          </span>
                          <span className="hidden sm:inline">{tab.label}</span>
                        </span>
                      </span>
                      <span className="text-[10px] font-medium tabular-nums text-gray-400 group-data-[state=active]:text-white/75">
                        {filled}/{total}
                      </span>
                    </TabsTrigger>
                  )
                })}
              </TabsList>
            </div>
          </div>

          {OBS_OBST_TABS.map((tab) => {
            const Icon = TAB_ICONS[tab.id] ?? Baby
            const filled = countFilled(tab, observation)
            return (
              <TabsContent
                key={tab.id}
                value={tab.id}
                className="mt-0 outline-none animate-in fade-in-0 slide-in-from-bottom-2 duration-300"
              >
                <section className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-[0_4px_28px_rgba(15,23,42,0.05)]">
                  <div className="flex items-start gap-3 border-b border-gray-50 bg-gradient-to-r from-gray-50/90 to-white px-5 py-4 sm:px-6">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#cd3b86]/10 text-[#cd3b86]">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1 pt-0.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="font-['DM_Sans',sans-serif] text-lg font-bold text-gray-900">
                          {tab.label}
                        </h2>
                        <Badge
                          variant="secondary"
                          className="rounded-full border-0 bg-gray-100 text-[10px] font-semibold text-gray-600"
                        >
                          {filled}/{tab.fields.length} renseignés
                        </Badge>
                      </div>
                      <p className="mt-0.5 text-xs text-gray-500">
                        {tab.description}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-gray-100/80 p-0">
                    {tab.fields.map((f) => {
                      const value = observation[f.key]
                      const filledField = isFilled(value)
                      return (
                        <div
                          key={f.key}
                          className={cn(
                            "px-5 py-3.5",
                            f.kind === "textarea" && "sm:col-span-2",
                            filledField ? "bg-[#58a639]/[0.03]" : "bg-white",
                          )}
                        >
                          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                            {f.label}
                          </p>
                          <p
                            className={cn(
                              "mt-1 text-sm font-medium whitespace-pre-wrap leading-relaxed",
                              filledField ? "text-gray-900" : "text-gray-300",
                            )}
                          >
                            {displayValue(value)}
                          </p>
                        </div>
                      )
                    })}
                  </div>

                  <div className="flex items-center justify-between gap-2 border-t border-gray-50 bg-gray-50/50 px-4 py-3 sm:px-6">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="rounded-lg text-xs text-gray-500"
                      disabled={tabIndex <= 0}
                      onClick={() => goTab(-1)}
                    >
                      <ChevronLeft className="h-3.5 w-3.5 mr-1" />
                      Précédent
                    </Button>
                    <p className="text-[11px] text-gray-400 tabular-nums">
                      Onglet {tabIndex + 1} / {OBS_OBST_TABS.length}
                    </p>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="rounded-lg text-xs text-gray-500"
                      disabled={tabIndex >= OBS_OBST_TABS.length - 1}
                      onClick={() => goTab(1)}
                    >
                      Suivant
                      <ChevronRight className="h-3.5 w-3.5 ml-1" />
                    </Button>
                  </div>
                </section>
              </TabsContent>
            )
          })}
        </Tabs>
      )}
    </div>
  )
}
