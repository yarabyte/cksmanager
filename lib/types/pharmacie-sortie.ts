export type PharmacieAccessible = {
  id: string
  nom: string
  magasinId: string
  magasinNom: string
}

export type SortiePharmacieRow = {
  id: string
  numero: string
  statut: string
  nbLignes: number
  userNom: string
  pharmacieNom: string
  createdAt: string | null
}

export type SortiePharmacieLigne = {
  id: string
  produitNom: string
  produitDosage: string | null
  quantiteDemandee: number
  quantiteServie: number
  numeroLot: string
  datePeremption: string
  montantPatientUnitaire: number
}

export type SortiePharmacieDetail = {
  id: string
  numero: string
  pharmacieNom: string
  magasinNom: string
  userNom: string
  statut: string
  encaissementId: string | null
  encaissementNumero: string | null
  factureId: string | null
  factureNumero: string | null
  feuilleId: string | null
  feuilleNumero: string | null
  prescriptionId: string | null
  prescriptionNumero: string | null
  patientId: string
  patientLabel: string | null
  createdAt: string | null
  lignes: SortiePharmacieLigne[]
}

export type DocumentSortieGroup = {
  groupKey: string
  type: 'FEUILLE' | 'FACTURE' | 'PRESCRIPTION'
  documentNumero: string
  encaissementId: string | null
  encaissementNumero: string | null
  factureId: string | null
  factureNumero: string | null
  feuilleId: string | null
  feuilleNumero: string | null
  prescriptionId: string | null
  prescriptionNumero: string | null
  patientId: string
  patientLabel: string | null
  statutService: 'A_SERVIR' | 'PARTIELLE' | 'COMPLETE'
  nbProduitsRestants: number
  referenceSortie: string
  sorties: SortiePharmacieRow[]
  derniereActivite: string | null
}

export type SortiesGroupedResult = {
  pharmacies: PharmacieAccessible[]
  defaultPharmacieId: string | null
  groups: DocumentSortieGroup[]
}

export type StockLotPreview = {
  stockLotId: string
  numeroLot: string
  datePeremption: string
  quantiteDisponible: number
  quantiteAllouee: number
}

export type ProduitSortiePreview = {
  produitId: string
  quantite: number
  stockDisponible: number
  stockSuffisant: boolean
  lots: StockLotPreview[]
  message?: string | null
}

export type SortieFefoPreview = {
  pharmacieNom: string
  magasinNom: string
  produits: ProduitSortiePreview[]
  peutValider: boolean
}
