import { requirePharmaciePageGestion } from "@/lib/pharmacie/access"
import { listMagasins, listPharmacies } from "@/app/actions/pharmacie-ops"
import { OfficinesClient } from "./officines-client"

export const dynamic = "force-dynamic"

export default async function OfficinesPage() {
  await requirePharmaciePageGestion()
  const [pharmacies, magasins] = await Promise.all([listPharmacies(), listMagasins()])
  return (
    <OfficinesClient
      initial={pharmacies as never}
      magasins={(magasins as { id: string; nom: string; pharmacieId: string | null }[]).filter(
        (m) => m,
      )}
    />
  )
}
