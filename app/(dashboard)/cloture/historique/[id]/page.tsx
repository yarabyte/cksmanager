import { notFound } from "next/navigation"
import { getCaisseSessionDetail } from "@/app/actions/caisse-sessions"
import { SessionDetailClient } from "./session-detail-client"

export const dynamic = "force-dynamic"

export default async function SessionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const session = await getCaisseSessionDetail(id)
  if (!session) notFound()

  return <SessionDetailClient session={session} />
}
