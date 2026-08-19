import { requirePharmaciePageGestion } from "@/lib/pharmacie/access"
import { listMagasins } from "@/app/actions/pharmacie-ops"
import { MagasinsClient } from "./magasins-client"

export const dynamic = "force-dynamic"

export default async function MagasinsPage() {
  await requirePharmaciePageGestion()
  const magasins = await listMagasins()
  return <MagasinsClient initial={magasins as never} />
}
