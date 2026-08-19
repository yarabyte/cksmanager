import { z } from 'zod'

const idString = z.string().regex(/^\d+$/, 'Identifiant invalide')

export const createAvoirFeuilleSchema = z.object({
  feuilleId: idString,
  motif: z
    .string()
    .trim()
    .min(3, 'Le motif est obligatoire (3 caractères minimum).')
    .max(2000, 'Motif trop long.'),
})

export const annulerAvoirFeuilleSchema = z.object({
  id: idString,
})

export type CreateAvoirFeuilleInput = z.infer<typeof createAvoirFeuilleSchema>
export type AnnulerAvoirFeuilleInput = z.infer<typeof annulerAvoirFeuilleSchema>
