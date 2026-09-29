import { listVisitesEligiblesHospitalisation } from "@/app/actions/hospitalisation"
import { NouvelleHospitalisationClient } from "./nouvelle-hospitalisation-client"

export const dynamic = "force-dynamic"

export default async function NouvelleHospitalisationPage() {
  const visites = await listVisitesEligiblesHospitalisation()
  return <NouvelleHospitalisationClient visites={visites} />
}
