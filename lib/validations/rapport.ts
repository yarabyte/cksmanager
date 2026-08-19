import { z } from 'zod'

export const rapportVueSchema = z.enum([
  'patient',
  'medecin',
  'assureur',
  'categorie',
  'jour',
])

export const rapportPeriodeSchema = z.enum([
  'today',
  'yesterday',
  'week',
  'month',
  'year',
  'custom',
])

export const rapportSiteSchema = z.enum(['all', 'CKS', 'PLENITUDE'])

export const rapportCaFiltersSchema = z.object({
  vue: rapportVueSchema,
  periode: rapportPeriodeSchema.optional().default('month'),
  dateDebut: z.string().optional().nullable(),
  dateFin: z.string().optional().nullable(),
  site: rapportSiteSchema.optional().default('all'),
})

export const rapportCaDetailSchema = rapportCaFiltersSchema.extend({
  cle: z.string().min(1),
})
