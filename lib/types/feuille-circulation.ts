/** Données sérialisées (BigInt/Decimal → string) pour actions / UI feuille de circulation. */

export type FeuilleStatut = 'BROUILLON' | 'CONFIRMEE'
export type FeuilleStatutPaiement = 'IMPAYEE' | 'PAYEE'

/** Ligne d'une feuille de circulation (affichage). */
export type FeuilleLigneRow = {
  id: string
  typeLigne: 'ACTE' | 'PHARMA'
  categorieId: string
  categorieNom: string | null
  acteId: string | null
  acteNom: string | null
  produitId: string | null
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
  imputeAssurance: number | null
  position: number
}

/** Totaux agrégés d'une feuille. */
export type FeuilleTotaux = {
  totalAssurance: number
  totalPatient: number
  totalHnc: number
  total: number
}

/** Ligne de la liste des feuilles. */
export type FeuilleListRow = {
  id: string
  numero: string
  libelle: string | null
  statut: FeuilleStatut
  visiteId: string
  patientId: string | null
  patientLabel: string | null
  patientDob: string | null
  dateVisite: string | null
  createdAt: string | null
  nbLignes: number
  totalAssurance: number
  totalPatient: number
  total: number
}

/** Détail complet d'une feuille (affichage / édition). */
export type FeuilleDetail = {
  id: string
  numero: string
  libelle: string | null
  statut: FeuilleStatut
  statutPaiement: FeuilleStatutPaiement
  paidAt: string | null
  createdAt: string | null
  updatedAt: string | null
  confirmedAt: string | null
  visite: {
    id: string
    dateVisite: string
    patientId: string
    patientLabel: string | null
    patientDob: string | null
    medecinNom: string | null
    medecinNumeroOrdre: string | null
  }
  /** Présent si la visite est liée à une hospitalisation. */
  hospitalisation: {
    id: string
    dateEntree: string
    dateSortie: string | null
    statut: 'EN_COURS' | 'SORTI'
  } | null
  lignes: FeuilleLigneRow[]
  totaux: FeuilleTotaux
  /** Avoir ACTIF lié, si présent. */
  avoir: {
    id: string
    numero: string
    montant: number
    motif: string
    statut: 'ACTIF' | 'ANNULE'
    createdAt: string | null
    userName: string | null
  } | null
  /** True si un avoir ANNULE existe (pas de nouvel avoir tant que unique feuilleId). */
  hasAvoirAnnule?: boolean
}

export type FeuilleStats = {
  total: number
  brouillon: number
  confirmees: number
  today: number
  totalPatientEnCours: number
}

/** Options de référentiels pour le formulaire. */
export type CategorieOption = { id: string; nom: string; isPharmacie: boolean }
export type ActeOption = {
  id: string
  nom: string
  categorieId: string
  prixHnc: number | null
  valeurFixe: number | null
  coefficient: number
  codeBase: string | null
  imputeAssurance: number | null
  assureurNom: string | null
  /** Valeur du point (code_base) sur l'assureur lié à l'acte — repli sans assurance patient. */
  valeurPointTarif: number | null
}
export type ProduitOption = {
  id: string
  nom: string
  dosage: string
  prixVenteRef: number
  hnc: number | null
}

export type KitLigneOption = {
  typeLigne: 'ACTE' | 'PHARMA'
  acteId: string | null
  produitId: string | null
  quantite: number
  remiseUnitaire: number
  position: number
}
export type KitOption = {
  id: string
  nom: string
  lignes: KitLigneOption[]
}

/** Contexte assurance d'une visite (pour le formulaire de feuille). */
export type VisiteFeuilleContext = {
  visiteId: string
  dateVisite: string
  patientId: string
  patientLabel: string | null
  patientDob: string | null
  medecinNom: string | null
  affiliation: {
    id: string
    assuranceId: string
    assuranceNom: string
    tauxCouverture: number
    dateDebut: string | null
    dateFin: string | null
    expiree: boolean
    /** Taux par catégorie (categorieId -> taux). */
    couvertures: Record<string, number>
    /** Valeurs de points par code_base (code_base -> valeur_unitaire). */
    valeurs: Record<string, number>
  } | null
  /** Pas d'assurance liée : 100 % à la charge du patient. */
  priseEnChargePatient?: boolean
  /** Assurance existante mais hors période de validité. */
  affiliationExpiree?: boolean
}

export type VisiteRecenteOption = {
  id: string
  dateVisite: string
  patientId: string
  patientLabel: string | null
  patientDob: string | null
  medecinNom: string | null
  hasAffiliation: boolean
}
