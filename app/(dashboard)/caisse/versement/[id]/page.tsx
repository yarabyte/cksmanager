import { notFound } from "next/navigation"
import { getVersementForRecu } from "@/app/actions/caisse-sessions"
import { VersementRecuPrintClient } from "./versement-recu-print-client"

export const dynamic = "force-dynamic"

export default async function VersementRecuPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const recu = await getVersementForRecu(id)
  if (!recu) notFound()
  return <VersementRecuPrintClient recu={recu} />
}
