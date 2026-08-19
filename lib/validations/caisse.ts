import { z } from 'zod'

export const rechargeWalletSchema = z.object({
  patientId: z.string().regex(/^\d+$/),
  montant: z.number().positive('Le montant doit être supérieur à 0'),
  modePaiement: z.enum(['ESPECES', 'MOBILE_MONEY']),
  description: z.string().max(500).optional().nullable(),
})

export const encaisserSchema = z.object({
  type: z.enum(['FEUILLE', 'FACTURE', 'PRESCRIPTION']),
  id: z.string().regex(/^\d+$/),
})
