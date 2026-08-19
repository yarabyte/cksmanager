import { z } from 'zod'

const idString = z.string().regex(/^\d+$/)

export const produitSitePharmaValues = ['CKS', 'PLENITUDE'] as const
export type ProduitSitePharma = (typeof produitSitePharmaValues)[number]

export const produitSitePharmaSchema = z.enum(produitSitePharmaValues)

export const produitSitePharmaLabels: Record<ProduitSitePharma, string> = {
  CKS: 'CKS',
  PLENITUDE: 'Plénitude',
}

export const produitSitePharmaBadgeClass: Record<ProduitSitePharma, string> = {
  CKS: 'bg-[#58a639]/10 text-[#58a639]',
  PLENITUDE: 'bg-[#cd3b86]/10 text-[#cd3b86]',
}

export const conditionnementCreateSchema = z.object({
  libelle: z.string().min(1).max(255),
  isCommon: z.boolean().default(true),
  rank: z.coerce.number().int().min(0).max(32767).default(100),
  actif: z.boolean().default(true),
})

export const conditionnementUpdateSchema = conditionnementCreateSchema.extend({
  id: idString,
})

export const formeGaleniqueCreateSchema = z.object({
  libelle: z.string().min(1).max(255),
  isCommon: z.boolean().default(true),
  rank: z.coerce.number().int().min(0).max(32767).default(100),
  actif: z.boolean().default(true),
})

export const formeGaleniqueUpdateSchema = formeGaleniqueCreateSchema.extend({
  id: idString,
})

export const fournisseurCreateSchema = z.object({
  raisonSociale: z.string().min(1).max(255),
  adresse: z.string().max(255).optional().nullable(),
  telephone1: z.string().max(255).optional().nullable(),
  telephone2: z.string().max(255).optional().nullable(),
  email: z.string().max(255).optional().nullable(),
  actif: z.boolean().default(true),
})

export const fournisseurUpdateSchema = fournisseurCreateSchema.extend({
  id: idString,
})

/** Produit — tarifs et quantités (données sensibles côté métier). */
export const produitCreateSchema = z.object({
  nom: z.string().min(1).max(255),
  principeActif: z.string().max(255).optional().nullable(),
  codeCip: z.string().max(255).optional().nullable(),
  formeGaleniqueId: idString,
  dosage: z.string().min(1).max(255),
  conditionnementId: idString,
  qteParConditionnement: z.coerce.number().int().min(0),
  prixAchatRef: z.string().min(1),
  prixVenteRef: z.string().min(1),
  hnc: z.string().optional().nullable(),
  qteAlerte: z.coerce.number().int().min(0).default(0),
  assureurId: z
    .string()
    .optional()
    .transform((s) => {
      const t = s?.trim()
      if (!t || !/^\d+$/.test(t)) return null
      return t
    }),
  sitePharma: produitSitePharmaSchema.default('CKS'),
  actif: z.boolean().default(true),
})

export const produitUpdateSchema = produitCreateSchema.extend({
  id: idString,
})
