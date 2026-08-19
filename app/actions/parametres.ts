'use server'

import { prisma } from '@/lib/prisma'
import { toSerializable } from '@/lib/json-bigint'
import { normalizeWhatsAppPhone } from '@/lib/phone'
import { parametreUpdateSchema } from '@/lib/validations/parametre'

function normalizeOptionalWhatsApp(value: string | null | undefined): string | null {
  if (!value?.trim()) return null
  return normalizeWhatsAppPhone(value.trim())
}

export async function getParametres() {
  const row = await prisma.parametre.findFirst({ orderBy: { id: 'asc' } })
  return row ? toSerializable(row) : null
}

export async function updateParametres(data: unknown) {
  const v = parametreUpdateSchema.parse(data)
  const id = BigInt(v.id)
  const row = await prisma.parametre.update({
    where: { id },
    data: {
      nomClinique: v.nomClinique ?? null,
      logo: v.logo ?? null,
      adresse: v.adresse ?? null,
      telephone: v.telephone ?? null,
      email: v.email ?? null,
      numeroFactureDepart: v.numeroFactureDepart,
      niu: v.niu ?? null,
      registreCommerce: v.registreCommerce ?? null,
      noteBasPage1: v.noteBasPage1 ?? null,
      noteBasPage2: v.noteBasPage2 ?? null,
      whatsappRapportCaisse1: normalizeOptionalWhatsApp(v.whatsappRapportCaisse1),
      whatsappRapportCaisse2: normalizeOptionalWhatsApp(v.whatsappRapportCaisse2),
    },
  })
  return toSerializable(row)
}
