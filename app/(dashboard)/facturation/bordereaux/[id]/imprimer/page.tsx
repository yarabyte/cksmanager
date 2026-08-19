import { notFound } from "next/navigation"
import { getBordereauById } from "@/app/actions/bordereaux"
import { getParametres } from "@/app/actions/parametres"
import { requireBordereauPageAccess } from "@/lib/bordereau/access"
import { BordereauPrintClient, type PrintParametres } from "./bordereau-print-client"

export const dynamic = "force-dynamic"

export default async function ImprimerBordereauPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requireBordereauPageAccess()
  const { id } = await params
  const [bordereau, parametres] = await Promise.all([
    getBordereauById(id),
    getParametres(),
  ])
  if (!bordereau) notFound()

  return (
    <BordereauPrintClient
      bordereau={bordereau}
      parametres={parametres as PrintParametres}
    />
  )
}
