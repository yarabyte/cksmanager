import type { FeuilleLigneRow, FeuilleTotaux } from '@/lib/types/feuille-circulation'

export type CaisseEnAttenteType = 'FEUILLE' | 'FACTURE' | 'PRESCRIPTION'

export type CaisseEnAttenteItem = {
  type: CaisseEnAttenteType
  id: string
  numero: string
  patientId: string
  patientLabel: string | null
  patientDob: string | null
  visiteId: string
  dateVisite: string | null
  medecinNom: string | null
  montantPatient: number
  montantAssurance: number
  libelle: string | null
  sourceLabel?: string | null
  nbFeuilles?: number
  confirmedAt: string | null
}

export type CaisseStats = {
  encaissementsJour: number
  nbEnAttente: number
  montantEnAttente: number
}

export type EncaissementContext = {
  item: CaisseEnAttenteItem
  walletSolde: number
  montantDu: number
  manque: number
  peutEncaisser: boolean
  lignes?: FeuilleLigneRow[]
  totaux?: FeuilleTotaux
  feuillesGroupes?: {
    feuilleId: string
    numero: string
    lignes: FeuilleLigneRow[]
    totaux: FeuilleTotaux
  }[]
}

export type EncaissementRecuDetail = {
  id: string
  numero: string
  type: CaisseEnAttenteType
  montant: number
  createdAt: string
  caissierNom: string | null
  patientId: string
  patientLabel: string | null
  patientDob: string | null
  visiteId: string
  dateVisite: string | null
  medecinNom: string | null
  feuilleNumero: string | null
  factureNumero: string | null
  prescriptionNumero: string | null
  montantAssurance: number
  walletSoldeApres: number
  feuilles: {
    feuilleId: string
    numero: string
    lignes: FeuilleLigneRow[]
    totaux: FeuilleTotaux
  }[]
  clinique: {
    nomClinique: string | null
    adresse: string | null
    telephone: string | null
    email: string | null
    niu: string | null
    registreCommerce: string | null
  }
}

export type RechargeModePaiement = 'ESPECES' | 'MOBILE_MONEY'

export type JournalCaisseSens = 'ENCAISSEMENT' | 'DECAISSEMENT'

export type JournalCaisseRow = {
  id: string
  sens: JournalCaisseSens
  montant: number
  modePaiement: RechargeModePaiement | 'PORTEFEUILLE' | null
  libelle: string
  patientId: string | null
  patientLabel: string | null
  referenceType: string | null
  referenceId: string | null
  encaissementId: string | null
  versementId: string | null
  createdAt: string
  userName: string | null
}

export type JournalCaisseJour = {
  lignes: JournalCaisseRow[]
  totalEncaissements: number
  totalDecaissements: number
  solde: number
  periode?: string
}

export type JournalCaisseFilters = {
  /** session | today | yesterday | week | last_week | month | all | custom */
  periode?: string
  dateFrom?: string
  dateTo?: string
}
