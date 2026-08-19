import { listAssureursPourBordereau, listBordereaux } from "@/app/actions/bordereaux"
import { requireBordereauPageAccess } from "@/lib/bordereau/access"
import { BordereauxClient } from "./bordereaux-client"

export const dynamic = "force-dynamic"

export default async function BordereauxPage() {
  await requireBordereauPageAccess()
  const [bordereaux, assureurs] = await Promise.all([
    listBordereaux(),
    listAssureursPourBordereau(),
  ])
  return <BordereauxClient bordereaux={bordereaux} assureurs={assureurs} />
}
