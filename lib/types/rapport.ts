export type RapportVue = 'patient' | 'medecin' | 'assureur' | 'categorie' | 'jour'

export type RapportPeriode =
  | 'today'
  | 'yesterday'
  | 'week'
  | 'month'
  | 'year'
  | 'custom'

/** Site pharmacie / clinique : tous, CKS ou Plénitude. */
export type RapportSite = 'all' | 'CKS' | 'PLENITUDE'

export type RapportCaFilters = {
  vue: RapportVue
  periode?: RapportPeriode
  dateDebut?: string | null
  dateFin?: string | null
  site?: RapportSite
}

export type RapportCaLigne = {
  id: string
  label: string
  /** Nb factures (ou lignes pour la vue catégorie). */
  count: number
  montantPatient: number
  montantAssurance: number
  total: number
  partPct: number
}

export type RapportCaTotaux = {
  nbFactures: number
  montantPatient: number
  montantAssurance: number
  total: number
}

export type RapportCaResult = {
  vue: RapportVue
  site: RapportSite
  dateDebut: string
  dateFin: string
  periodeLabel: string
  totaux: RapportCaTotaux
  lignes: RapportCaLigne[]
}

export type RapportCaDetailFacture = {
  id: string
  numero: string
  patientLabel: string | null
  medecinNom: string | null
  assuranceNom: string | null
  dateFacture: string | null
  montantPatient: number
  montantAssurance: number
  total: number
  statut: string
}

export type RapportCaDetailLigne = {
  id: string
  designation: string
  categorieNom: string | null
  factureNumero: string
  factureId: string
  quantite: number
  montantPatient: number
  montantAssurance: number
  total: number
}

export type RapportCaDetail = {
  vue: RapportVue
  cle: string
  label: string
  factures: RapportCaDetailFacture[]
  lignes: RapportCaDetailLigne[]
}
