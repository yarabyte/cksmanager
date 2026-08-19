import { z } from 'zod'

export const createFactureSchema = z.object({
  visiteId: z.string().regex(/^\d+$/),
  feuilleIds: z
    .array(z.string().regex(/^\d+$/))
    .min(1, 'Sélectionnez au moins une feuille de circulation validée'),
})

export const confirmFactureSchema = z.object({
  id: z.string().regex(/^\d+$/),
})
