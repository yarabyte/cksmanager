import { notFound } from "next/navigation"
import { getFeuilleById } from "@/app/actions/feuilles-circulation"
import { getParametres } from "@/app/actions/parametres"
import { FeuillePrintClient, type PrintParametres } from "./feuille-print-client"

export const dynamic = "force-dynamic"

export default async function ImprimerFeuillePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [feuille, parametres] = await Promise.all([getFeuilleById(id), getParametres()])
  if (!feuille) notFound()

  return (
    <FeuillePrintClient feuille={feuille} parametres={parametres as PrintParametres} />
  )
}
