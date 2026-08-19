import { requirePharmaciePageSortie } from "@/lib/pharmacie/access"
import { listSorties } from "@/app/actions/pharmacie-sortie"
import { NouveauRetourClient } from "./nouveau-retour-client"

export const dynamic = "force-dynamic"

export default async function NouveauRetourPage() {
  await requirePharmaciePageSortie()
  const sorties = await listSorties()
  return <NouveauRetourClient sorties={sorties as never} />
}
