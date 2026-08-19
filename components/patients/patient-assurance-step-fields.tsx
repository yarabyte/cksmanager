"use client"

import * as React from "react"
import { Plus, Shield, Trash2 } from "lucide-react"
import { DatePickerFr } from "@/components/ui/date-picker-fr"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import {
  canAssignAssurance,
  canEditTauxPromoteur,
  isAssurancePromoteur,
} from "@/lib/assurance/promoteur"

export type PatientAssuranceFormValues = {
  configure: boolean
  assuranceId: string
  dateDebut: string
  dateFin: string
  numeroAttestation: string
  tauxCouverture: string
  couvertures: { categorieId: string; tauxCouverture: string }[]
}

export const defaultPatientAssuranceForm: PatientAssuranceFormValues = {
  configure: false,
  assuranceId: "",
  dateDebut: "",
  dateFin: "",
  numeroAttestation: "",
  tauxCouverture: "80",
  couvertures: [],
}

const fieldClass =
  "h-9 rounded-lg border-border/80 transition-all duration-200 focus-visible:border-[#cd3b86]/50 focus-visible:ring-[#cd3b86]/20"

export function PatientAssuranceStepFields({
  values,
  onChange,
  assurances,
  categories,
  idPrefix = "ap-step",
  currentUserId,
}: {
  values: PatientAssuranceFormValues
  onChange: (v: PatientAssuranceFormValues) => void
  assurances: { id: string; nom: string; promoteurUserId?: string | null }[]
  categories: { id: string; nom: string }[]
  idPrefix?: string
  currentUserId?: string | null
}) {
  const set = (patch: Partial<PatientAssuranceFormValues>) =>
    onChange({ ...values, ...patch })

  const selected = assurances.find((a) => a.id === values.assuranceId)
  const cannotAssign =
    !!currentUserId &&
    isAssurancePromoteur(selected) &&
    !canAssignAssurance(currentUserId, selected)
  const tauxReadOnly =
    !!currentUserId &&
    isAssurancePromoteur(selected) &&
    !canEditTauxPromoteur(currentUserId, selected)

  React.useEffect(() => {
    if (values.configure && !values.assuranceId && assurances[0]) {
      set({ assuranceId: assurances[0].id })
    }
  }, [values.configure, values.assuranceId, assurances])

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Button
          type="button"
          variant={!values.configure ? "default" : "outline"}
          size="sm"
          className={cn(!values.configure && "bg-[#cd3b86] hover:bg-[#b8307a] text-white")}
          onClick={() => set({ configure: false, couvertures: [] })}
        >
          Sans assurance
        </Button>
        <Button
          type="button"
          variant={values.configure ? "default" : "outline"}
          size="sm"
          className={cn(values.configure && "bg-[#cd3b86] hover:bg-[#b8307a] text-white")}
          onClick={() => set({ configure: true })}
          disabled={assurances.length === 0}
        >
          <Shield className="mr-1.5 h-3.5 w-3.5" />
          Configurer une assurance
        </Button>
      </div>

      {assurances.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Aucun assureur configuré dans le référentiel. Le patient sera créé sans assurance.
        </p>
      ) : null}

      {values.configure ? (
        <div className="space-y-4 rounded-xl border border-border/60 bg-muted/20 p-4">
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">Assureur</Label>
            <Select value={values.assuranceId} onValueChange={(v) => set({ assuranceId: v })}>
              <SelectTrigger className={fieldClass}>
                <SelectValue placeholder="Choisir un assureur" />
              </SelectTrigger>
              <SelectContent>
                {assurances.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.nom}
                    {isAssurancePromoteur(a) ? " (promoteur)" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {cannotAssign ? (
              <p className="text-xs text-amber-700">
                Seul le promoteur propriétaire peut affecter cette assurance.
              </p>
            ) : null}
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor={`${idPrefix}-debut`} className="text-sm font-medium">
                Date début
              </Label>
              <DatePickerFr
                id={`${idPrefix}-debut`}
                dateValue={values.dateDebut}
                onDateChange={(d) => set({ dateDebut: d })}
                placeholder="Date de début"
                clearable
                className={fieldClass}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor={`${idPrefix}-fin`} className="text-sm font-medium">
                Date fin
              </Label>
              <DatePickerFr
                id={`${idPrefix}-fin`}
                dateValue={values.dateFin}
                onDateChange={(d) => set({ dateFin: d })}
                placeholder="Date de fin"
                clearable
                min={values.dateDebut || undefined}
                className={fieldClass}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor={`${idPrefix}-attestation`} className="text-sm font-medium">
              N° attestation
            </Label>
            <Input
              id={`${idPrefix}-attestation`}
              className={fieldClass}
              placeholder="Numéro de carte ou d'attestation"
              value={values.numeroAttestation}
              onChange={(e) => set({ numeroAttestation: e.target.value })}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor={`${idPrefix}-taux`} className="text-sm font-medium">
              Taux de couverture globale (%)
            </Label>
            <Input
              id={`${idPrefix}-taux`}
              type="number"
              min={0}
              max={100}
              disabled={tauxReadOnly}
              className={cn(fieldClass, "pr-10")}
              value={values.tauxCouverture}
              onChange={(e) => set({ tauxCouverture: e.target.value })}
            />
            {tauxReadOnly ? (
              <p className="text-xs text-muted-foreground">
                Seul le promoteur propriétaire peut fixer le taux de cette assurance.
              </p>
            ) : null}
          </div>

          {categories.length > 0 && !tauxReadOnly ? (
            <div className="space-y-2 border-t border-border/50 pt-3">
              <div className="flex items-center justify-between gap-2">
                <Label className="text-sm font-medium">Couvertures par catégorie (optionnel)</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 gap-1"
                  onClick={() =>
                    set({
                      couvertures: [
                        ...values.couvertures,
                        {
                          categorieId: categories[0]?.id ?? "",
                          tauxCouverture: values.tauxCouverture || "80",
                        },
                      ],
                    })
                  }
                >
                  <Plus className="h-3.5 w-3.5" />
                  Ajouter
                </Button>
              </div>
              {values.couvertures.map((c, idx) => (
                <div key={idx} className="flex flex-wrap items-end gap-2">
                  <div className="min-w-[140px] flex-1 space-y-1">
                    <Label className="text-xs text-muted-foreground">Catégorie</Label>
                    <Select
                      value={c.categorieId}
                      onValueChange={(v) => {
                        const next = [...values.couvertures]
                        next[idx] = { ...next[idx], categorieId: v }
                        set({ couvertures: next })
                      }}
                    >
                      <SelectTrigger className={fieldClass}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            {cat.nom}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="w-24 space-y-1">
                    <Label className="text-xs text-muted-foreground">Taux %</Label>
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      className={fieldClass}
                      value={c.tauxCouverture}
                      onChange={(e) => {
                        const next = [...values.couvertures]
                        next[idx] = { ...next[idx], tauxCouverture: e.target.value }
                        set({ couvertures: next })
                      }}
                    />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 text-destructive"
                    onClick={() =>
                      set({ couvertures: values.couvertures.filter((_, i) => i !== idx) })
                    }
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          ) : null}

          <p className="text-xs text-muted-foreground">
            Une assurance (y compris « Non assuré ») est requise pour générer une feuille de
            circulation. Vous pourrez la modifier plus tard depuis la fiche patient.
          </p>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          Le patient sera automatiquement rattaché à l&apos;assurance « Non assuré » (taux 0 %,
          barème clinique). Vous pourrez modifier son affiliation depuis la fiche patient.
        </p>
      )}
    </div>
  )
}
