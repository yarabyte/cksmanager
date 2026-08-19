"use client"

import * as React from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ArrowLeft, Save, User, Loader2 } from "lucide-react"
import {
  getInitials,
  formatPatientIdentityLine,
  calculateAge,
} from "@/lib/formatting"
import {
  usePatient,
  usePatientMutations,
  usePatientSelect2Suggestions,
} from "@/hooks/use-patients"
import {
  PatientFormFields,
  defaultPatientForm,
  type PatientFormValues,
} from "@/components/patients/patient-form-fields"
import { toast } from "sonner"

function patientToForm(p: Record<string, unknown>): PatientFormValues {
  const dob = String(p.patDob)
  return {
    civilite: Number(p.civilite),
    patName: String(p.patName),
    patSurname: String(p.patSurname),
    nomJeuneFille: p.nomJeuneFille ? String(p.nomJeuneFille) : "",
    patEmail: p.patEmail ? String(p.patEmail) : "",
    patDob: dob.length >= 10 ? dob.slice(0, 10) : "",
    patLieuNaiss: String(p.patLieuNaiss),
    patCni: p.patCni ? String(p.patCni) : "",
    patAdress: String(p.patAdress),
    patNum1: String(p.patNum1),
    patNum2: p.patNum2 ? String(p.patNum2) : "",
    patProfession: p.patProfession ? String(p.patProfession) : "",
    sexe: Number(p.sexe),
  }
}

export default function EditPatientPage() {
  const params = useParams()
  const router = useRouter()
  const patientId = params.id as string

  const { data: patient, isPending, error, dataUpdatedAt } =
    usePatient(patientId)
  const { update } = usePatientMutations()
  const { data: select2Data, isPending: select2Loading } =
    usePatientSelect2Suggestions()

  const [form, setForm] = React.useState<PatientFormValues>(defaultPatientForm)

  /** Dernière version chargée depuis le serveur — évite setForm en boucle si la référence `patient` change sans nouveau fetch. */
  const patientSnapshotRef = React.useRef(patient)
  patientSnapshotRef.current = patient

  React.useEffect(() => {
    const p = patientSnapshotRef.current
    if (!p || typeof p !== "object") return
    setForm(patientToForm(p as Record<string, unknown>))
  }, [patientId, dataUpdatedAt])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    try {
      await update.mutateAsync({
        id: patientId,
        civilite: form.civilite,
        patName: form.patName,
        patSurname: form.patSurname,
        nomJeuneFille: form.nomJeuneFille || null,
        patEmail: form.patEmail || null,
        patDob: new Date(form.patDob),
        patLieuNaiss: form.patLieuNaiss,
        patCni: form.patCni || null,
        patAdress: form.patAdress,
        patNum1: form.patNum1,
        patNum2: form.patNum2 || null,
        patProfession: form.patProfession || null,
        sexe: form.sexe,
      })
      toast.success("Patient mis à jour")
      router.push(`/patients/${patientId}`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur à l'enregistrement")
    }
  }

  if (isPending) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-24">
        <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Chargement…</p>
      </div>
    )
  }

  if (error || patient == null) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-16">
        <p className="text-muted-foreground">Patient non trouvé.</p>
        <Button asChild variant="outline">
          <Link href="/patients">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour aux patients
          </Link>
        </Button>
      </div>
    )
  }

  const patName = String(patient.patName)
  const patSurname = String(patient.patSurname)
  const patDob = String(patient.patDob)
  const sexe = Number(patient.sexe)
  const nomJf =
    patient.nomJeuneFille != null && String(patient.nomJeuneFille).trim() !== ""
      ? String(patient.nomJeuneFille)
      : null

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" size="sm" className="gap-1">
        <Link href={`/patients/${patientId}`}>
          <ArrowLeft className="h-4 w-4" />
          Retour au dossier
        </Link>
      </Button>

      <div className="flex items-start gap-4">
        <Avatar className="h-14 w-14 shrink-0">
          <AvatarFallback className="bg-primary/10 text-primary text-lg font-semibold">
            {getInitials(form.patName || patName, form.patSurname || patSurname)}
          </AvatarFallback>
        </Avatar>
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Modifier le patient
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {formatPatientIdentityLine(patName, patSurname, sexe, nomJf)} —{" "}
            {calculateAge(patDob)} ans
          </p>
        </div>
      </div>

      <form onSubmit={(e) => void handleSubmit(e)} className="space-y-6">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10">
                <User className="h-4 w-4 text-primary" />
              </div>
              <div>
                <CardTitle className="text-base">Fiche patient</CardTitle>
                <CardDescription className="text-xs">
                  Données alignées sur la base (colonnes PatName, PatSurname, etc.)
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <PatientFormFields
              values={form}
              onChange={setForm}
              idPrefix="edit"
              select2Suggestions={select2Data}
              select2Loading={select2Loading}
            />
          </CardContent>
        </Card>

        <Separator />
        <div className="flex items-center justify-end gap-3 pb-2">
          <Button asChild variant="outline" type="button">
            <Link href={`/patients/${patientId}`}>Annuler</Link>
          </Button>
          <Button
            type="submit"
            className="gap-2 min-w-[120px]"
            disabled={update.isPending || !form.patName || !form.patSurname}
          >
            {update.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Enregistrement...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Enregistrer
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
