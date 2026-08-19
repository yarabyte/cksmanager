import { notFound } from "next/navigation"
import { getVisiteById } from "@/app/actions/visites"
import { listFeuilles } from "@/app/actions/feuilles-circulation"
import { VisiteDetailClient } from "./visite-detail-client"

export const dynamic = "force-dynamic"

export default async function VisiteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [visite, feuilles] = await Promise.all([
    getVisiteById(id),
    listFeuilles({ visiteId: id }),
  ])
  if (!visite) notFound()
  return <VisiteDetailClient visite={visite} feuilles={feuilles} />
}
