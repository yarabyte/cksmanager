import { getRapportCa } from "@/app/actions/rapports"
import { getParametres } from "@/app/actions/parametres"
import { requireRapportsPageAccess } from "@/lib/rapports/access"
import type { RapportPeriode, RapportSite, RapportVue } from "@/lib/types/rapport"
import { RapportPrintClient, type PrintParametres } from "./rapport-print-client"

export const dynamic = "force-dynamic"

const VUES: RapportVue[] = ["patient", "medecin", "assureur", "categorie", "jour"]
const PERIODES: RapportPeriode[] = [
  "today",
  "yesterday",
  "week",
  "month",
  "year",
  "custom",
]
const SITES: RapportSite[] = ["all", "CKS", "PLENITUDE"]

export default async function ImprimerRapportPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  await requireRapportsPageAccess()
  const params = await searchParams

  const vueRaw = typeof params.vue === "string" ? params.vue : "patient"
  const periodeRaw = typeof params.periode === "string" ? params.periode : "month"
  const siteRaw = typeof params.site === "string" ? params.site : "all"
  const vue = (VUES.includes(vueRaw as RapportVue) ? vueRaw : "patient") as RapportVue
  const periode = (
    PERIODES.includes(periodeRaw as RapportPeriode) ? periodeRaw : "month"
  ) as RapportPeriode
  const site = (SITES.includes(siteRaw as RapportSite) ? siteRaw : "all") as RapportSite
  const dateDebut = typeof params.dateDebut === "string" ? params.dateDebut : null
  const dateFin = typeof params.dateFin === "string" ? params.dateFin : null

  const [rapport, parametres] = await Promise.all([
    getRapportCa({ vue, periode, dateDebut, dateFin, site }),
    getParametres(),
  ])

  return (
    <RapportPrintClient rapport={rapport} parametres={parametres as PrintParametres} />
  )
}
