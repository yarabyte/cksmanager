import { listFactures } from "@/app/actions/factures"
import { getCurrentUser } from "@/lib/auth/session"
import { canManageBordereaux } from "@/lib/bordereau/access"
import { FacturationClient } from "../facturation-client"

export const dynamic = "force-dynamic"

export default async function FacturationRecouvrementPage() {
  const [factures, user] = await Promise.all([
    listFactures({ view: "recouvrement" }),
    getCurrentUser(),
  ])
  return (
    <FacturationClient
      factures={factures}
      showBordereaux={canManageBordereaux(user?.roles ?? user?.role)}
      title="Recouvrement"
      description="Factures déposées chez l'assureur et en attente de paiement."
      showNewButton={false}
    />
  )
}
