import { notFound } from "next/navigation"
import { getFeuilleById } from "@/app/actions/feuilles-circulation"
import { getCurrentUser } from "@/lib/auth/session"
import { FeuilleDetailClient } from "./feuille-detail-client"

export const dynamic = "force-dynamic"

export default async function FeuilleDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [feuille, user] = await Promise.all([getFeuilleById(id), getCurrentUser()])
  if (!feuille) notFound()

  const canManageAvoir =
    user != null &&
    (user.roles.includes("Admin") || user.roles.includes("Manager"))

  return (
    <FeuilleDetailClient feuille={feuille} canManageAvoir={canManageAvoir} />
  )
}
