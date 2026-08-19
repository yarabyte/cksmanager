import { notFound } from "next/navigation"
import { getPrescriptionById } from "@/app/actions/prescriptions"
import { getCurrentUser } from "@/lib/auth/session"
import { PrescriptionDetailClient } from "./prescription-detail-client"

export const dynamic = "force-dynamic"

export default async function PrescriptionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [prescription, user] = await Promise.all([getPrescriptionById(id), getCurrentUser()])
  if (!prescription) notFound()

  const canConfirm =
    user != null &&
    user.roles.includes("Médecin") &&
    user.id.toString() === prescription.userId

  return (
    <PrescriptionDetailClient prescription={prescription} canConfirm={canConfirm} />
  )
}
