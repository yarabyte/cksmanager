import { requirePharmaciePageSortie } from "@/lib/pharmacie/access"
import { listMedicamentsSortis } from "@/app/actions/pharmacie-sortie"
import { MedicamentsSortisClient } from "./medicaments-sortis-client"

export const dynamic = "force-dynamic"

export default async function MedicamentsSortisPage() {
  await requirePharmaciePageSortie()
  const data = await listMedicamentsSortis({ period: "today" })
  return <MedicamentsSortisClient initial={data} />
}
