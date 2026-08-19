import { requirePharmaciePageSortie } from "@/lib/pharmacie/access"
import { listDocumentsSortieGrouped } from "@/app/actions/pharmacie-sortie"
import { SortiesClient } from "./sorties-client"

export const dynamic = "force-dynamic"

export default async function SortiesPage() {
  await requirePharmaciePageSortie()
  const data = await listDocumentsSortieGrouped()
  return <SortiesClient initial={data} />
}
