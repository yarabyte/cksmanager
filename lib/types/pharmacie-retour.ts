export type RetourPharmacieRow = {
  id: string
  numero: string
  sortieId: string
  sortieNumero: string
  pharmacieNom: string
  userNom: string
  patientId: string
  patientLabel: string | null
  montantAvoir: number
  nbLignes: number
  motif: string | null
  createdAt: string | null
}

export type RetourPharmacieLigne = {
  id: string
  produitNom: string
  produitDosage: string | null
  numeroLot: string
  datePeremption: string
  quantite: number
  montantUnitaire: number
}

export type RetourPharmacieDetail = {
  id: string
  numero: string
  sortieId: string
  sortieNumero: string
  pharmacieNom: string
  userNom: string
  patientId: string
  patientLabel: string | null
  montantAvoir: number
  motif: string | null
  createdAt: string | null
  lignes: RetourPharmacieLigne[]
}
