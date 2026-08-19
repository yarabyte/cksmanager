import { z } from "zod"

const legacyRoleToken = z.enum([
  "admin",
  "manager",
  "medecins",
  "front_office",
  "caisse",
  "pharmacie",
  "commis_pharmacie",
])

export const userUpdateSchema = z.object({
  name: z.string().min(2, "Nom requis (min. 2 caractères)"),
  email: z.string().email("Email invalide"),
  titre: z.string().nullable().optional(),
  code: z.string().max(6).nullable().optional(),
  telephone: z.string().nullable().optional(),
  specialite: z.string().nullable().optional(),
  numeroOrdre: z.string().nullable().optional(),
  /** @deprecated Préférer `roles` (multi). Conservé pour compat. */
  role: z.string().nullable().optional(),
  /** Tokens legacy (ex. caisse, pharmacie). */
  roles: z.array(legacyRoleToken).optional(),
  actif: z.boolean(),
  caissePosteId: z.string().regex(/^\d+$/).nullable().optional(),
  pharmacieId: z.string().regex(/^\d+$/).nullable().optional(),
})

export type UserUpdateValues = z.infer<typeof userUpdateSchema>
