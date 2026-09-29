import { listFactures } from "@/app/actions/factures"
import { getCurrentUser } from "@/lib/auth/session"
import { canManageBordereaux } from "@/lib/bordereau/access"
import { FacturationClient } from "../facturation-client"

export const dynamic = "force-dynamic"

export default async function FacturationPayePage() {
  const [factures, user] = await Promise.all([
    listFactures({ view: "paye" }),
    getCurrentUser(),
  ])
  return (
    <FacturationClient
      factures={factures}
      showBordereaux={canManageBordereaux(user?.roles ?? user?.role)}
      title="Payé"
      description="Factures entièrement réglées (part patient et part assureur)."
      showNewButton={false}
      view="paye"
    />
  )
}
