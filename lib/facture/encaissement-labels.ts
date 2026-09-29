/** Libellés d'encaissement — safe côté client (pas de Prisma). */
export function encaissementTypeLabel(type: string) {
  if (type === 'FEUILLE') return 'Feuille de circulation'
  if (type === 'FACTURE') return 'Facture'
  if (type === 'PRESCRIPTION') return 'Prescription'
  return type
}
