import { notFound, redirect } from "next/navigation"
import { requirePharmaciePageGestion } from "@/lib/pharmacie/access"
import { getApprovisionnement, listMagasins } from "@/app/actions/pharmacie-ops"
import { listFournisseurs, listProduitsForApproSelect } from "@/app/actions/pharmacie"
import { NouveauApproClient } from "../../nouveau/nouveau-appro-client"

export const dynamic = "force-dynamic"

export default async function EditApprovisionnementPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requirePharmaciePageGestion()
  const { id } = await params
  const appro = await getApprovisionnement(id)
  if (!appro) notFound()

  const a = appro as {
    id: string
    numero: string
    statut: string
    magasinId: string
    fournisseurId: string | null
    dateReception: string
    note: string | null
    lignes: {
      produitId: string | null
      quantite: number
      numeroLot: string
      datePeremption: string
      prixAchatUnitaire: number
    }[]
  }

  if (a.statut === "VALIDE") {
    redirect(`/pharmacie/approvisionnements/${id}`)
  }

  const [magasins, fournisseurs, produits] = await Promise.all([
    listMagasins(),
    listFournisseurs(),
    listProduitsForApproSelect({
      includeIds: a.lignes
        .map((l) => l.produitId)
        .filter((produitId): produitId is string => Boolean(produitId)),
    }),
  ])

  const fournisseursRaw = fournisseurs as unknown as {
    id: string
    raisonSociale: string
  }[]

  return (
    <NouveauApproClient
      magasins={magasins as never}
      fournisseurs={fournisseursRaw.map((f) => ({
        id: f.id,
        nom: f.raisonSociale,
      }))}
      produits={produits}
      initial={{
        id: a.id,
        numero: a.numero,
        magasinId: a.magasinId,
        fournisseurId: a.fournisseurId,
        dateReception: a.dateReception,
        note: a.note,
        lignes: a.lignes,
      }}
    />
  )
}
