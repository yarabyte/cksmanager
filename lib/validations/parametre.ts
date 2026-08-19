import { z } from 'zod'
import { isValidWhatsAppPhone } from '@/lib/phone'

const optionalWhatsAppPhoneSchema = z
  .string()
  .optional()
  .nullable()
  .refine((v) => !v || v.trim() === '' || isValidWhatsAppPhone(v), {
    message: 'Numéro WhatsApp invalide (ex. 6XX XX XX XX)',
  })

export const parametreUpdateSchema = z.object({
  id: z.string().regex(/^\d+$/).default('1'),
  nomClinique: z.string().max(255).optional().nullable(),
  logo: z.string().max(255).optional().nullable(),
  adresse: z.string().max(255).optional().nullable(),
  telephone: z.string().max(255).optional().nullable(),
  email: z.string().max(255).optional().nullable(),
  numeroFactureDepart: z.number().int().min(1),
  niu: z.string().max(255).optional().nullable(),
  registreCommerce: z.string().max(255).optional().nullable(),
  noteBasPage1: z.string().optional().nullable(),
  noteBasPage2: z.string().optional().nullable(),
  whatsappRapportCaisse1: optionalWhatsAppPhoneSchema,
  whatsappRapportCaisse2: optionalWhatsAppPhoneSchema,
})
