import { getVisitesRecentes } from "@/app/actions/feuilles-circulation"
import { listProduitsForPrescription } from "@/app/actions/prescriptions"
import { PrescriptionForm } from "../prescription-form"

export const dynamic = "force-dynamic"

export default async function NouvellePrescriptionPage({
  searchParams,
}: {
  searchParams: Promise<{ visite?: string }>
}) {
  const { visite } = await searchParams
  const [visites, produits] = await Promise.all([
    getVisitesRecentes(),
    listProduitsForPrescription(),
  ])

  return (
    <PrescriptionForm
      mode="create"
      visites={visites}
      produits={produits}
      initialVisiteId={visite ?? null}
    />
  )
}
