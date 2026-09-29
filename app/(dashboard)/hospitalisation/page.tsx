import { listHospitalisations } from "@/app/actions/hospitalisation"
import { HospitalisationListClient } from "./hospitalisation-list-client"

export const dynamic = "force-dynamic"

export default async function HospitalisationPage() {
  const rows = await listHospitalisations({ statut: "all" })
  return <HospitalisationListClient initialRows={rows} />
}
