export type WalletTransactionRow = {
  id: string
  type: 'recharge' | 'paiement' | 'annulation' | 'reservation' | string
  montant: number
  modePaiement?: 'ESPECES' | 'MOBILE_MONEY' | string | null
  description: string | null
  createdAt: string | null
  userName: string | null
}

export type PatientWalletDetail = {
  id: string
  patientId: string
  solde: number
  /** Cumul des montants crédités (entrées). */
  totalEntrees: number
  /** Cumul des montants débités (sorties), en valeur absolue. */
  totalSorties: number
  createdAt: string | null
  transactions: WalletTransactionRow[]
}
