import { requirePharmaciePageGestion } from "@/lib/pharmacie/access"
import { listApprovisionnements } from "@/app/actions/pharmacie-ops"
import {
  ApprovisionnementsClient,
  type ApprovisionnementRow,
} from "./approvisionnements-client"

export const dynamic = "force-dynamic"

export default async function ApprovisionnementsPage() {
  await requirePharmaciePageGestion()
  const rows = (await listApprovisionnements()) as ApprovisionnementRow[]
  return <ApprovisionnementsClient rows={rows} />
}
