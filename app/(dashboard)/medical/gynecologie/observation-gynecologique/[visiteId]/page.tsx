"use client"

import * as React from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  ArrowLeft,
  Flower2,
  Loader2,
  Save,
  CalendarDays,
  Stethoscope,
  UserRound,
  AlertTriangle,
  CheckCircle2,
  ClipboardList,
  MessageSquareText,
  Hand,
  Scan,
  Lightbulb,
  ChevronLeft,
  ChevronRight,
  Cloud,
  CloudOff,
  Check,
  type LucideIcon,
} from "lucide-react"
import {
  useObservationGynecologiqueByVisite,
  useObservationGynecologiqueMutations,
} from "@/hooks/use-observation-gynecologique"
import type { ObservationGynecologiqueDetail } from "@/app/actions/observation-gynecologique"
import {
  OBS_GYNECO_TABS,
  emptyObsGynecoForm,
  type ObsGynecoFieldKey,
  type ObsGynecoFormState,
  type ObsGynecoTabDef,
} from "@/components/medical/observation-gynecologique/fields"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

const BASE = "/medical/gynecologie/observation-gynecologique"

const TAB_ICONS: Record<string, LucideIcon> = {
  motifs: ClipboardList,
  interrogatoire: MessageSquareText,
  examen: Hand,
  echo: Scan,
  hypotheses: Lightbulb,
}

const fieldInput =
  "rounded-xl h-11 bg-white/90 border-gray-200/80 shadow-[inset_0_1px_2px_rgba(0,0,0,0.03)] focus-visible:bg-white focus-visible:ring-[#cd3b86]/30 focus-visible:border-[#cd3b86]/40 transition-all"
const fieldTextarea =
  "rounded-xl min-h-[100px] bg-white/90 border-gray-200/80 shadow-[inset_0_1px_2px_rgba(0,0,0,0.03)] focus-visible:bg-white focus-visible:ring-[#cd3b86]/30 focus-visible:border-[#cd3b86]/40 transition-all resize-y"

function Field({
  label,
  htmlFor,
  children,
  className,
  filled,
  danger,
  hint,
}: {
  label: string
  htmlFor?: string
  children: React.ReactNode
  className?: string
  filled?: boolean
  danger?: boolean
  hint?: string
}) {
  return (
    <div
      className={cn(
        "group relative space-y-1.5 rounded-xl border px-3.5 py-3 transition-colors",
        danger
          ? "border-red-100 bg-red-50/40 hover:border-red-200"
          : filled
            ? "border-[#58a639]/20 bg-[#58a639]/[0.04] hover:border-[#58a639]/35"
            : "border-gray-100 bg-gray-50/40 hover:border-gray-200 hover:bg-white",
        className,
      )}
    >
      <Label
        htmlFor={htmlFor}
        className={cn(
          "text-[11px] font-bold uppercase tracking-wider",
          danger ? "text-red-600/80" : "text-gray-500",
        )}
      >
        {label}
      </Label>
      {children}
      {hint ? <p className="text-[10px] text-gray-400">{hint}</p> : null}
    </div>
  )
}

function detailToForm(
  o: ObservationGynecologiqueDetail | null,
): ObsGynecoFormState {
  const form = emptyObsGynecoForm()
  if (o) {
    for (const key of Object.keys(form) as ObsGynecoFieldKey[]) {
      const v = o[key]
      form[key] = v == null ? "" : String(v)
    }
  }
  return form
}

function countFilled(tab: ObsGynecoTabDef, form: ObsGynecoFormState) {
  return tab.fields.filter((f) => form[f.key].trim() !== "").length
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

export default function ObservationGynecologiqueDetailPage() {
  const params = useParams()
  const router = useRouter()
  const visiteId = params.visiteId as string

  const { data, isPending, error } =
    useObservationGynecologiqueByVisite(visiteId)
  const { upsert } = useObservationGynecologiqueMutations()
  const [form, setForm] = React.useState<ObsGynecoFormState>(emptyObsGynecoForm)
  const [hydrated, setHydrated] = React.useState(false)
  const [activeTab, setActiveTab] = React.useState(OBS_GYNECO_TABS[0]!.id)
  const [saveStatus, setSaveStatus] = React.useState<
    "idle" | "dirty" | "saving" | "saved" | "error"
  >("idle")
  const formRef = React.useRef(form)
  const editGenRef = React.useRef(0)
  formRef.current = form

  React.useEffect(() => {
    if (!data || hydrated) return
    setForm(detailToForm(data.observation))
    setHydrated(true)
    setSaveStatus(data.observation ? "saved" : "idle")
  }, [data, hydrated])

  function setField(key: ObsGynecoFieldKey, value: string) {
    editGenRef.current += 1
    setSaveStatus("dirty")
    setForm((s) => ({ ...s, [key]: value }))
  }

  React.useEffect(() => {
    if (!hydrated || !data?.eligible || editGenRef.current === 0) return

    const t = setTimeout(() => {
      void (async () => {
        setSaveStatus("saving")
        const genAtStart = editGenRef.current
        try {
          await upsert.mutateAsync({ visiteId, ...formRef.current })
          if (editGenRef.current === genAtStart) {
            setSaveStatus("saved")
          }
        } catch (err) {
          if (editGenRef.current === genAtStart) {
            setSaveStatus("error")
            toast.error(
              err instanceof Error
                ? err.message
                : "Erreur d’enregistrement automatique",
            )
          }
        }
      })()
    }, 800)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form, hydrated, data?.eligible, visiteId])

  const tabIndex = OBS_GYNECO_TABS.findIndex((t) => t.id === activeTab)
  const currentTab = OBS_GYNECO_TABS[tabIndex] ?? OBS_GYNECO_TABS[0]!

  const filledTotal = React.useMemo(
    () => Object.values(form).filter((v) => v.trim() !== "").length,
    [form],
  )
  const fieldTotal = OBS_GYNECO_TABS.reduce((n, t) => n + t.fields.length, 0)
  const progressPct =
    fieldTotal > 0 ? Math.round((filledTotal / fieldTotal) * 100) : 0

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!data?.eligible) {
      toast.error("Visite non éligible.")
      return
    }
    try {
      setSaveStatus("saving")
      await upsert.mutateAsync({ visiteId, ...form })
      setSaveStatus("saved")
      toast.success("Observation gynécologique enregistrée.")
      router.push(BASE)
    } catch (err) {
      setSaveStatus("error")
      toast.error(
        err instanceof Error ? err.message : "Erreur d’enregistrement",
      )
    }
  }

  function goTab(delta: number) {
    const next = tabIndex + delta
    if (next < 0 || next >= OBS_GYNECO_TABS.length) return
    setActiveTab(OBS_GYNECO_TABS[next]!.id)
  }

  if (isPending) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-28">
        <div className="relative">
          <div className="absolute inset-0 animate-ping rounded-full bg-[#cd3b86]/15" />
          <Loader2 className="relative h-10 w-10 animate-spin text-[#cd3b86]" />
        </div>
        <p className="text-sm text-gray-500">
          Chargement de l’observation…
        </p>
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
          <Flower2 className="h-10 w-10 text-gray-300 mx-auto mb-3" />
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

  const { visite, eligible, observation } = data
  const busy = upsert.isPending || saveStatus === "saving"
  const alreadySaved = !!observation || saveStatus === "saved"
  const TabIcon = TAB_ICONS[currentTab.id] ?? Flower2

  const saveStatusLabel =
    saveStatus === "saving"
      ? "Enregistrement…"
      : saveStatus === "saved"
        ? "Enregistré automatiquement"
        : saveStatus === "dirty"
          ? "Modifications en cours…"
          : saveStatus === "error"
            ? "Échec de l’enregistrement"
            : "Sauvegarde automatique"

  return (
    <div className="relative pb-28">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[420px] bg-[radial-gradient(ellipse_80%_60%_at_20%_0%,_rgba(205,59,134,0.12),_transparent_55%),radial-gradient(ellipse_60%_50%_at_90%_10%,_rgba(88,166,57,0.08),_transparent_50%)]"
      />

      <div className="mb-4 flex items-center justify-between gap-3">
        <Button
          variant="ghost"
          className="rounded-xl -ml-2 w-fit text-gray-500 hover:text-gray-800"
          asChild
        >
          <Link href={BASE}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Observation gynécologique
          </Link>
        </Button>
        <p className="text-[11px] font-medium text-gray-400 tabular-nums">
          Visite #{visite.id}
        </p>
      </div>

      <header className="relative mb-5 overflow-hidden rounded-2xl border border-white/70 bg-white/80 shadow-[0_8px_32px_rgba(15,23,42,0.06)] backdrop-blur-sm">
        <div className="h-1.5 bg-gradient-to-r from-[#cd3b86] via-[#e879b3] to-[#58a639]" />
        <div className="px-5 sm:px-6 py-5">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-4 min-w-0">
              <div className="relative shrink-0">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#cd3b86] to-[#a82e6d] text-lg font-bold text-white shadow-lg shadow-[#cd3b86]/25">
                  {patientInitials(visite.patientLabel, visite.patientId)}
                </div>
                <div className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-lg border-2 border-white bg-white text-[#cd3b86] shadow-sm">
                  <UserRound className="h-3.5 w-3.5" />
                </div>
              </div>
              <div className="min-w-0 space-y-2">
                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#cd3b86]">
                  Médical · Observation gynécologique
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
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4 shrink-0">
              <div className="hidden sm:flex flex-col items-end gap-1 min-w-[120px]">
                <div className="flex items-center justify-between w-full gap-3 text-[11px] font-semibold text-gray-500">
                  <span>Complétion</span>
                  <span className="tabular-nums text-gray-800">
                    {progressPct}%
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#cd3b86] to-[#58a639] transition-all duration-500 ease-out"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
                <p className="text-[10px] text-gray-400 tabular-nums">
                  {filledTotal}/{fieldTotal} champs
                </p>
              </div>
              {alreadySaved ? (
                <Badge className="gap-1.5 rounded-full border-0 bg-[#58a639]/10 text-[#58a639] hover:bg-[#58a639]/10 px-3 py-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Déjà saisie
                </Badge>
              ) : (
                <Badge
                  variant="secondary"
                  className="gap-1.5 rounded-full border-0 bg-amber-50 text-amber-700 px-3 py-1.5"
                >
                  À compléter
                </Badge>
              )}
            </div>
          </div>
        </div>
      </header>

      {!eligible && (
        <div className="mb-5 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3.5 text-sm text-amber-900">
          <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600 mt-0.5" />
          <p>
            Cette visite n’est pas éligible : patiente féminine et part patient
            (feuille ou facture) soldée requises.
          </p>
        </div>
      )}

      <form id="obs-gyneco-form" onSubmit={(e) => void handleSubmit(e)}>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="gap-4">
          <div className="sticky top-0 z-20 -mx-1 px-1 py-1">
            <div className="rounded-2xl border border-white/80 bg-white/90 p-1.5 shadow-[0_4px_24px_rgba(15,23,42,0.06)] backdrop-blur-md">
              <TabsList className="h-auto w-full flex flex-nowrap justify-start gap-1 overflow-x-auto bg-transparent p-0 scrollbar-none">
                {OBS_GYNECO_TABS.map((tab) => {
                  const Icon = TAB_ICONS[tab.id] ?? Flower2
                  const filled = countFilled(tab, form)
                  const total = tab.fields.length
                  const complete = filled === total && total > 0
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
                        {complete ? " · OK" : ""}
                      </span>
                    </TabsTrigger>
                  )
                })}
              </TabsList>
            </div>
          </div>

          {OBS_GYNECO_TABS.map((tab) => {
            const Icon = TAB_ICONS[tab.id] ?? Flower2
            const filled = countFilled(tab, form)
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

                  <div className="p-4 sm:p-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {tab.fields.map((f) => {
                        const filledField = form[f.key].trim() !== ""
                        const spanFull = f.kind === "textarea"
                        return (
                          <Field
                            key={f.key}
                            label={f.label}
                            htmlFor={f.key}
                            filled={filledField}
                            hint={f.hint}
                            className={spanFull ? "sm:col-span-2" : undefined}
                          >
                            {f.kind === "textarea" ? (
                              <Textarea
                                id={f.key}
                                className={fieldTextarea}
                                value={form[f.key]}
                                onChange={(e) =>
                                  setField(f.key, e.target.value)
                                }
                                placeholder="—"
                                disabled={!eligible}
                              />
                            ) : (
                              <Input
                                id={f.key}
                                type="text"
                                className={fieldInput}
                                value={form[f.key]}
                                onChange={(e) =>
                                  setField(f.key, e.target.value)
                                }
                                placeholder="—"
                                disabled={!eligible}
                              />
                            )}
                          </Field>
                        )
                      })}
                    </div>
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
                      Onglet {tabIndex + 1} / {OBS_GYNECO_TABS.length}
                    </p>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="rounded-lg text-xs text-gray-500"
                      disabled={tabIndex >= OBS_GYNECO_TABS.length - 1}
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

        <div className="fixed bottom-0 right-0 z-30 border-t border-gray-100/80 bg-white/90 backdrop-blur-md supports-[backdrop-filter]:bg-white/75 left-[var(--dashboard-sidebar-offset,0px)]">
          <div className="flex items-center justify-between gap-3 px-4 py-3 sm:px-6">
            <div className="flex items-center gap-3 min-w-0 text-xs">
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-medium",
                  saveStatus === "saving" && "bg-sky-50 text-sky-700",
                  saveStatus === "saved" && "bg-[#58a639]/10 text-[#58a639]",
                  saveStatus === "dirty" && "bg-amber-50 text-amber-700",
                  saveStatus === "error" && "bg-red-50 text-red-700",
                  saveStatus === "idle" && "bg-gray-50 text-gray-500",
                )}
              >
                {saveStatus === "saving" ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : saveStatus === "saved" ? (
                  <Check className="h-3.5 w-3.5" />
                ) : saveStatus === "error" ? (
                  <CloudOff className="h-3.5 w-3.5" />
                ) : (
                  <Cloud className="h-3.5 w-3.5" />
                )}
                {saveStatusLabel}
              </span>
              <span className="hidden sm:inline truncate text-gray-400">
                <TabIcon className="inline h-3.5 w-3.5 mr-1 align-text-bottom text-[#cd3b86]" />
                {currentTab.label}
                <span className="text-gray-300 mx-1.5">·</span>
                {progressPct}%
              </span>
            </div>
            <div className="flex w-auto flex-row gap-2 justify-end shrink-0">
              <Button
                type="button"
                variant="outline"
                className="rounded-xl h-11"
                onClick={() => router.push(BASE)}
              >
                Retour
              </Button>
              <Button
                type="submit"
                className="rounded-xl h-11 bg-[#cd3b86] hover:bg-[#b8307a] text-white min-w-[140px] shadow-lg shadow-[#cd3b86]/25"
                disabled={busy || !eligible}
              >
                {busy ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Terminer
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}
