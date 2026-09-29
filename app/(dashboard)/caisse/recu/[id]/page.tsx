import { notFound } from "next/navigation"
import { getEncaissementForRecu } from "@/app/actions/caisse"
import { CaisseRecuPrintClient } from "./caisse-recu-print-client"

export default async function CaisseRecuPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ reprint?: string }>
}) {
  const { id } = await params
  const sp = await searchParams
  const recu = await getEncaissementForRecu(id)
  if (!recu) notFound()
  return <CaisseRecuPrintClient recu={recu} reprint={sp.reprint === "1"} />
}
