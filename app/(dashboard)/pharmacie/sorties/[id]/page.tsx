import { notFound } from "next/navigation"
import { getSortie } from "@/app/actions/pharmacie-sortie"
import { requirePharmaciePageSortie } from "@/lib/pharmacie/access"
import { SortieDetailClient } from "./sortie-detail-client"

export const dynamic = "force-dynamic"

export default async function SortieDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requirePharmaciePageSortie()
  const { id } = await params
  const sortie = await getSortie(id)
  if (!sortie) notFound()
  return <SortieDetailClient sortie={sortie} />
}
