import { redirect } from "next/navigation"
import { getVersementsPageData } from "@/app/actions/caisse-sessions"
import { VersementsPageClient } from "@/components/caisse/versements-page-client"

export const dynamic = "force-dynamic"

export default async function VersementsPage() {
  const data = await getVersementsPageData()
  if (!data) redirect("/caisse/ouverture")

  return <VersementsPageClient data={data} />
}
