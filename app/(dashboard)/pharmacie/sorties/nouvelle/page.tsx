import { Suspense } from "react"
import { requirePharmaciePageSortie } from "@/lib/pharmacie/access"
import { NouvelleSortieClient } from "./nouvelle-sortie-client"

export const dynamic = "force-dynamic"

export default async function NouvelleSortiePage() {
  await requirePharmaciePageSortie()
  return (
    <Suspense fallback={null}>
      <NouvelleSortieClient />
    </Suspense>
  )
}
