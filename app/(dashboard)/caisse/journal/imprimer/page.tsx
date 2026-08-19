import { redirect } from "next/navigation"
import { getJournalCaisseJour } from "@/app/actions/caisse"
import { getActiveCaisseSession } from "@/app/actions/caisse-sessions"
import { getParametres } from "@/app/actions/parametres"
import { CaisseJournalPrintClient } from "@/components/caisse/caisse-journal-print-client"
import { getJournalPeriodeLabel } from "@/lib/caisse/journal-labels"

export const dynamic = "force-dynamic"

export default async function CaisseJournalImprimerPage({
  searchParams,
}: {
  searchParams: Promise<{
    periode?: string
    dateFrom?: string
    dateTo?: string
  }>
}) {
  const session = await getActiveCaisseSession()
  if (!session) redirect("/caisse/ouverture")

  const params = await searchParams
  const periode = params.periode ?? "today"
  const dateFrom = params.dateFrom
  const dateTo = params.dateTo

  const [journal, parametres] = await Promise.all([
    getJournalCaisseJour(session.id, {
      periode,
      ...(periode === "custom" && dateFrom
        ? { dateFrom, dateTo: dateTo || dateFrom }
        : {}),
    }),
    getParametres(),
  ])

  return (
    <CaisseJournalPrintClient
      journal={journal}
      posteNom={session.posteNom}
      periodeLabel={getJournalPeriodeLabel(
        periode,
        dateFrom,
        dateTo || dateFrom,
      )}
      parametres={{
        nomClinique: parametres?.nomClinique ?? null,
        adresse: parametres?.adresse ?? null,
        telephone: parametres?.telephone ?? null,
      }}
    />
  )
}
