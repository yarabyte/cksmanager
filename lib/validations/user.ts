import { z } from "zod"

const legacyRoleToken = z.enum([
  "admin",
  "manager",
  "medecins",
  "front_office",
  "caisse",
  "pharmacie",
  "commis_pharmacie",
  "sage_femme",
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
  /** Id d'un groupe personnalisé (exclusif de `roles`). */
  customGroupId: z.string().nullable().optional(),
  actif: z.boolean(),
  caissePosteId: z.string().regex(/^\d+$/).nullable().optional(),
  pharmacieId: z.string().regex(/^\d+$/).nullable().optional(),
  /** Laissé vide = mot de passe inchangé. */
  password: z.string().optional(),
  passwordConfirm: z.string().optional(),
}).superRefine((data, ctx) => {
  const password = data.password?.trim() ?? ""
  const confirm = data.passwordConfirm?.trim() ?? ""
  if (!password && !confirm) return
  if (password.length < 8) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["password"],
      message: "Le mot de passe doit contenir au moins 8 caractères.",
    })
  }
  if (password !== confirm) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["passwordConfirm"],
      message: "Les mots de passe ne correspondent pas.",
    })
  }
})

export type UserUpdateValues = z.infer<typeof userUpdateSchema>
