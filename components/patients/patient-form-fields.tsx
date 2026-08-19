"use client"

import * as React from "react"
import { Briefcase, Home, MapPin } from "lucide-react"
import { Combobox, type ComboboxOption } from "@/components/ui/combobox"
import { DatePickerFr } from "@/components/ui/date-picker-fr"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { WhatsAppPhoneInput } from "@/components/ui/whatsapp-phone-input"
import { cn } from "@/lib/utils"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { PatientSelect2Suggestions } from "@/app/actions/patients"

export type { PatientSelect2Suggestions }

export type PatientFormValues = {
  civilite: number
  patName: string
  patSurname: string
  nomJeuneFille: string
  patEmail: string
  patDob: string
  patLieuNaiss: string
  patCni: string
  patAdress: string
  patNum1: string
  patNum2: string
  patProfession: string
  sexe: number
}

export const defaultPatientForm: PatientFormValues = {
  civilite: 1,
  patName: "",
  patSurname: "",
  nomJeuneFille: "",
  patEmail: "",
  patDob: "",
  patLieuNaiss: "",
  patCni: "",
  patAdress: "",
  patNum1: "",
  patNum2: "",
  patProfession: "",
  sexe: 1,
}

const dialogFieldClass =
  "h-9 rounded-lg border-border/80 transition-all duration-200 focus-visible:border-[#cd3b86]/50 focus-visible:ring-[#cd3b86]/20"

const comboboxTriggerClass = (dialog: boolean) =>
  cn(
    "w-full justify-between font-normal",
    dialog &&
      "h-9 min-h-9 rounded-lg border-border/80 transition-all duration-200 focus-visible:border-[#cd3b86]/50 focus-visible:ring-2 focus-visible:ring-[#cd3b86]/20",
  )

/** Icône type Select2 — recherche + liste groupée. */
const pin = (className: string) => (
  <MapPin className={cn("h-4 w-4 shrink-0", className)} />
)
const home = (className: string) => (
  <Home className={cn("h-4 w-4 shrink-0", className)} />
)
const brief = (className: string) => (
  <Briefcase className={cn("h-4 w-4 shrink-0", className)} />
)

/** Construit les entrées Select2 à partir des chaînes distinctes en base (value === label). */
function stringsToOptions(
  strings: string[],
  group: string,
  iconFn: (className: string) => React.ReactNode,
): ComboboxOption[] {
  return strings.map((s) => ({
    value: s,
    label: s,
    icon: iconFn("text-muted-foreground"),
    group,
  }))
}

function withCurrentOption(
  base: ComboboxOption[],
  current: string,
  icon: React.ReactNode,
  group = "Valeur enregistrée",
): ComboboxOption[] {
  const t = current.trim()
  if (!t) return base
  if (base.some((o) => o.value === t)) return base
  return [{ value: t, label: t, icon, group }, ...base]
}

const EMPTY_SELECT2: PatientSelect2Suggestions = {
  lieux: [],
  adresses: [],
  professions: [],
}

export function PatientFormFields({
  values,
  onChange,
  idPrefix = "p",
  variant = "default",
  select2Suggestions,
  select2Loading = false,
}: {
  values: PatientFormValues
  onChange: (v: PatientFormValues) => void
  idPrefix?: string
  /** Style aligné sur les modales (champs compacts, accent rose CKS). */
  variant?: "default" | "dialog"
  /**
   * Libellés distincts déjà enregistrés sur la table `patients` (colonnes
   * PatLieuNaiss, PatAdress, PatProfession) — un champ Select2 = une colonne.
   */
  select2Suggestions?: PatientSelect2Suggestions
  select2Loading?: boolean
}) {
  const set = (patch: Partial<PatientFormValues>) =>
    onChange({ ...values, ...patch })

  const v = variant === "dialog"
  const gap = v ? "gap-3" : "gap-4"
  const gridGap = v ? "gap-3" : "gap-4"
  const rowSpace = v ? "space-y-1.5" : "space-y-2"
  const labelClass = v ? "text-sm font-medium" : undefined
  const fc = v ? dialogFieldClass : undefined
  const nomLabel = v ? "Nom" : "Nom (PatSurname)"
  const prenomLabel = v ? "Prénom" : "Prénom (PatName)"
  const cbClass = comboboxTriggerClass(v)
  const s2 = select2Suggestions ?? EMPTY_SELECT2
  const showNomJeuneFille = values.sexe === 2

  const lieuOptions = React.useMemo(
    () =>
      withCurrentOption(
        stringsToOptions(
          s2.lieux,
          "Déjà saisis — lieux de naissance",
          pin,
        ),
        values.patLieuNaiss,
        pin("text-muted-foreground"),
      ),
    [s2.lieux, values.patLieuNaiss],
  )

  const adresseOptions = React.useMemo(
    () =>
      withCurrentOption(
        stringsToOptions(
          s2.adresses,
          "Déjà saisis — adresses",
          home,
        ),
        values.patAdress,
        home("text-muted-foreground"),
      ),
    [s2.adresses, values.patAdress],
  )

  const professionOptions = React.useMemo(
    () =>
      withCurrentOption(
        stringsToOptions(
          s2.professions,
          "Déjà saisis — professions",
          brief,
        ),
        values.patProfession,
        brief("text-muted-foreground"),
      ),
    [s2.professions, values.patProfession],
  )

  return (
    <div className={cn("grid", gap)}>
      <div className={cn("grid grid-cols-2", gridGap)}>
        <div className={rowSpace}>
          <Label htmlFor={`${idPrefix}-nom`} className={labelClass}>
            {nomLabel}
          </Label>
          <Input
            id={`${idPrefix}-nom`}
            className={cn(fc)}
            value={values.patSurname}
            onChange={(e) => set({ patSurname: e.target.value })}
            required
          />
        </div>
        <div className={rowSpace}>
          <Label htmlFor={`${idPrefix}-prenom`} className={labelClass}>
            {prenomLabel}
          </Label>
          <Input
            id={`${idPrefix}-prenom`}
            className={cn(fc)}
            value={values.patName}
            onChange={(e) => set({ patName: e.target.value })}
            required
          />
        </div>
      </div>
      <div className={cn("grid grid-cols-2", gridGap)}>
        <div className={rowSpace}>
          <Label htmlFor={`${idPrefix}-civ`} className={labelClass}>
            Civilité
          </Label>
          <Select
            value={String(values.civilite)}
            onValueChange={(x) => {
              const c = Number(x)
              if (c === 2) {
                set({ civilite: c, sexe: 2 })
              } else if (c === 1) {
                set({ civilite: c, sexe: 1, nomJeuneFille: "" })
              } else {
                set({
                  civilite: c,
                  ...(values.sexe !== 2 ? { nomJeuneFille: "" } : {}),
                })
              }
            }}
          >
            <SelectTrigger id={`${idPrefix}-civ`} className={cn(fc)}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">Monsieur</SelectItem>
              <SelectItem value="2">Madame</SelectItem>
              <SelectItem value="3">Enfant</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className={rowSpace}>
          <Label htmlFor={`${idPrefix}-sexe`} className={labelClass}>
            Sexe
          </Label>
          <Select
            value={String(values.sexe)}
            onValueChange={(x) => {
              const s = Number(x)
              set({
                sexe: s,
                ...(s !== 2 ? { nomJeuneFille: "" } : {}),
              })
            }}
          >
            <SelectTrigger id={`${idPrefix}-sexe`} className={cn(fc)}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">Masculin</SelectItem>
              <SelectItem value="2">Féminin</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      {showNomJeuneFille ? (
        <div className={rowSpace}>
          <Label htmlFor={`${idPrefix}-njf`} className={labelClass}>
            Nom de jeune fille <span className="font-normal text-muted-foreground">(si applicable)</span>
          </Label>
          <Input
            id={`${idPrefix}-njf`}
            className={cn(fc)}
            value={values.nomJeuneFille}
            onChange={(e) => set({ nomJeuneFille: e.target.value })}
            placeholder="Ex. DUPONT"
            autoComplete="additional-name"
          />
        </div>
      ) : null}
      <div className={rowSpace}>
        <Label htmlFor={`${idPrefix}-dob`} className={labelClass}>
          Date de naissance
        </Label>
        <DatePickerFr
          id={`${idPrefix}-dob`}
          dateValue={values.patDob}
          onDateChange={(d) => set({ patDob: d })}
          placeholder="Sélectionner une date"
          clearable
          className={cn(fc, v ? "text-sm" : undefined)}
          fromYear={1900}
          toYear={new Date().getFullYear()}
        />
      </div>
      <div className={cn("grid grid-cols-1 sm:grid-cols-2", gridGap)}>
        <div className={rowSpace}>
          <Label className={labelClass}>Lieu de naissance</Label>
          <Combobox
            options={lieuOptions}
            value={values.patLieuNaiss || undefined}
            onChange={(x) => set({ patLieuNaiss: x ?? "" })}
            placeholder="Lieu de naissance…"
            searchPlaceholder="Rechercher parmi les lieux déjà saisis…"
            emptyMessage="Aucune correspondance — validez une saisie libre ci-dessous."
            className={cbClass}
            loading={select2Loading}
            creatable
          />
        </div>
        <div className={rowSpace}>
          <Label className={labelClass}>Adresse</Label>
          <Combobox
            options={adresseOptions}
            value={values.patAdress || undefined}
            onChange={(x) => set({ patAdress: x ?? "" })}
            placeholder="Adresse…"
            searchPlaceholder="Rechercher parmi les adresses déjà saisies…"
            emptyMessage="Aucune correspondance — validez une saisie libre ci-dessous."
            className={cbClass}
            loading={select2Loading}
            creatable
          />
        </div>
      </div>
      <div className={cn("grid grid-cols-1 sm:grid-cols-2", gridGap)}>
        <div className={rowSpace}>
          <Label htmlFor={`${idPrefix}-tel`} className={labelClass}>
            Téléphone principal
          </Label>
          <WhatsAppPhoneInput
            id={`${idPrefix}-tel`}
            value={values.patNum1}
            onChange={(v) => set({ patNum1: v })}
            required
            className={cn(fc && "[&_input]:rounded-l-none")}
          />
          <p className="text-xs text-muted-foreground">
            Format WhatsApp international (ex. +237 6XX XX XX XX)
          </p>
        </div>
        <div className={rowSpace}>
          <Label htmlFor={`${idPrefix}-tel2`} className={labelClass}>
            Téléphone secondaire
          </Label>
          <WhatsAppPhoneInput
            id={`${idPrefix}-tel2`}
            value={values.patNum2}
            onChange={(v) => set({ patNum2: v })}
            className={cn(fc && "[&_input]:rounded-l-none")}
          />
        </div>
      </div>
      <div className={cn("grid grid-cols-1 sm:grid-cols-2", gridGap)}>
        <div className={rowSpace}>
          <Label className={labelClass}>Profession</Label>
          <Combobox
            options={professionOptions}
            value={values.patProfession || undefined}
            onChange={(x) => set({ patProfession: x ?? "" })}
            placeholder="Profession…"
            searchPlaceholder="Rechercher parmi les professions déjà saisies…"
            emptyMessage="Aucune correspondance — validez une saisie libre ci-dessous."
            className={cbClass}
            loading={select2Loading}
            creatable
          />
        </div>
        <div className={rowSpace}>
          <Label htmlFor={`${idPrefix}-email`} className={labelClass}>
            Email
          </Label>
          <Input
            id={`${idPrefix}-email`}
            type="email"
            className={cn(fc)}
            value={values.patEmail}
            onChange={(e) => set({ patEmail: e.target.value })}
          />
        </div>
      </div>
      <div className={rowSpace}>
        <Label htmlFor={`${idPrefix}-cni`} className={labelClass}>
          CNI
        </Label>
        <Input
          id={`${idPrefix}-cni`}
          className={cn(fc)}
          value={values.patCni}
          onChange={(e) => set({ patCni: e.target.value })}
        />
      </div>
    </div>
  )
}
