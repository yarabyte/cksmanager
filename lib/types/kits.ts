/** Données sérialisées (BigInt → string) pour les actions / UI kits. */

export type KitActeLigneSerializable = {
  id: string
  typeLigne: string
  quantite: number
  position: number
  remiseUnitaire: string
  acte: { id: string; nom: string } | null
  produit: { id: string; nom: string; dosage: string } | null
}

export type KitActeDetailSerializable = {
  id: string
  nom: string
  description?: string | null
  actif: boolean
  user: { id: string; name: string; email: string }
  lignes: KitActeLigneSerializable[]
}

export type ActeSelectRow = { id: string; nom: string }
export type ProduitSelectRow = { id: string; nom: string; dosage: string }
