import type { Role } from "@/lib/types"

/** Rôle principal qui pilote la vue dashboard. */
export type DashboardProfile = Role

export type DashboardKpis = {
  visitesAujourdhui: number
  visitesHier: number
  /** EN_ATTENTE + EN_COURS du jour (Douala). */
  visitesActives: number
  recettesJour: number
  recettesHier: number
  montantEnAttente: number
  nbEnAttente: number
  patientsTotal: number
  feuillesAujourdhui: number
  /** Factures CONFIRMEE avec part patient > 0. */
  facturesConfirmees: number
  bacPending: number
  hospitalisationsEnCours: number
  /** Médecin — filtrées sur medecinId = user. */
  mesVisitesAujourdhui: number
  mesEnAttente: number
  mesEnCours: number
  mesTerminees: number
  stockAlertesCount: number
  peremptionAlertesCount: number
  sortiesJour: number
  retoursJour: number
}

export type DashboardChartPoint = {
  date: string
  visites: number
}

export type DashboardRevenuePoint = {
  day: string
  revenue: number
}

export type DashboardCategoryPoint = {
  name: string
  value: number
}

export type DashboardRecentVisite = {
  id: string
  patientId: string
  patientLabel: string | null
  medecinNom: string
  medecinTitre: string | null
  dateVisite: string
  statut: string
}

export type DashboardRecentFacture = {
  id: string
  numero: string
  patientLabel: string | null
  montantPatient: number
  montantAssurance: number
  statut: string
  createdAt: string | null
  assureurPaye: boolean
}

export type DashboardStockAlerte = {
  id: string
  produitNom: string
  magasinNom: string
  numeroLot: string
  quantite: number
  datePeremption: string
  kind: "STOCK" | "PEREMPTION"
}

export type DashboardCaisseItem = {
  type: "FEUILLE" | "FACTURE" | "PRESCRIPTION"
  id: string
  numero: string
  patientLabel: string | null
  montantPatient: number
}

export type DashboardSortieItem = {
  id: string
  numero: string
  patientLabel: string | null
  createdAt: string | null
  statut: string
}

export type DashboardData = {
  profile: DashboardProfile
  kpis: DashboardKpis
  visites30j: DashboardChartPoint[]
  recettes7j: DashboardRevenuePoint[]
  categoriesActes: DashboardCategoryPoint[]
  recentVisites: DashboardRecentVisite[]
  recentFactures: DashboardRecentFacture[]
  stockAlertes: DashboardStockAlerte[]
  caisseEnAttente: DashboardCaisseItem[]
  recentSorties: DashboardSortieItem[]
}
