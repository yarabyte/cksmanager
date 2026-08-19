import { listPrescriptions, getPrescriptionStats } from "@/app/actions/prescriptions"
import { PrescriptionsClient } from "./prescriptions-client"

export const dynamic = "force-dynamic"

export default async function PrescriptionsPage() {
  const [prescriptions, stats] = await Promise.all([
    listPrescriptions({}),
    getPrescriptionStats(),
  ])

  return (
    <PrescriptionsClient
      initialPrescriptions={prescriptions}
      stats={stats}
    />
  )
}
