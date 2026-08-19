import { notFound } from "next/navigation"
import { getFactureById } from "@/app/actions/factures"
import { FactureDetailClient } from "./facture-detail-client"

export default async function FactureDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const facture = await getFactureById(id)
  if (!facture) notFound()
  return <FactureDetailClient facture={facture} />
}
