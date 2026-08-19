import { requirePharmaciePageSortie } from "@/lib/pharmacie/access"
import { listRetours } from "@/app/actions/pharmacie-retour"
import { RetoursClient } from "./retours-client"

export const dynamic = "force-dynamic"

export default async function RetoursPage() {
  await requirePharmaciePageSortie()
  const rows = await listRetours()

  return <RetoursClient initial={rows} />
}
