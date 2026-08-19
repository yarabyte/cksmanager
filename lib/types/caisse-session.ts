export type CaissePosteRow = {
  id: string
  nom: string
  description: string | null
  actif: boolean
  sessionOuverte: { id: string; caissierNom: string } | null
}

export type CaisseSessionActiveStats = {
  totalRecharges: number
  nbRecharges: number
  totalVersements: number
  nbVersements: number
  totalEncaissements: number
  nbEncaissements: number
}

export type CaisseSessionActive = {
  id: string
  posteId: string
  posteNom: string
  userId: string
  userName: string
  soldeOuverture: number
  soldeTheorique: number
  stats: CaisseSessionActiveStats
  openedAt: string
}

export type CaisseSessionHistoriqueRow = {
  id: string
  posteNom: string
  caissierNom: string
  statut: 'OUVERTE' | 'FERMEE'
  soldeOuverture: number
  soldeTheoriqueCloture: number | null
  soldeReelCloture: number | null
  ecart: number | null
  commentaireEcart: string | null
  openedAt: string
  closedAt: string | null
  totalRecharges: number
  totalVersements: number
  totalEncaissements: number
}

export type CaisseSessionDetail = CaisseSessionHistoriqueRow & {
  versements: {
    id: string
    numero: string
    montant: number
    libelle: string
    beneficiaire: string | null
    createdAt: string
  }[]
  encaissements: {
    id: string
    numero: string
    montant: number
    type: string
    createdAt: string
  }[]
}

export type VersementListRow = {
  id: string
  numero: string
  montant: number
  libelle: string
  beneficiaire: string | null
  createdAt: string
}

export type VersementsPageData = {
  sessionId: string
  posteNom: string
  soldeTheorique: number
  totalVersements: number
  versements: VersementListRow[]
}

export type VersementRecuDetail = {
  id: string
  numero: string
  montant: number
  libelle: string
  beneficiaire: string | null
  createdAt: string
  caissierNom: string | null
  posteNom: string | null
  soldeApres: number
  clinique: {
    nomClinique: string | null
    adresse: string | null
    telephone: string | null
    email: string | null
    niu: string | null
    registreCommerce: string | null
  }
}
