import { requirePharmaciePageSortie } from "@/lib/pharmacie/access"
import {
  listMedicamentsSortis,
  type MedicamentSortiPeriod,
} from "@/app/actions/pharmacie-sortie"
import { getParametres } from "@/app/actions/parametres"
import { MedicamentsSortisPrintClient } from "./medicaments-sortis-print-client"

export const dynamic = "force-dynamic"

const PERIODS: MedicamentSortiPeriod[] = [
  "today",
  "yesterday",
  "week",
  "month",
  "all",
]

export default async function ImprimerMedicamentsSortisPage({
  searchParams,
}: {
  searchParams: Promise<{
    period?: string
    pharmacieId?: string
    q?: string
  }>
}) {
  await requirePharmaciePageSortie()
  const params = await searchParams
  const periodRaw = params.period ?? "today"
  const period = (
    PERIODS.includes(periodRaw as MedicamentSortiPeriod) ? periodRaw : "today"
  ) as MedicamentSortiPeriod
  const pharmacieId = params.pharmacieId || undefined
  const q = params.q?.trim() || undefined

  const [data, parametres] = await Promise.all([
    listMedicamentsSortis({ period, pharmacieId, q }),
    getParametres(),
  ])

  const pharmacieNom = pharmacieId
    ? (data.pharmacies.find((p) => p.id === pharmacieId)?.nom ?? "Pharmacie")
    : "Toutes les pharmacies"

  return (
    <MedicamentsSortisPrintClient
      rows={data.rows}
      totalQuantite={data.totalQuantite}
      period={period}
      pharmacieNom={pharmacieNom}
      recherche={q ?? ""}
      parametres={
        parametres as {
          nomClinique?: string | null
          adresse?: string | null
          telephone?: string | null
          email?: string | null
        } | null
      }
    />
  )
}
