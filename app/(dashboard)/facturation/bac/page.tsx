import { listBacFacturesPending } from "@/app/actions/bac-factures"
import { getCurrentUser } from "@/lib/auth/session"
import { canManageBordereaux } from "@/lib/bordereau/access"
import { BacFacturesClient } from "./bac-factures-client"

export const dynamic = "force-dynamic"

export default async function BacFacturesPage() {
  const [items, user] = await Promise.all([listBacFacturesPending(), getCurrentUser()])
  return (
    <BacFacturesClient
      items={items}
      showBordereaux={canManageBordereaux(user?.roles ?? user?.role)}
    />
  )
}
