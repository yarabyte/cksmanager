import { z } from 'zod'

export const categorieActeSchema = z.object({
  nom: z.string().min(1).max(255),
})

export const categorieActeUpdateSchema = categorieActeSchema.extend({
  id: z.string().regex(/^\d+$/),
})

export const acteCreateSchema = z.object({
  /** Libellé multiligne autorisé (retours à la ligne conservés en base). */
  nom: z.string().min(1).max(4000),
  categorieId: z.string().regex(/^\d+$/),
  assureurId: z.string().regex(/^\d+$/).optional().nullable(),
  codeBase: z.string().max(255).optional().nullable(),
  coefficient: z.number().default(1),
  valeurFixe: z.number().optional().nullable(),
  prixHnc: z.string().optional().nullable(),
  imputeAssurance: z.number().int().min(0).max(255).optional().nullable(),
  typeActe: z.string().max(255).optional().nullable(),
})

export const acteUpdateSchema = acteCreateSchema.extend({
  id: z.string().regex(/^\d+$/),
})
