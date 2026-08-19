import { notFound } from "next/navigation"
import { requirePharmaciePageGestion } from "@/lib/pharmacie/access"
import { getTransfert } from "@/app/actions/pharmacie-ops"
import { getParametres } from "@/app/actions/parametres"
import { TransfertPrintClient } from "./transfert-print-client"

export const dynamic = "force-dynamic"

export default async function ImprimerTransfertPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requirePharmaciePageGestion()
  const { id } = await params
  const [transfert, parametres] = await Promise.all([getTransfert(id), getParametres()])
  if (!transfert) notFound()
  return (
    <TransfertPrintClient
      transfert={transfert as never}
      parametres={parametres as never}
    />
  )
}
