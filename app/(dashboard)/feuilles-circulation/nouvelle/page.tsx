import {
  listCategoriesForFeuille,
  listActesForFeuille,
  listProduitsForFeuille,
  listKitsForFeuille,
  getVisitesRecentes,
} from "@/app/actions/feuilles-circulation"
import { FeuilleForm } from "../feuille-form"

export const dynamic = "force-dynamic"

export default async function NouvelleFeuillePage({
  searchParams,
}: {
  searchParams: Promise<{ visite?: string }>
}) {
  const { visite } = await searchParams
  const [categories, actes, produits, kits, visites] = await Promise.all([
    listCategoriesForFeuille(),
    listActesForFeuille(),
    listProduitsForFeuille(),
    listKitsForFeuille(),
    getVisitesRecentes(),
  ])

  return (
    <FeuilleForm
      mode="create"
      categories={categories}
      actes={actes}
      produits={produits}
      kits={kits}
      visites={visites}
      initialVisiteId={visite ?? null}
    />
  )
}
