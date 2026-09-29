import { z } from 'zod'

export const createBordereauSchema = z.object({
  assuranceId: z.string().regex(/^\d+$/),
  factureIds: z.array(z.string().regex(/^\d+$/)).min(1, 'Sélectionnez au moins une facture.'),
})

export const updateBordereauFacturesSchema = z.object({
  id: z.string().regex(/^\d+$/),
  factureIds: z.array(z.string().regex(/^\d+$/)).min(1, 'Sélectionnez au moins une facture.'),
})

export const deposerBordereauSchema = z.object({
  id: z.string().regex(/^\d+$/),
  factureIds: z.array(z.string().regex(/^\d+$/)).min(1, 'Sélectionnez au moins une facture.'),
  dateDepot: z.string().min(1, 'Date de dépôt obligatoire.'),
  noteDepot: z.string().max(2000).optional().nullable(),
})

export const annulerDepotBordereauFacturesSchema = z.object({
  id: z.string().regex(/^\d+$/),
  factureIds: z.array(z.string().regex(/^\d+$/)).min(1, 'Sélectionnez au moins une facture.'),
})

export const payerBordereauSchema = z.object({
  id: z.string().regex(/^\d+$/),
  factureIds: z.array(z.string().regex(/^\d+$/)).min(1, 'Sélectionnez au moins une facture.'),
  datePaiement: z.string().min(1, 'Date de paiement obligatoire.'),
  refVirement: z.string().min(1, 'Référence virement obligatoire.').max(100),
})
