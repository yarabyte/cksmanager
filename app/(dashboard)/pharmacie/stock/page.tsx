import { requirePharmaciePageGestion } from "@/lib/pharmacie/access"
import { listMagasins, listStockLots } from "@/app/actions/pharmacie-ops"
import { StockClient } from "./stock-client"

export const dynamic = "force-dynamic"

export default async function StockPage() {
  await requirePharmaciePageGestion()
  const [lots, magasins] = await Promise.all([listStockLots(), listMagasins()])
  return <StockClient initial={lots as never} magasins={magasins as never} />
}
