export type BordereauStatut = 'BROUILLON' | 'DEPOSE' | 'PAYE'

/** Suivi assureur dérivé du bordereau lié à une facture. */
export type FactureSuiviAssureurStatut =
  | 'A_DEPOSER'
  | 'EN_BORDEREAU'
  | 'DEPOSE'
  | 'PAYE'

export type FactureSuiviAssureur = {
  statut: FactureSuiviAssureurStatut
  bordereauId: string | null
  bordereauNumero: string | null
  assuranceId: string | null
  assuranceNom: string | null
}

export type BordereauListRow = {
  id: string
  numero: string
  assuranceId: string
  assuranceNom: string
  assuranceCode: string | null
  statut: BordereauStatut
  montantTotal: number
  nbFactures: number
  dateDepot: string | null
  datePaiement: string | null
  refVirement: string | null
  createdAt: string | null
}

export type BordereauFactureRow = {
  factureId: string
  factureNumero: string
  patientId: string
  patientLabel: string | null
  dateVisite: string | null
  montantAssurance: number
  statutFacture: string
}

export type BordereauDetail = {
  id: string
  numero: string
  assuranceId: string
  assuranceNom: string
  assuranceCode: string | null
  statut: BordereauStatut
  montantTotal: number
  dateDepot: string | null
  noteDepot: string | null
  datePaiement: string | null
  refVirement: string | null
  createdAt: string | null
  factures: BordereauFactureRow[]
}

export type FactureEligibleBordereau = {
  id: string
  numero: string
  patientId: string
  patientLabel: string | null
  dateVisite: string | null
  montantAssurance: number
  statut: string
}
