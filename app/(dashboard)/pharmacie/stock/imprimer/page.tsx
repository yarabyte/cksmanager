import { requirePharmaciePageGestion } from "@/lib/pharmacie/access"
import { listMagasins, listStockLots } from "@/app/actions/pharmacie-ops"
import { getParametres } from "@/app/actions/parametres"
import { StockPrintClient, type StockColumnId } from "./stock-print-client"

export const dynamic = "force-dynamic"

const ALL_COLS: StockColumnId[] = [
  "produit",
  "forme",
  "conditionnement",
  "magasin",
  "lot",
  "peremption",
  "quantite",
  "prixAchat",
  "valeur",
]

function parseCols(raw?: string): StockColumnId[] {
  if (!raw?.trim()) return ALL_COLS
  const set = new Set(raw.split(",").map((c) => c.trim()))
  const cols = ALL_COLS.filter((c) => set.has(c))
  return cols.length > 0 ? cols : ALL_COLS
}

export default async function ImprimerStockPage({
  searchParams,
}: {
  searchParams: Promise<{
    magasinId?: string
    q?: string
    alertes?: string
    cols?: string
  }>
}) {
  await requirePharmaciePageGestion()
  const params = await searchParams
  const magasinId = params.magasinId || "all"
  const q = params.q || ""
  const alertesOnly = params.alertes === "1"
  const columns = parseCols(params.cols)

  const [lots, magasins, parametres] = await Promise.all([
    listStockLots({ magasinId, q }),
    listMagasins(),
    getParametres(),
  ])

  const rows = (
    lots as {
      id: string
      produitNom: string
      produitDosage: string
      produitForme: string
      produitConditionnement: string
      magasinNom: string
      numeroLot: string
      datePeremption: string
      quantite: number
      prixAchat: number
      valeur: number
      alerteStock: boolean
      alertePeremption: boolean
    }[]
  ).filter((l) => (alertesOnly ? l.alerteStock || l.alertePeremption : true))

  const magasinNom =
    magasinId === "all"
      ? "Tous les magasins"
      : ((magasins as { id: string; nom: string }[]).find((m) => m.id === magasinId)
          ?.nom ?? "Magasin")

  return (
    <StockPrintClient
      lots={rows}
      columns={columns}
      magasinNom={magasinNom}
      recherche={q}
      alertesOnly={alertesOnly}
      parametres={parametres as never}
    />
  )
}
