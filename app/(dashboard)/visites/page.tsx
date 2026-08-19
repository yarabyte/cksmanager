import { Suspense } from "react"
import { listVisites, getVisiteStats, listMedecins, listMotifs } from "@/app/actions/visites"
import { VisitesClient } from "./visites-client"
import { Skeleton } from "@/components/ui/skeleton"

export const dynamic = "force-dynamic"

export default async function VisitesPage() {
  const [initialVisites, stats, medecins, motifs] = await Promise.all([
    listVisites({ periode: "week" }),
    getVisiteStats(),
    listMedecins(),
    listMotifs(),
  ])

  return (
    <Suspense fallback={<Skeleton className="h-96 w-full" />}>
      <VisitesClient
        initialVisites={initialVisites}
        stats={stats}
        medecins={medecins}
        motifs={motifs}
      />
    </Suspense>
  )
}
