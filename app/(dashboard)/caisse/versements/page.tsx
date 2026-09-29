import { redirect } from "next/navigation"
import { getVersementsPageData } from "@/app/actions/caisse-sessions"
import { VersementsPageClient } from "@/components/caisse/versements-page-client"
import { getCurrentUser } from "@/lib/auth/session"
import { userIsAdmin } from "@/lib/user-role"

export const dynamic = "force-dynamic"

export default async function VersementsPage() {
  const user = await getCurrentUser()
  if (!user || !userIsAdmin(user.roles)) redirect("/caisse")

  const data = await getVersementsPageData()
  if (!data) redirect("/caisse/ouverture")

  return <VersementsPageClient data={data} />
}
