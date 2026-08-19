import { requirePharmaciePageGestion } from "@/lib/pharmacie/access"
import { listMagasins } from "@/app/actions/pharmacie-ops"
import { listFournisseurs, listProduitsForApproSelect } from "@/app/actions/pharmacie"
import { NouveauApproClient } from "./nouveau-appro-client"

export const dynamic = "force-dynamic"

export default async function NouveauApproPage() {
  await requirePharmaciePageGestion()
  const [magasins, fournisseurs, produits] = await Promise.all([
    listMagasins(),
    listFournisseurs(),
    listProduitsForApproSelect(),
  ])
  const fournisseursRaw = fournisseurs as unknown as {
    id: string
    raisonSociale: string
  }[]
  return (
    <NouveauApproClient
      magasins={magasins as never}
      fournisseurs={fournisseursRaw.map((f) => ({
        id: f.id,
        nom: f.raisonSociale,
      }))}
      produits={produits}
    />
  )
}
