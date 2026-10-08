import { listAvoirsFeuilles } from "@/app/actions/avoirs-feuilles"
import { getCurrentUser } from "@/lib/auth/session"
import { canManageBordereaux } from "@/lib/bordereau/access"
import { AvoirsClient } from "./avoirs-client"

export const dynamic = "force-dynamic"

export default async function FacturationAvoirsPage() {
  const [avoirs, user] = await Promise.all([listAvoirsFeuilles(), getCurrentUser()])
  return (
    <AvoirsClient
      avoirs={avoirs}
      showBordereaux={canManageBordereaux(user?.roles ?? user?.role)}
    />
  )
}
