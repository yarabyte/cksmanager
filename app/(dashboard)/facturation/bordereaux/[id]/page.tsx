import { notFound } from "next/navigation"
import { getBordereauById } from "@/app/actions/bordereaux"
import { getParametres } from "@/app/actions/parametres"
import { requireBordereauPageAccess } from "@/lib/bordereau/access"
import { BordereauDetailClient } from "./bordereau-detail-client"

export const dynamic = "force-dynamic"

export default async function BordereauDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ facture?: string }>
}) {
  await requireBordereauPageAccess()
  const { id } = await params
  const { facture } = await searchParams
  const [bordereau, parametres] = await Promise.all([
    getBordereauById(id),
    getParametres(),
  ])
  if (!bordereau) notFound()
  return (
    <BordereauDetailClient
      bordereau={bordereau}
      parametres={parametres}
      highlightFactureId={facture ?? null}
    />
  )
}
