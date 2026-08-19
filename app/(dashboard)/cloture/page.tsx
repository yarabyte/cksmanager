import { redirect } from "next/navigation"
import { getClotureContext } from "@/app/actions/caisse-sessions"
import { CloturePageClient } from "./cloture-page-client"

export const dynamic = "force-dynamic"

export default async function CloturePage() {
  const context = await getClotureContext()
  if (!context) redirect("/caisse/ouverture")

  return <CloturePageClient context={context} />
}
