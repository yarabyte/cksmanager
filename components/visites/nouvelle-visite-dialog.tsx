"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { DateTimePickerFr } from "@/components/ui/date-picker-fr"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import {
  CalendarDays,
  Loader2,
  Plus,
  Search,
  Shield,
  UserRound,
} from "lucide-react"
import {
  createVisite,
  getPatientAssuranceForVisite,
  searchPatients,
} from "@/app/actions/visites"
import type { PatientAssurancePreview } from "@/app/actions/visites"
import { getDoualaDateTimeLocalValue, parseDoualaDateTimeLocal } from "@/lib/timezone"
import { useQueryClient } from "@tanstack/react-query"
import type { MedecinOption, MotifOption, PatientOption } from "@/app/actions/visites"

const DEFAULT_STATUT = "EN_ATTENTE"

const selectTriggerClass =
  "h-10 w-full min-w-0 bg-gray-50 border-gray-200 [&_[data-slot=select-value]]:truncate"

function medecinLabel(m: MedecinOption): string {
  if (m.titre === "Docteur") return `Dr. ${m.nom}`
  if (m.titre === "Professeur") return `Pr. ${m.nom}`
  return m.nom
}

export type NouvelleVisiteDialogProps = {
  open: boolean
  onClose: () => void
  medecins: MedecinOption[]
  motifs: MotifOption[]
  onCreated: (visiteId: string) => void
  /** Patient pré-sélectionné (fiche patient) — masque la recherche */
  initialPatient?: PatientOption | null
}

export function NouvelleVisiteDialog({
  open,
  onClose,
  medecins,
  motifs,
  onCreated,
  initialPatient = null,
}: NouvelleVisiteDialogProps) {
  const router = useRouter()
  const lockPatient = initialPatient != null
  const queryClient = useQueryClient()

  const [patientQuery, setPatientQuery] = React.useState("")
  const [patientResults, setPatientResults] = React.useState<PatientOption[]>([])
  const [selectedPatient, setSelectedPatient] = React.useState<PatientOption | null>(null)
  const [searching, setSearching] = React.useState(false)
  const [medecinId, setMedecinId] = React.useState("")
  const [motifId, setMotifId] = React.useState("")
  const [dateVisite, setDateVisite] = React.useState(() => getDoualaDateTimeLocalValue())
  const [commentaires, setCommentaires] = React.useState("")
  const [assurancePreview, setAssurancePreview] =
    React.useState<PatientAssurancePreview | null>(null)
  const [loadingAssurance, setLoadingAssurance] = React.useState(false)
  const [saving, setSaving] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const debounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)

  function resetForm() {
    setPatientQuery("")
    setPatientResults([])
    setSelectedPatient(lockPatient ? initialPatient : null)
    setMedecinId("")
    setMotifId("")
    setDateVisite(getDoualaDateTimeLocalValue())
    setCommentaires("")
    setAssurancePreview(null)
    setError(null)
    if (lockPatient && initialPatient) {
      setPatientQuery(initialPatient.label)
    }
  }

  React.useEffect(() => {
    if (!open) return
    resetForm()
  }, [open, initialPatient, lockPatient])

  React.useEffect(() => {
    if (lockPatient) return
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!patientQuery.trim() || selectedPatient) {
      if (!patientQuery.trim()) setPatientResults([])
      return
    }
    debounceRef.current = setTimeout(async () => {
      setSearching(true)
      try {
        const res = await searchPatients(patientQuery)
        setPatientResults(res)
      } finally {
        setSearching(false)
      }
    }, 300)
  }, [patientQuery, selectedPatient, lockPatient])

  React.useEffect(() => {
    if (!selectedPatient || !dateVisite) {
      setAssurancePreview(null)
      return
    }
    let cancelled = false
    setLoadingAssurance(true)
    const visitIso = parseDoualaDateTimeLocal(dateVisite).toISOString()
    void getPatientAssuranceForVisite(selectedPatient.id, visitIso)
      .then((preview) => {
        if (!cancelled) setAssurancePreview(preview)
      })
      .catch(() => {
        if (!cancelled) setAssurancePreview(null)
      })
      .finally(() => {
        if (!cancelled) setLoadingAssurance(false)
      })
    return () => {
      cancelled = true
    }
  }, [selectedPatient, dateVisite])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!selectedPatient) {
      setError("Veuillez sélectionner un patient.")
      return
    }
    if (!medecinId) {
      setError("Veuillez choisir un médecin.")
      return
    }
    if (!motifId) {
      setError("Veuillez choisir un motif.")
      return
    }
    if (!dateVisite) {
      setError("Veuillez saisir la date/heure.")
      return
    }
    setSaving(true)
    const result = await createVisite({
      patientId: selectedPatient.id,
      motifId,
      medecinId,
      dateVisite: parseDoualaDateTimeLocal(dateVisite).toISOString(),
      commentaires: commentaires.trim() || undefined,
      statut: DEFAULT_STATUT,
    })
    setSaving(false)
    if (!result.ok) {
      setError(result.error)
      return
    }
    void queryClient.invalidateQueries({ queryKey: ["visites", "nav-stats"] })
    void queryClient.invalidateQueries({ queryKey: ["visites", "counts-by-patient"] })
    void queryClient.invalidateQueries({ queryKey: ["visites", "patient"] })
    onCreated(result.id)
    onClose()
    toast.success("Visite enregistrée — saisie de la feuille de circulation")
    router.push(`/feuilles-circulation/nouvelle?visite=${result.id}`)
  }

  function selectPatient(p: PatientOption) {
    setSelectedPatient(p)
    setPatientQuery(p.label)
    setPatientResults([])
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose() }}>
      <DialogContent className="sm:max-w-lg p-0 overflow-hidden gap-0">
        <div className="bg-gradient-to-r from-[#cd3b86] to-[#9b2563] px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-white/20 flex items-center justify-center">
              <CalendarDays className="h-5 w-5 text-white" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-white leading-tight">
                Nouvelle visite
              </DialogTitle>
              <p className="text-xs text-white/70 mt-0.5">Enregistrer une consultation</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div className="space-y-1.5">
            <Label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">
              Patient <span className="text-[#cd3b86]">*</span>
            </Label>
            {lockPatient && selectedPatient ? (
              <div className="flex items-center gap-2.5 px-3 py-2.5 bg-[#cd3b86]/5 border border-[#cd3b86]/20 rounded-xl">
                <div className="h-7 w-7 rounded-full bg-[#cd3b86]/15 flex items-center justify-center shrink-0">
                  <UserRound className="h-3.5 w-3.5 text-[#cd3b86]" />
                </div>
                <span className="text-sm font-semibold text-[#cd3b86] truncate">
                  {selectedPatient.label}
                </span>
                <span className="text-xs text-gray-400 ml-auto shrink-0">
                  {selectedPatient.telephone}
                </span>
              </div>
            ) : (
              <>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Rechercher par nom ou téléphone…"
                    value={patientQuery}
                    onChange={(e) => {
                      setPatientQuery(e.target.value)
                      if (selectedPatient) setSelectedPatient(null)
                    }}
                    className="pl-9 pr-9 bg-gray-50 border-gray-200 h-10"
                    autoComplete="off"
                  />
                  {searching && (
                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-gray-400" />
                  )}
                </div>
                {patientResults.length > 0 && !selectedPatient && (
                  <div className="border border-gray-200 rounded-xl shadow-lg bg-white max-h-44 overflow-y-auto divide-y divide-gray-50">
                    {patientResults.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => selectPatient(p)}
                        className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-[#cd3b86]/5 text-left transition-colors"
                      >
                        <div className="h-7 w-7 rounded-full bg-[#cd3b86]/10 flex items-center justify-center shrink-0">
                          <UserRound className="h-3.5 w-3.5 text-[#cd3b86]" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-gray-800 truncate">{p.label}</p>
                          <p className="text-xs text-gray-400">{p.telephone}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
                {selectedPatient && (
                  <div className="flex items-center gap-2.5 px-3 py-2.5 bg-[#cd3b86]/5 border border-[#cd3b86]/20 rounded-xl">
                    <div className="h-7 w-7 rounded-full bg-[#cd3b86]/15 flex items-center justify-center shrink-0">
                      <UserRound className="h-3.5 w-3.5 text-[#cd3b86]" />
                    </div>
                    <span className="text-sm font-semibold text-[#cd3b86] truncate">
                      {selectedPatient.label}
                    </span>
                    <span className="text-xs text-gray-400 ml-auto shrink-0">
                      {selectedPatient.telephone}
                    </span>
                  </div>
                )}
              </>
            )}
          </div>

          {selectedPatient && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">
                  Assureur
                </Label>
                <div className="flex h-10 items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm">
                  <Shield className="h-4 w-4 shrink-0 text-gray-400" />
                  {loadingAssurance ? (
                    <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                  ) : assurancePreview ? (
                    <span
                      className={
                        assurancePreview.expiree
                          ? "truncate font-medium text-amber-700"
                          : "truncate font-medium text-gray-700"
                      }
                    >
                      {assurancePreview.expiree
                        ? `${assurancePreview.assuranceNom} (expirée)`
                        : assurancePreview.assuranceNom}
                    </span>
                  ) : (
                    <span className="text-gray-400">—</span>
                  )}
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">
                  Pourcentage
                </Label>
                <div className="flex h-10 items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm">
                  {loadingAssurance ? (
                    <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                  ) : assurancePreview && !assurancePreview.expiree ? (
                    <span className="font-semibold text-gray-800">
                      {assurancePreview.nonAssure ? 0 : assurancePreview.tauxCouverture} %
                    </span>
                  ) : assurancePreview?.expiree ? (
                    <span className="text-amber-700">—</span>
                  ) : (
                    <span className="text-gray-400">—</span>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="h-px bg-gray-100" />

          <div className="grid grid-cols-2 gap-3">
            <div className="min-w-0 space-y-1.5">
              <Label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">
                Médecin <span className="text-[#cd3b86]">*</span>
              </Label>
              <Select value={medecinId} onValueChange={setMedecinId}>
                <SelectTrigger className={selectTriggerClass}>
                  <SelectValue placeholder="Choisir…" />
                </SelectTrigger>
                <SelectContent>
                  {medecins.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {medecinLabel(m)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="min-w-0 space-y-1.5">
              <Label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">
                Motif <span className="text-[#cd3b86]">*</span>
              </Label>
              <Select value={motifId} onValueChange={setMotifId}>
                <SelectTrigger className={selectTriggerClass}>
                  <SelectValue placeholder="Choisir…" />
                </SelectTrigger>
                <SelectContent>
                  {motifs.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.libelle}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="min-w-0 space-y-1.5">
            <Label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">
              Date / Heure <span className="text-[#cd3b86]">*</span>
            </Label>
            <DateTimePickerFr
              value={dateVisite}
              onChange={setDateVisite}
              placeholder="Choisir date et heure"
              className="flex-row gap-2"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">
              Commentaires
            </Label>
            <Textarea
              placeholder="Observations, notes particulières…"
              value={commentaires}
              onChange={(e) => setCommentaires(e.target.value)}
              rows={2}
              className="resize-none bg-gray-50 border-gray-200 text-sm"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-3 py-2.5">
              <span className="text-red-500 shrink-0">⚠</span> {error}
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-1 border-t border-gray-100">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              disabled={saving}
              className="text-gray-500 hover:text-gray-700"
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={saving}
              className="bg-gradient-to-r from-[#cd3b86] to-[#b8307a] hover:from-[#b8307a] hover:to-[#9b2563] text-white shadow-sm gap-2 px-5"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Enregistrement…
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  Créer la visite et la feuille de circulation
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
