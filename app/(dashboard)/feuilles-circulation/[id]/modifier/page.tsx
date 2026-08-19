import { notFound, redirect } from "next/navigation"
import {
  getFeuilleById,
  getVisiteFeuilleContext,
  listCategoriesForFeuille,
  listActesForFeuille,
  listProduitsForFeuille,
  listKitsForFeuille,
} from "@/app/actions/feuilles-circulation"
import { FeuilleForm } from "../../feuille-form"

export const dynamic = "force-dynamic"

export default async function ModifierFeuillePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const feuille = await getFeuilleById(id)
  if (!feuille) notFound()
  if (feuille.statut !== "BROUILLON") {
    redirect(`/feuilles-circulation/${id}`)
  }

  const [categories, actes, produits, kits, context] = await Promise.all([
    listCategoriesForFeuille(),
    listActesForFeuille(),
    listProduitsForFeuille(),
    listKitsForFeuille(),
    getVisiteFeuilleContext(feuille.visite.id),
  ])

  return (
    <FeuilleForm
      mode="edit"
      feuilleId={feuille.id}
      categories={categories}
      actes={actes}
      produits={produits}
      kits={kits}
      initialVisiteContext={context}
      initialLibelle={feuille.libelle ?? ""}
      initialLignes={feuille.lignes}
    />
  )
}
