import { z } from 'zod'

const idString = z.string().regex(/^\d+$/)

export const kitActeCreateSchema = z.object({
  nom: z.string().min(1).max(255),
  description: z.string().max(100000).optional().nullable(),
  userId: idString,
  actif: z.boolean().default(true),
})

export const kitActeUpdateSchema = kitActeCreateSchema.extend({
  id: idString,
})

export const kitActeLigneCreateSchema = z.object({
  kitActeId: idString,
  typeLigne: z.enum(['ACTE', 'PHARMA']),
  acteId: z.string().optional().nullable(),
  produitId: z.string().optional().nullable(),
  quantite: z.coerce.number().int().min(1).default(1),
  remiseUnitaire: z.string().default('0'),
  position: z.coerce.number().int().min(0).default(0),
})

export const kitActeLigneUpdateSchema = kitActeLigneCreateSchema.extend({
  id: idString,
})
