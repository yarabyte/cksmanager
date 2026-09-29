export type HospitalisationStatut = 'EN_COURS' | 'SORTI'

export type HospitalisationListRow = {
  id: string
  visiteId: string
  patientId: string
  patientLabel: string | null
  medecinNom: string | null
  dateEntree: string
  dateSortie: string | null
  dateVisite: string | null
  statut: HospitalisationStatut
  nbFeuilles: number
  createdAt: string | null
}

export type HospitalisationFeuilleRow = {
  id: string
  numero: string
  libelle: string | null
  statut: string
  statutPaiement: string
  montantPatient: number
  montantAssurance: number
  createdAt: string | null
  /** Déjà liée à une facture */
  dejaFacturee: boolean
  /** Éligible au regroupement à la sortie */
  eligibleFacture: boolean
}

export type HospitalisationDetail = {
  id: string
  visiteId: string
  patientId: string
  patientLabel: string | null
  patientDob: string | null
  medecinNom: string | null
  dateEntree: string
  dateSortie: string | null
  dateVisite: string | null
  statut: HospitalisationStatut
  commentaires: string | null
  createdAt: string | null
  factureId: string | null
  factureNumero: string | null
  feuilles: HospitalisationFeuilleRow[]
}

export type VisiteEligibleHospitalisation = {
  id: string
  dateVisite: string
  patientId: string
  patientLabel: string | null
  medecinNom: string | null
}
