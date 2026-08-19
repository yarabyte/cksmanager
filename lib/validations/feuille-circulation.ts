import { z } from 'zod'

const idString = z.string().regex(/^\d+$/, 'Identifiant invalide')

/**
 * Ligne saisie côté client. Les montants ne sont PAS acceptés depuis le client :
 * ils sont systématiquement recalculés côté serveur (source de vérité).
 */
export const feuilleLigneInputSchema = z.object({
  typeLigne: z.enum(['ACTE', 'PHARMA']),
  categorieId: idString,
  acteId: idString.optional().nullable(),
  produitId: idString.optional().nullable(),
  quantite: z.coerce.number().int().min(1).default(1),
  /** HNC unitaire saisi (override). Accepte "1 234,56". */
  hnc: z.union([z.string(), z.number()]).optional().nullable(),
  /** Prix de vente unitaire (pharma). */
  prixUnitaire: z.union([z.string(), z.number()]).optional().nullable(),
  /** Remise unitaire (pharma). */
  remiseUnitaire: z.union([z.string(), z.number()]).optional().nullable(),
  position: z.coerce.number().int().min(0).default(0),
})

export const feuilleCreateSchema = z.object({
  visiteId: idString,
  libelle: z.string().max(255).optional().nullable(),
  lignes: z.array(feuilleLigneInputSchema).min(1, 'Ajoutez au moins une ligne.'),
})

export const feuilleUpdateSchema = feuilleCreateSchema
  .omit({ visiteId: true })
  .extend({ id: idString })

export type FeuilleLigneInput = z.infer<typeof feuilleLigneInputSchema>
export type FeuilleCreateInput = z.infer<typeof feuilleCreateSchema>
export type FeuilleUpdateInput = z.infer<typeof feuilleUpdateSchema>
