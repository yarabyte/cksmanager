import { z } from 'zod'
import { isValidWhatsAppPhone, normalizeWhatsAppPhone } from '@/lib/phone'

const whatsAppPhoneSchema = z
  .string()
  .min(1, 'Téléphone requis')
  .refine(isValidWhatsAppPhone, 'Numéro WhatsApp invalide (ex. 6XX XX XX XX)')

const optionalWhatsAppPhoneSchema = z
  .string()
  .max(20)
  .optional()
  .nullable()
  .refine((v) => !v || v.trim() === '' || isValidWhatsAppPhone(v), {
    message: 'Numéro WhatsApp invalide',
  })

export const patientCreateSchema = z.object({
  civilite: z.number().int().min(1).max(3),
  patName: z.string().min(1).max(100),
  patSurname: z.string().min(1).max(100),
  nomJeuneFille: z.string().max(255).optional().nullable(),
  patEmail: z.string().email().max(40).optional().nullable().or(z.literal('')),
  patDob: z.coerce.date(),
  patLieuNaiss: z.string().min(1).max(50),
  patCni: z.string().max(20).optional().nullable(),
  patAdress: z.string().min(1).max(200),
  patNum1: whatsAppPhoneSchema,
  patNum2: optionalWhatsAppPhoneSchema,
  patProfession: z.string().max(100).optional().nullable(),
  sexe: z.number().int().min(1).max(2),
})

export const patientUpdateSchema = patientCreateSchema.extend({
  id: z.string().regex(/^\d+$/),
})

export type PatientCreateInput = z.infer<typeof patientCreateSchema>
export type PatientUpdateInput = z.infer<typeof patientUpdateSchema>
