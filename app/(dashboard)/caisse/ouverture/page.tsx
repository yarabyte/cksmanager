import { redirect } from "next/navigation"
import { listPostesDisponiblesPourOuverture } from "@/app/actions/caisse-sessions"
import { OuvertureCaisseClient } from "./ouverture-caisse-client"

export const dynamic = "force-dynamic"

export default async function OuvertureCaissePage() {
  const data = await listPostesDisponiblesPourOuverture()
  if (data.hasOpenSession) redirect("/caisse")

  return (
    <OuvertureCaisseClient
      postes={data.postes}
      hasOpenSession={data.hasOpenSession}
      requiresAssignment={"requiresAssignment" in data && data.requiresAssignment}
      assignedPosteInactif={"assignedPosteInactif" in data && data.assignedPosteInactif}
      assignedPosteNom={"assignedPosteNom" in data ? data.assignedPosteNom ?? null : null}
      posteOccupe={"posteOccupe" in data && data.posteOccupe}
    />
  )
}
