import { notFound } from "next/navigation"
import { getBordereauById } from "@/app/actions/bordereaux"
import { getParametres } from "@/app/actions/parametres"
import { requireBordereauPageAccess } from "@/lib/bordereau/access"
import { BordereauDetailClient } from "./bordereau-detail-client"

export const dynamic = "force-dynamic"

export default async function BordereauDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requireBordereauPageAccess()
  const { id } = await params
  const [bordereau, parametres] = await Promise.all([
    getBordereauById(id),
    getParametres(),
  ])
  if (!bordereau) notFound()
  return (
    <BordereauDetailClient bordereau={bordereau} parametres={parametres} />
  )
}
