import { z } from 'zod'
import {
  BANDELETTE_NITRITE_VALUES,
  BANDELETTE_PH_VALUES,
  BANDELETTE_QUALI_VALUES,
  BANDELETTE_SUCRE_VALUES,
} from '@/lib/medical/bandelette'

const idString = z.string().regex(/^\d+$/)

/** Schéma objet (permet `.omit` / `.extend`). */
export const parametrePatientBaseSchema = z.object({
  visiteId: idString,
  poidsKg: z.coerce.number().positive('Poids requis'),
  tailleCm: z.coerce.number().positive('Taille requise'),
  pas: z.coerce.number().int().positive('PAS requis'),
  pad: z.coerce.number().int().positive('PAD requis'),
  pouls: z.coerce.number().int().positive('Pouls requis'),
  temperatureC: z.coerce.number().positive('Température requise'),
  nitrite: z.enum(BANDELETTE_NITRITE_VALUES),
  sang: z.enum(BANDELETTE_QUALI_VALUES),
  leucocytes: z.enum(BANDELETTE_QUALI_VALUES),
  proteine: z.enum(BANDELETTE_QUALI_VALUES),
  cetones: z.enum(BANDELETTE_QUALI_VALUES),
  ph: z.enum(BANDELETTE_PH_VALUES),
  sucre: z.enum(BANDELETTE_SUCRE_VALUES).optional().nullable(),
  perimetreCranien: z.coerce.number().positive().optional().nullable(),
  perimetreBrachial: z.coerce.number().positive().optional().nullable(),
  frequenceRespiratoire: z.coerce.number().int().positive().optional().nullable(),
  sao2: z.coerce.number().int().min(0).max(100).optional().nullable(),
  /** Si true, les champs pédiatriques sont obligatoires. */
  requirePediatrique: z.boolean().default(false),
})

export const parametrePatientUpsertSchema = parametrePatientBaseSchema.superRefine(
  (data, ctx) => {
    if (!data.requirePediatrique) return
    if (data.perimetreCranien == null) {
      ctx.addIssue({
        code: 'custom',
        path: ['perimetreCranien'],
        message: 'Périmètre crânien requis',
      })
    }
    if (data.perimetreBrachial == null) {
      ctx.addIssue({
        code: 'custom',
        path: ['perimetreBrachial'],
        message: 'Périmètre brachial requis',
      })
    }
    if (data.frequenceRespiratoire == null) {
      ctx.addIssue({
        code: 'custom',
        path: ['frequenceRespiratoire'],
        message: 'Fréquence respiratoire requise',
      })
    }
    if (data.sao2 == null) {
      ctx.addIssue({ code: 'custom', path: ['sao2'], message: 'SaO2 requise' })
    }
  },
)

export type ParametrePatientUpsertInput = z.infer<typeof parametrePatientUpsertSchema>
