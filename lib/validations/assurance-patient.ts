import { z } from 'zod'

export const assurancePatientCreateSchema = z.object({
  patientId: z.string().regex(/^\d+$/),
  assuranceId: z.string().regex(/^\d+$/),
  dateDebut: z.coerce.date().optional().nullable(),
  dateFin: z.coerce.date().optional().nullable(),
  numeroAttestation: z.string().max(255).optional().nullable(),
  tauxCouverture: z.number().int().min(0).max(100),
})

export const assurancePatientUpdateSchema = assurancePatientCreateSchema.extend({
  id: z.string().regex(/^\d+$/),
})

export const assurancePatientCouvertureSchema = z.object({
  assurancePatientId: z.string().regex(/^\d+$/),
  categorieId: z.string().regex(/^\d+$/),
  tauxCouverture: z.number(),
})

export const assurancePatientCouvertureUpdateSchema =
  assurancePatientCouvertureSchema.extend({
    id: z.string().regex(/^\d+$/),
  })
