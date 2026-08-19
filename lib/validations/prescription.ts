import { z } from "zod"

const idString = z.string().regex(/^\d+$/, "Identifiant invalide")

export const prescriptionLigneInputSchema = z.object({
  produitId: idString,
  quantite: z.coerce.number().int().min(1).default(1),
  hnc: z.union([z.string(), z.number()]).optional().nullable(),
  prixUnitaire: z.union([z.string(), z.number()]).optional().nullable(),
  remiseUnitaire: z.union([z.string(), z.number()]).optional().nullable(),
  position: z.coerce.number().int().min(0).default(0),
})

export const prescriptionCreateSchema = z.object({
  visiteId: idString,
  libelle: z.string().max(255).optional().nullable(),
  lignes: z.array(prescriptionLigneInputSchema).min(1, "Ajoutez au moins un produit."),
})

export const prescriptionUpdateSchema = prescriptionCreateSchema
  .omit({ visiteId: true })
  .extend({ id: idString })

export type PrescriptionLigneInput = z.infer<typeof prescriptionLigneInputSchema>
export type PrescriptionCreateInput = z.infer<typeof prescriptionCreateSchema>
export type PrescriptionUpdateInput = z.infer<typeof prescriptionUpdateSchema>
