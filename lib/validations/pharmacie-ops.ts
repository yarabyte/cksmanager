import { z } from 'zod'

const idString = z.string().regex(/^\d+$/)

export const magasinSchema = z.object({
  nom: z.string().min(1).max(255),
  emplacement: z.string().max(255).optional().nullable(),
  description: z.string().optional().nullable(),
  actif: z.boolean().optional().default(true),
})

export const magasinUpdateSchema = magasinSchema.extend({ id: idString })

export const pharmacieSchema = z.object({
  nom: z.string().min(1).max(255),
  magasinId: idString,
  actif: z.boolean().optional().default(true),
})

export const pharmacieUpdateSchema = pharmacieSchema.extend({ id: idString })

/** Ligne complète (validation réception / entrée stock) */
export const approLigneSchema = z.object({
  produitId: idString,
  quantite: z.number().int().positive(),
  numeroLot: z.string().min(1).max(100),
  datePeremption: z.string().min(1),
  prixAchatUnitaire: z.number().min(0),
})

/** Ligne brouillon (champs incomplets autorisés) */
export const approLigneBrouillonSchema = z.object({
  produitId: z
    .string()
    .optional()
    .nullable()
    .transform((v) => (v && /^\d+$/.test(v) ? v : null)),
  quantite: z.number().int().min(0).optional().default(0),
  numeroLot: z
    .string()
    .max(100)
    .optional()
    .nullable()
    .transform((v) => (v?.trim() ? v.trim() : null)),
  datePeremption: z
    .string()
    .optional()
    .nullable()
    .transform((v) => (v?.trim() ? v.trim() : null)),
  prixAchatUnitaire: z.number().min(0).optional().default(0),
})

export const saveApproSchema = z.object({
  id: idString.optional(),
  magasinId: idString,
  fournisseurId: idString.optional().nullable(),
  dateReception: z.string().min(1),
  note: z.string().max(2000).optional().nullable(),
  lignes: z.array(approLigneBrouillonSchema).min(1),
})

/** @deprecated Préférer saveApprovisionnement + validerApprovisionnement */
export const createApproSchema = z.object({
  magasinId: idString,
  fournisseurId: idString.optional().nullable(),
  dateReception: z.string().min(1),
  note: z.string().max(2000).optional().nullable(),
  lignes: z.array(approLigneSchema).min(1),
})

export const transfertLigneSchema = z.object({
  stockLotId: idString,
  quantite: z.number().int().positive(),
})

export const createTransfertSchema = z.object({
  magasinSourceId: idString,
  magasinDestId: idString,
  note: z.string().max(2000).optional().nullable(),
  lignes: z.array(transfertLigneSchema).min(1),
})

export const sortieLigneInputSchema = z.object({
  produitId: idString,
  quantite: z.number().int().positive(),
  montantPatientUnitaire: z.number().min(0),
})

export const createSortieSchema = z.object({
  encaissementId: idString.optional().nullable(),
  factureId: idString.optional().nullable(),
  lignes: z.array(sortieLigneInputSchema).min(1),
})

export const retourLigneSchema = z.object({
  sortieLigneId: idString,
  quantite: z.number().int().positive(),
})

export const createRetourSchema = z.object({
  sortieId: idString,
  motif: z.string().max(2000).optional().nullable(),
  lignes: z.array(retourLigneSchema).min(1),
})
