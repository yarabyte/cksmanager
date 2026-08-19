import { listFeuilles, getFeuilleStats } from "@/app/actions/feuilles-circulation"
import { FeuillesCirculationClient } from "./feuilles-circulation-client"

export const dynamic = "force-dynamic"

export default async function FeuillesCirculationPage() {
  const [feuilles, stats] = await Promise.all([listFeuilles({}), getFeuilleStats()])

  return <FeuillesCirculationClient initialFeuilles={feuilles} stats={stats} />
}
