import { notFound } from "next/navigation"
import { requirePharmaciePageGestion } from "@/lib/pharmacie/access"
import { getApprovisionnement } from "@/app/actions/pharmacie-ops"
import { ApprovisionnementDetailClient } from "./approvisionnement-detail-client"

export const dynamic = "force-dynamic"

export default async function ApprovisionnementDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requirePharmaciePageGestion()
  const { id } = await params
  const appro = await getApprovisionnement(id)
  if (!appro) notFound()
  return <ApprovisionnementDetailClient appro={appro as never} />
}
