import { listFactures } from "@/app/actions/factures"
import { getCurrentUser } from "@/lib/auth/session"
import { canManageBordereaux } from "@/lib/bordereau/access"
import { FacturationClient } from "./facturation-client"

export const dynamic = "force-dynamic"

export default async function FacturationPage() {
  const [factures, user] = await Promise.all([listFactures(), getCurrentUser()])
  return (
    <FacturationClient
      factures={factures}
      showBordereaux={canManageBordereaux(user?.roles ?? user?.role)}
    />
  )
}
