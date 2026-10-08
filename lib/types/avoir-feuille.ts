export type AvoirFeuilleStatut = 'ACTIF' | 'ANNULE'
export type AvoirFeuilleNature = 'SOLDE' | 'EXONERATION'

export type AvoirFeuilleListRow = {
  id: string
  numero: string
  feuilleId: string
  feuilleNumero: string
  patientLabel: string | null
  nature: AvoirFeuilleNature
  montant: number
  motif: string
  statut: AvoirFeuilleStatut
  createdAt: string | null
}

export type AvoirFeuilleSummary = {
  id: string
  numero: string
  feuilleId: string
  montant: number
  motif: string
  statut: AvoirFeuilleStatut
  createdAt: string | null
  userName: string | null
  cancelledAt: string | null
  cancelledByName: string | null
}

export type AvoirFeuilleDetail = AvoirFeuilleSummary & {
  feuilleNumero: string
  patientId: string
  patientLabel: string | null
  patientDob: string | null
  dateVisite: string | null
  medecinNom: string | null
  totalPatientFeuille: number
  totalAssuranceFeuille: number
  clinique: {
    nomClinique: string | null
    adresse: string | null
    telephone: string | null
    email: string | null
    niu: string | null
    registreCommerce: string | null
  }
}
