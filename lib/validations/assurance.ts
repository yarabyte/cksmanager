import { z } from 'zod'

const promoteurUserIdSchema = z
  .union([z.string().regex(/^\d+$/), z.literal(''), z.null()])
  .optional()
  .transform((v) => (v == null || v === '' ? null : v))

export const assuranceCreateSchema = z.object({
  nom: z.string().min(1).max(255),
  code: z
    .string()
    .max(20)
    .regex(/^[A-Za-z0-9]*$/, 'Code alphanumérique uniquement.')
    .optional()
    .nullable()
    .transform((v) => {
      const t = v?.trim().toUpperCase()
      return t || null
    }),
  type: z.string().max(255).optional().nullable(),
  description: z.string().optional().nullable(),
  /** Utilisateur promoteur propriétaire (null = libre). */
  promoteurUserId: promoteurUserIdSchema,
})

export const assuranceUpdateSchema = assuranceCreateSchema.extend({
  id: z.string().regex(/^\d+$/),
})

export const assuranceValeurSchema = z.object({
  assuranceId: z.string().regex(/^\d+$/),
  codeBase: z.string().min(1).max(255),
  valeurUnitaire: z.number(),
  dateDebut: z.coerce.date().optional().nullable(),
  dateFin: z.coerce.date().optional().nullable(),
})

export const assuranceValeurUpdateSchema = z.object({
  id: z.string().regex(/^\d+$/),
  codeBase: z.string().min(1).max(255),
  valeurUnitaire: z.number(),
  dateDebut: z.coerce.date().optional().nullable(),
  dateFin: z.coerce.date().optional().nullable(),
})
