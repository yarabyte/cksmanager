import { z } from 'zod'

/** Site de répartition des actes dans les états. */
export const acteTypeValues = ['CKS', 'PLENITUDE'] as const
export type ActeType = (typeof acteTypeValues)[number]

export const acteTypeLabels: Record<ActeType, string> = {
  CKS: 'CKS',
  PLENITUDE: 'Plénitude',
}

/** Aligne les valeurs déjà en base (cks, plénitude, vide) sur CKS | PLENITUDE. */
export function normalizeActeType(value: string | null | undefined): ActeType {
  const v = (value ?? '').trim().toUpperCase()
  if (v === 'PLENITUDE' || v === 'PLÉNITUDE') return 'PLENITUDE'
  return 'CKS'
}

const acteTypeSchema = z.preprocess(
  (value) => normalizeActeType(typeof value === 'string' ? value : null),
  z.enum(acteTypeValues),
)

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
  typeActe: acteTypeSchema,
  exonerePartPatient: z.boolean().optional().default(false),
})

export const acteUpdateSchema = acteCreateSchema.extend({
  id: z.string().regex(/^\d+$/),
})
