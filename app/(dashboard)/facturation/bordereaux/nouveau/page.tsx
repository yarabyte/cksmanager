import { listAssureursAvecFacturesEligibles } from "@/app/actions/bordereaux"
import { requireBordereauPageAccess } from "@/lib/bordereau/access"
import { NouveauBordereauClient } from "./nouveau-bordereau-client"

export const dynamic = "force-dynamic"

export default async function NouveauBordereauPage() {
  await requireBordereauPageAccess()
  const assureurs = await listAssureursAvecFacturesEligibles()
  return <NouveauBordereauClient assureurs={assureurs} />
}
