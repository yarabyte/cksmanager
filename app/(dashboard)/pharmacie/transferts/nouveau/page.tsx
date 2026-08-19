import { requirePharmaciePageGestion } from "@/lib/pharmacie/access"
import { listMagasins } from "@/app/actions/pharmacie-ops"
import { NouveauTransfertClient } from "./nouveau-transfert-client"

export const dynamic = "force-dynamic"

export default async function NouveauTransfertPage() {
  await requirePharmaciePageGestion()
  const magasins = await listMagasins()
  return <NouveauTransfertClient magasins={magasins as never} />
}
