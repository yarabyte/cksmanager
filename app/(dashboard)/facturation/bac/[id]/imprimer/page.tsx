import { notFound } from "next/navigation"
import { getFacturePrintData } from "@/app/actions/factures"
import { getParametres } from "@/app/actions/parametres"
import { prisma } from "@/lib/prisma"
import {
  FacturePrintClient,
  type PrintParametres,
} from "../../../[id]/imprimer/facture-print-client"

export const dynamic = "force-dynamic"

export default async function ImprimerBacFacturePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id: bacId } = await params
  const bac = await prisma.bacFacture.findUnique({
    where: { id: BigInt(bacId) },
    select: { id: true, factureId: true, statut: true },
  })
  if (!bac || bac.statut !== "PENDING") notFound()

  const [facture, parametres] = await Promise.all([
    getFacturePrintData(bac.factureId.toString()),
    getParametres(),
  ])
  if (!facture) notFound()

  return (
    <FacturePrintClient
      facture={facture}
      parametres={parametres as PrintParametres}
      bacItemId={bac.id.toString()}
      backHref="/facturation/bac"
    />
  )
}
