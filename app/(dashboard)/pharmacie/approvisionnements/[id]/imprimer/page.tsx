import { notFound, redirect } from "next/navigation"
import { requirePharmaciePageGestion } from "@/lib/pharmacie/access"
import { getApprovisionnement } from "@/app/actions/pharmacie-ops"
import { getParametres } from "@/app/actions/parametres"
import { ApprovisionnementPrintClient } from "./approvisionnement-print-client"

export const dynamic = "force-dynamic"

export default async function ImprimerApprovisionnementPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requirePharmaciePageGestion()
  const { id } = await params
  const [appro, parametres] = await Promise.all([
    getApprovisionnement(id),
    getParametres(),
  ])
  if (!appro) notFound()
  const a = appro as { statut?: string }
  if (a.statut !== "VALIDE") {
    redirect(`/pharmacie/approvisionnements/${id}`)
  }
  return (
    <ApprovisionnementPrintClient
      appro={appro as never}
      parametres={parametres as never}
    />
  )
}
