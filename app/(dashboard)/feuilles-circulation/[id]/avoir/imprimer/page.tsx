import { notFound, redirect } from "next/navigation"
import { getAvoirByFeuilleId } from "@/app/actions/avoirs-feuilles"
import { prisma } from "@/lib/prisma"
import { AvoirPrintClient } from "./avoir-print-client"

export const dynamic = "force-dynamic"

export default async function AvoirImprimerPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ nature?: string }>
}) {
  const { id } = await params
  const { nature } = await searchParams
  const avoir = await getAvoirByFeuilleId(
    id,
    nature === "EXONERATION" ? "EXONERATION" : "SOLDE",
  )
  if (!avoir) notFound()
  if (avoir.statut !== "ACTIF") {
    redirect(`/feuilles-circulation/${id}`)
  }

  const parametres = await prisma.parametre.findFirst({
    select: {
      nomClinique: true,
      logo: true,
      adresse: true,
      telephone: true,
      email: true,
      niu: true,
      registreCommerce: true,
      noteBasPage1: true,
      noteBasPage2: true,
    },
  })

  return <AvoirPrintClient avoir={avoir} parametres={parametres} />
}
