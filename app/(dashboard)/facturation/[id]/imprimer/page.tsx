import { notFound } from "next/navigation"
import { getFacturePrintData } from "@/app/actions/factures"
import { getParametres } from "@/app/actions/parametres"
import { FacturePrintClient, type PrintParametres } from "./facture-print-client"

export const dynamic = "force-dynamic"

export default async function ImprimerFacturePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [facture, parametres] = await Promise.all([getFacturePrintData(id), getParametres()])
  if (!facture) notFound()

  return (
    <FacturePrintClient facture={facture} parametres={parametres as PrintParametres} />
  )
}
