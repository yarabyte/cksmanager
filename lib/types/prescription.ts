export type PrescriptionStatut = "BROUILLON" | "CONFIRMEE"
export type PrescriptionStatutPaiement = "IMPAYEE" | "PAYEE"

export type PrescriptionLigneRow = {
  id: string
  categorieId: string
  categorieNom: string | null
  produitId: string
  produitNom: string | null
  produitDosage: string | null
  quantite: number
  taux: number
  valeur: number
  hnc: number
  puSnapshot: number | null
  remiseUnitaire: number | null
  montantTotal: number
  montantAssurance: number
  montantPatient: number
  position: number
}

export type PrescriptionTotaux = {
  totalAssurance: number
  totalPatient: number
  totalHnc: number
  total: number
}

export type PrescriptionListRow = {
  id: string
  numero: string
  libelle: string | null
  statut: PrescriptionStatut
  statutPaiement: PrescriptionStatutPaiement
  visiteId: string
  patientId: string
  patientLabel: string | null
  patientDob: string | null
  dateVisite: string | null
  createdAt: string | null
  confirmedAt: string | null
  medecinId: string
  medecinNom: string | null
  nbLignes: number
  totalAssurance: number
  totalPatient: number
  total: number
}

export type PrescriptionDetail = {
  id: string
  numero: string
  libelle: string | null
  statut: PrescriptionStatut
  statutPaiement: PrescriptionStatutPaiement
  paidAt: string | null
  createdAt: string | null
  updatedAt: string | null
  confirmedAt: string | null
  medecinId: string
  userId: string
  visite: {
    id: string
    dateVisite: string
    patientId: string
    patientLabel: string | null
    patientDob: string | null
    medecinNom: string | null
    medecinNumeroOrdre: string | null
  }
  lignes: PrescriptionLigneRow[]
  totaux: PrescriptionTotaux
}

export type PrescriptionStats = {
  total: number
  brouillon: number
  confirmees: number
  impayees: number
  today: number
  totalPatientEnCours: number
}

export type PrescriptionProduitOption = {
  id: string
  nom: string
  dosage: string
  prixVenteRef: number
  hnc: number | null
}

export type VisitePrescriptionContext = {
  visiteId: string
  dateVisite: string
  patientId: string
  patientLabel: string | null
  patientDob: string | null
  medecinId: string
  medecinNom: string | null
  affiliation: {
    id: string
    assuranceId: string
    assuranceNom: string
    tauxCouverture: number
    dateDebut: string | null
    dateFin: string | null
    expiree: boolean
    couvertures: Record<string, number>
    valeurs: Record<string, number>
  } | null
  pharmacieCoverage?: number
  priseEnChargePatient?: boolean
  affiliationExpiree?: boolean
}

export type PrescriptionFilters = {
  periode?: string
  dateFrom?: string
  dateTo?: string
  patientId?: string
  visiteId?: string
  medecinId?: string
  statut?: string
}
