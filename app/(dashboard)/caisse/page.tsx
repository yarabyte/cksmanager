import { redirect } from "next/navigation"
import {
  getCaisseStats,
  getJournalCaisseJour,
  listEncaissementsEnAttente,
} from "@/app/actions/caisse"
import { getActiveCaisseSession } from "@/app/actions/caisse-sessions"
import { CaissePageClient } from "./caisse-page-client"
import { getCurrentUser } from "@/lib/auth/session"
import { userIsAdmin } from "@/lib/user-role"

export const dynamic = "force-dynamic"

export default async function CaissePage() {
  const session = await getActiveCaisseSession()
  if (!session) redirect("/caisse/ouverture")

  const user = await getCurrentUser()
  const canManageVersements = userIsAdmin(user?.roles)

  const [stats, pending, journal] = await Promise.all([
    getCaisseStats(),
    listEncaissementsEnAttente(),
    getJournalCaisseJour(session.id),
  ])

  return (
    <CaissePageClient
      initialStats={stats}
      initialPending={pending}
      initialJournal={journal}
      session={session}
      canManageVersements={canManageVersements}
    />
  )
}
