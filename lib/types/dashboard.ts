export type DashboardKpis = {
  visitesAujourdhui: number
  visitesHier: number
  visitesActives: number
  recettesJour: number
  recettesHier: number
  montantEnAttente: number
  nbEnAttente: number
  patientsTotal: number
  feuillesAujourdhui: number
  facturesConfirmees: number
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

export type DashboardData = {
  kpis: DashboardKpis
  visites30j: DashboardChartPoint[]
  recettes7j: DashboardRevenuePoint[]
  categoriesActes: DashboardCategoryPoint[]
  recentVisites: DashboardRecentVisite[]
  recentFactures: DashboardRecentFacture[]
}
