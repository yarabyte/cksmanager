import { getRapportCa } from "@/app/actions/rapports"
import { requireRapportsPageAccess } from "@/lib/rapports/access"
import { RapportsClient } from "./rapports-client"

export const dynamic = "force-dynamic"

export default async function RapportsPage() {
  await requireRapportsPageAccess()
  const initial = await getRapportCa({ vue: "patient", periode: "month", site: "all" })
  return <RapportsClient initial={initial} />
}
