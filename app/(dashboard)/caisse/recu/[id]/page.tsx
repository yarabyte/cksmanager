import { notFound } from "next/navigation"
import { getEncaissementForRecu } from "@/app/actions/caisse"
import { CaisseRecuPrintClient } from "./caisse-recu-print-client"

export default async function CaisseRecuPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const recu = await getEncaissementForRecu(id)
  if (!recu) notFound()
  return <CaisseRecuPrintClient recu={recu} />
}
