import { notFound, redirect } from "next/navigation"
import { getVisitesRecentes } from "@/app/actions/feuilles-circulation"
import {
  getPrescriptionById,
  getVisitePrescriptionContext,
  listProduitsForPrescription,
} from "@/app/actions/prescriptions"
import { PrescriptionForm } from "../../prescription-form"

export const dynamic = "force-dynamic"

export default async function ModifierPrescriptionPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const prescription = await getPrescriptionById(id)
  if (!prescription) notFound()
  if (prescription.statut !== "BROUILLON") {
    redirect(`/prescriptions/${id}`)
  }

  const [visites, produits, context] = await Promise.all([
    getVisitesRecentes(),
    listProduitsForPrescription(),
    getVisitePrescriptionContext(prescription.visite.id),
  ])

  return (
    <PrescriptionForm
      mode="edit"
      prescriptionId={prescription.id}
      visites={visites}
      produits={produits}
      initialVisiteContext={context}
      initialLibelle={prescription.libelle ?? ""}
      initialLignes={prescription.lignes}
    />
  )
}
