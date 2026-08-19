import { notFound } from "next/navigation"
import { requirePharmaciePageGestion } from "@/lib/pharmacie/access"
import { getTransfert } from "@/app/actions/pharmacie-ops"
import { TransfertDetailClient } from "./transfert-detail-client"

export const dynamic = "force-dynamic"

export default async function TransfertDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requirePharmaciePageGestion()
  const { id } = await params
  const transfert = await getTransfert(id)
  if (!transfert) notFound()
  return <TransfertDetailClient transfert={transfert as never} />
}
