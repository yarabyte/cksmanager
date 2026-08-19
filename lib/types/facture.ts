import type { FeuilleLigneRow, FeuilleTotaux } from '@/lib/types/feuille-circulation'
import type { FactureSuiviAssureur } from '@/lib/types/bordereau'

export type FactureStatut = 'BROUILLON' | 'CONFIRMEE' | 'PAYEE'

export type FactureListRow = {
  id: string
  numero: string
  visiteId: string
  patientId: string
  patientLabel: string | null
  statut: FactureStatut
  montantPatient: number
  montantAssurance: number
  nbFeuilles: number
  confirmedAt: string | null
  paidAt: string | null
  createdAt: string | null
  suiviAssureur: FactureSuiviAssureur | null
}

export type FactureFeuilleResume = {
  feuilleId: string
  numero: string
  libelle: string | null
  montantPatient: number
  montantAssurance: number
  lignes: FeuilleLigneRow[]
  totaux: FeuilleTotaux
}

export type FacturePaiementHistoriqueRow = {
  id: string
  numero: string
  type: 'FEUILLE' | 'FACTURE'
  montant: number
  createdAt: string
  caissierNom: string | null
  feuilleId: string | null
  feuilleNumero: string | null
}

export type FactureDetail = {
  id: string
  numero: string
  visiteId: string
  patientId: string
  patientLabel: string | null
  patientDob: string | null
  dateVisite: string | null
  medecinNom: string | null
  statut: FactureStatut
  montantPatient: number
  montantAssurance: number
  confirmedAt: string | null
  paidAt: string | null
  createdAt: string | null
  feuilles: FactureFeuilleResume[]
  suiviAssureur: FactureSuiviAssureur | null
  historiquePaiements: FacturePaiementHistoriqueRow[]
  totalEncaisse: number
}

export type FactureAssuranceInfo = {
  assuranceNom: string | null
  numeroAttestation: string | null
  tauxCouverture: number | null
}

export type FacturePrintData = FactureDetail & {
  medecinNumeroOrdre: string | null
  assurance: FactureAssuranceInfo
}

export type FeuilleEligibleFacture = {
  id: string
  numero: string
  libelle: string | null
  montantPatient: number
  montantAssurance: number
  statutPaiement: 'IMPAYEE' | 'PAYEE'
  confirmedAt: string | null
}

export type VisiteFeuillesEligibles = {
  visiteId: string
  dateVisite: string
  patientId: string
  patientLabel: string | null
  medecinNom: string | null
  feuilles: FeuilleEligibleFacture[]
}
