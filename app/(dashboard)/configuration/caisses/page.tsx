import { listCaissePostes } from "@/app/actions/caisse-postes"
import { CaissesConfigClient } from "./caisses-config-client"

export const dynamic = "force-dynamic"

export default async function CaissesConfigPage() {
  const postes = await listCaissePostes()
  return <CaissesConfigClient initialPostes={postes} />
}
