import type { Role } from '@/lib/types'

export type NotificationType =
  | 'VISITE_CREEE'
  | 'PATIENT_CREE'
  | 'FACTURE_CONFIRMEE'
  | 'FACTURE_PAYEE'
  | 'FEUILLE_PAYEE'
  | 'BORDEREAU_DEPOSE'
  | 'BORDEREAU_PAYE'

/** Rôles destinataires par type d’événement (Admin + Manager toujours inclus). */
export const NOTIFICATION_ROLES: Record<NotificationType, Role[]> = {
  VISITE_CREEE: ['Médecin', 'Front Office', 'Admin', 'Manager'],
  PATIENT_CREE: ['Front Office', 'Admin', 'Manager'],
  FACTURE_CONFIRMEE: ['Front Office', 'Caisse', 'Admin', 'Manager'],
  FACTURE_PAYEE: ['Front Office', 'Caisse', 'Admin', 'Manager'],
  FEUILLE_PAYEE: ['Front Office', 'Caisse', 'Admin', 'Manager'],
  BORDEREAU_DEPOSE: ['Front Office', 'Caisse', 'Admin', 'Manager'],
  BORDEREAU_PAYE: ['Front Office', 'Caisse', 'Admin', 'Manager'],
}
