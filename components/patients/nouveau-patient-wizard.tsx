"use client"

import * as React from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Loader2, Save, UserRound, ChevronLeft, ChevronRight, Shield, CheckCircle2 } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import {
  PatientFormFields,
  defaultPatientForm,
  type PatientFormValues,
} from "@/components/patients/patient-form-fields"
import {
  PatientAssuranceStepFields,
  defaultPatientAssuranceForm,
  type PatientAssuranceFormValues,
} from "@/components/patients/patient-assurance-step-fields"
import { useQueryClient } from "@tanstack/react-query"
import { createPatientWithAssurance } from "@/app/actions/patients"
import { getAuthUserId } from "@/app/actions/auth"
import type { PatientSelect2Suggestions } from "@/app/actions/patients"
import {
  formatDate,
  formatPatientIdentityLine,
} from "@/lib/formatting"
import { formatWhatsAppPhoneDisplay, isValidWhatsAppPhone } from "@/lib/phone"
import { formatCategorieLabel } from "@/components/shared/categorie-icon"
import { isNonAssureAssuranceName } from "@/lib/assurance/non-assure"
import {
  canAssignAssurance,
  isAssurancePromoteur,
} from "@/lib/assurance/promoteur"
import { useQuery } from "@tanstack/react-query"

const STEPS = [
  { id: 1, label: "Identité", icon: UserRound },
  { id: 2, label: "Assurance", icon: Shield },
  { id: 3, label: "Confirmation", icon: CheckCircle2 },
] as const

function civilityLabel(c: number) {
  if (c === 2) return "Madame"
  if (c === 3) return "Enfant"
  return "Monsieur"
}

function SummaryRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 border-b border-border/40 py-2.5 last:border-0 sm:flex-row sm:gap-4">
      <dt className="w-40 shrink-0 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </dt>
      <dd className="text-sm text-foreground">{value || "—"}</dd>
    </div>
  )
}

export function NouveauPatientWizard({
  open,
  onOpenChange,
  onCreated,
  select2Suggestions,
  select2Loading,
  assurances,
  categories,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated?: () => void
  select2Suggestions?: PatientSelect2Suggestions
  select2Loading?: boolean
  assurances: { id: string; nom: string; promoteurUserId?: string | null }[]
  categories: { id: string; nom: string }[]
}) {
  const queryClient = useQueryClient()
  const { data: currentUserId } = useQuery({
    queryKey: ["auth", "userId"],
    queryFn: getAuthUserId,
  })
  const [step, setStep] = React.useState(1)
  const [patientForm, setPatientForm] = React.useState<PatientFormValues>(defaultPatientForm)
  const [assuranceForm, setAssuranceForm] =
    React.useState<PatientAssuranceFormValues>(defaultPatientAssuranceForm)
  const [pending, setPending] = React.useState(false)

  function reset() {
    setStep(1)
    setPatientForm(defaultPatientForm)
    setAssuranceForm(defaultPatientAssuranceForm)
  }

  function handleOpenChange(next: boolean) {
    if (!next) reset()
    onOpenChange(next)
  }

  function validateStep1(): string | null {
    if (!patientForm.patSurname.trim()) return "Le nom est obligatoire."
    if (!patientForm.patName.trim()) return "Le prénom est obligatoire."
    if (!patientForm.patDob) return "La date de naissance est obligatoire."
    if (!patientForm.patLieuNaiss.trim()) return "Le lieu de naissance est obligatoire."
    if (!patientForm.patAdress.trim()) return "L'adresse est obligatoire."
    if (!isValidWhatsAppPhone(patientForm.patNum1)) {
      return "Le téléphone principal doit être un numéro mobile WhatsApp valide."
    }
    if (patientForm.patNum2.trim() && !isValidWhatsAppPhone(patientForm.patNum2)) {
      return "Le téléphone secondaire n'est pas un numéro WhatsApp valide."
    }
    return null
  }

  function validateStep2(): string | null {
    if (!assuranceForm.configure) return null
    if (!assuranceForm.assuranceId) return "Choisissez un assureur."
    const selected = assurances.find((a) => a.id === assuranceForm.assuranceId)
    if (
      currentUserId &&
      isAssurancePromoteur(selected) &&
      !canAssignAssurance(currentUserId, selected)
    ) {
      return "Seul le promoteur propriétaire peut affecter cette assurance."
    }
    const taux = Number.parseInt(assuranceForm.tauxCouverture, 10)
    if (Number.isNaN(taux) || taux < 0 || taux > 100) {
      return "Taux de couverture invalide (0–100)."
    }
    return null
  }

  function goNext() {
    if (step === 1) {
      const err = validateStep1()
      if (err) {
        toast.error(err)
        return
      }
      setStep(2)
      return
    }
    if (step === 2) {
      const err = validateStep2()
      if (err) {
        toast.error(err)
        return
      }
      setStep(3)
    }
  }

  async function handleCreate() {
    const err1 = validateStep1()
    const err2 = validateStep2()
    if (err1 || err2) {
      toast.error(err1 ?? err2 ?? "Données invalides")
      return
    }

    setPending(true)
    try {
      const taux = Number.parseInt(assuranceForm.tauxCouverture, 10)
      await createPatientWithAssurance({
        patient: {
          ...patientForm,
          patEmail: patientForm.patEmail || null,
          patCni: patientForm.patCni || null,
          patNum2: patientForm.patNum2 || null,
          patProfession: patientForm.patProfession || null,
          nomJeuneFille: patientForm.nomJeuneFille || null,
          patDob: new Date(patientForm.patDob),
        },
        assurance: assuranceForm.configure
          ? {
              assuranceId: assuranceForm.assuranceId,
              dateDebut: assuranceForm.dateDebut ? new Date(assuranceForm.dateDebut) : null,
              dateFin: assuranceForm.dateFin ? new Date(assuranceForm.dateFin) : null,
              numeroAttestation: assuranceForm.numeroAttestation.trim() || null,
              tauxCouverture: taux,
              couvertures: assuranceForm.couvertures
                .filter((c) => c.categorieId)
                .map((c) => ({
                  categorieId: c.categorieId,
                  tauxCouverture: Number.parseFloat(c.tauxCouverture),
                }))
                .filter((c) => !Number.isNaN(c.tauxCouverture)),
            }
          : null,
      })
      toast.success("Patient créé avec succès")
      void queryClient.invalidateQueries({ queryKey: ["patients"] })
      handleOpenChange(false)
      onCreated?.()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur à la création")
    } finally {
      setPending(false)
    }
  }

  const identityLine = formatPatientIdentityLine(
    patientForm.patName,
    patientForm.patSurname,
    patientForm.sexe,
    patientForm.sexe === 2 ? patientForm.nomJeuneFille || null : null,
  )

  const selectedAssurance = assurances.find((a) => a.id === assuranceForm.assuranceId)
  const nonAssureAssurance = assurances.find((a) => isNonAssureAssuranceName(a.nom))

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        showCloseButton
        className={cn(
          "flex max-h-[min(90vh,760px)] flex-col gap-0 overflow-hidden rounded-2xl border-border/80 p-0 shadow-xl",
          "sm:max-w-[560px]",
        )}
      >
        <div className="shrink-0 border-b border-border/60 bg-gradient-to-br from-[#cd3b86]/10 via-background to-background px-5 pb-4 pt-5 sm:px-6">
          <div className="flex gap-4 pr-6">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#cd3b86]/12 shadow-sm">
              <UserRound className="h-6 w-6 text-[#cd3b86]" />
            </div>
            <DialogHeader className="flex-1 space-y-2 text-left">
              <DialogTitle className="text-xl font-semibold tracking-tight">Nouveau patient</DialogTitle>
              <DialogDescription className="text-sm leading-relaxed">
                Étape {step} sur 3 — {STEPS[step - 1].label}
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="mt-4 flex items-center gap-1">
            {STEPS.map((s, idx) => {
              const Icon = s.icon
              const active = step === s.id
              const done = step > s.id
              return (
                <React.Fragment key={s.id}>
                  <div
                    className={cn(
                      "flex flex-1 items-center justify-center gap-1.5 rounded-lg px-2 py-1.5 text-[11px] font-semibold",
                      active && "bg-[#cd3b86]/15 text-[#cd3b86]",
                      done && !active && "text-emerald-600",
                      !active && !done && "text-muted-foreground",
                    )}
                  >
                    <Icon className="h-3.5 w-3.5 shrink-0" />
                    <span className="hidden sm:inline">{s.label}</span>
                  </div>
                  {idx < STEPS.length - 1 ? (
                    <div className={cn("h-px w-3 shrink-0", done ? "bg-emerald-300" : "bg-border")} />
                  ) : null}
                </React.Fragment>
              )
            })}
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4 sm:px-6">
          {step === 1 ? (
            <PatientFormFields
              values={patientForm}
              onChange={setPatientForm}
              idPrefix="new"
              variant="dialog"
              select2Suggestions={select2Suggestions}
              select2Loading={select2Loading}
            />
          ) : null}

          {step === 2 ? (
            <PatientAssuranceStepFields
              values={assuranceForm}
              onChange={setAssuranceForm}
              assurances={assurances}
              categories={categories}
              currentUserId={currentUserId}
            />
          ) : null}

          {step === 3 ? (
            <div className="space-y-5">
              <div>
                <h3 className="mb-2 text-sm font-semibold text-foreground">Identité & coordonnées</h3>
                <dl className="rounded-xl border bg-muted/20 px-4">
                  <SummaryRow label="Identité" value={identityLine} />
                  <SummaryRow label="Civilité" value={civilityLabel(patientForm.civilite)} />
                  <SummaryRow
                    label="Sexe"
                    value={patientForm.sexe === 2 ? "Féminin" : "Masculin"}
                  />
                  {patientForm.sexe === 2 && patientForm.nomJeuneFille.trim() ? (
                    <SummaryRow
                      label="Nom de jeune fille"
                      value={patientForm.nomJeuneFille.toUpperCase()}
                    />
                  ) : null}
                  <SummaryRow
                    label="Naissance"
                    value={`${formatDate(patientForm.patDob)} — ${patientForm.patLieuNaiss}`}
                  />
                  <SummaryRow label="Adresse" value={patientForm.patAdress} />
                  <SummaryRow
                    label="Téléphone"
                    value={formatWhatsAppPhoneDisplay(patientForm.patNum1)}
                  />
                  {patientForm.patNum2 ? (
                    <SummaryRow
                      label="Tél. secondaire"
                      value={formatWhatsAppPhoneDisplay(patientForm.patNum2)}
                    />
                  ) : null}
                  {patientForm.patProfession ? (
                    <SummaryRow label="Profession" value={patientForm.patProfession} />
                  ) : null}
                  {patientForm.patEmail ? (
                    <SummaryRow label="Email" value={patientForm.patEmail} />
                  ) : null}
                </dl>
              </div>

              <div>
                <h3 className="mb-2 text-sm font-semibold text-foreground">Assurance</h3>
                <dl className="rounded-xl border bg-muted/20 px-4">
                  {!assuranceForm.configure ? (
                    <SummaryRow
                      label="Statut"
                      value={
                        nonAssureAssurance
                          ? `${nonAssureAssurance.nom} (taux 0 %)`
                          : "Non assuré (taux 0 %)"
                      }
                    />
                  ) : (
                    <>
                      <SummaryRow label="Assureur" value={selectedAssurance?.nom ?? "—"} />
                      <SummaryRow
                        label="Taux global"
                        value={`${assuranceForm.tauxCouverture} %`}
                      />
                      {assuranceForm.dateDebut || assuranceForm.dateFin ? (
                        <SummaryRow
                          label="Validité"
                          value={`${assuranceForm.dateDebut ? formatDate(assuranceForm.dateDebut) : "…"} → ${assuranceForm.dateFin ? formatDate(assuranceForm.dateFin) : "…"}`}
                        />
                      ) : null}
                      {assuranceForm.numeroAttestation ? (
                        <SummaryRow
                          label="Attestation"
                          value={assuranceForm.numeroAttestation}
                        />
                      ) : null}
                      {assuranceForm.couvertures.length > 0 ? (
                        <SummaryRow
                          label="Couvertures"
                          value={
                            <ul className="list-inside list-disc space-y-0.5">
                              {assuranceForm.couvertures.map((c, i) => {
                                const cat = categories.find((x) => x.id === c.categorieId)
                                return (
                                  <li key={i}>
                                    {formatCategorieLabel(cat?.nom)} — {c.tauxCouverture} %
                                  </li>
                                )
                              })}
                            </ul>
                          }
                        />
                      ) : null}
                    </>
                  )}
                </dl>
              </div>
            </div>
          ) : null}
        </div>

        <DialogFooter className="shrink-0 gap-2 border-t border-border/60 bg-muted/15 px-5 py-4 sm:justify-between sm:px-6">
          <div>
            {step > 1 ? (
              <Button
                type="button"
                variant="ghost"
                className="gap-1 rounded-lg"
                onClick={() => setStep((s) => s - 1)}
                disabled={pending}
              >
                <ChevronLeft className="h-4 w-4" />
                Précédent
              </Button>
            ) : (
              <Button
                type="button"
                variant="outline"
                className="rounded-lg"
                onClick={() => handleOpenChange(false)}
              >
                Annuler
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            {step < 3 ? (
              <Button
                type="button"
                className="gap-1 rounded-lg bg-gradient-to-r from-[#cd3b86] to-[#b8307a] text-white hover:from-[#b8307a] hover:to-[#9b2563]"
                onClick={goNext}
              >
                Suivant
                <ChevronRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                type="button"
                className="gap-2 rounded-lg bg-gradient-to-r from-[#cd3b86] to-[#b8307a] text-white hover:from-[#b8307a] hover:to-[#9b2563]"
                onClick={() => void handleCreate()}
                disabled={pending}
              >
                {pending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Créer le patient
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
