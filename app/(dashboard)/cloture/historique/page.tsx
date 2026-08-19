import { listCaisseSessionsHistorique } from "@/app/actions/caisse-sessions"
import { HistoriqueCaisseClient } from "./historique-caisse-client"

export const dynamic = "force-dynamic"

export default async function HistoriqueCaissePage() {
  const sessions = await listCaisseSessionsHistorique()
  return <HistoriqueCaisseClient sessions={sessions} />
}
