import { notFound } from "next/navigation"
import { getHospitalisationById } from "@/app/actions/hospitalisation"
import { HospitalisationDetailClient } from "./hospitalisation-detail-client"

export const dynamic = "force-dynamic"

export default async function HospitalisationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const row = await getHospitalisationById(id)
  if (!row) notFound()
  return <HospitalisationDetailClient hospitalisation={row} />
}
