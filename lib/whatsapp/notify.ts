import { prisma } from '@/lib/prisma'
import { computeWalletSolde, resolvePatientLabels } from '@/lib/caisse/helpers'
import { isValidWhatsAppPhone } from '@/lib/phone'
import { loadEncaissementRecuDetail } from '@/lib/caisse/encaissement-recu'
import { generateRecuPdfBuffer } from '@/lib/pdf/generate-recu-pdf'
import {
  getWasenderApiKey,
  getWhatsAppClinicNameFallback,
  isWhatsAppNotificationsEnabled,
} from '@/lib/whatsapp/config'
import { writeWhatsAppLog } from '@/lib/whatsapp/log'
import {
  encaissementMessage,
  retourPharmacieMessage,
  walletRechargeMessage,
} from '@/lib/whatsapp/templates'
import {
  formatPhoneForWasender,
  sendDocumentMessage,
  sendTextMessage,
  uploadPdfBuffer,
} from '@/lib/whatsapp/wasender-client'
import type { WhatsAppEventType } from '@/lib/whatsapp/types'

async function resolveCliniqueName(): Promise<string> {
  const fromEnv = getWhatsAppClinicNameFallback()
  if (fromEnv) return fromEnv
  const p = await prisma.parametre.findFirst({ select: { nomClinique: true } })
  return p?.nomClinique?.trim() || 'la clinique'
}

async function resolvePatientPhone(patientId: bigint): Promise<{
  phone: string | null
  label: string | null
}> {
  const patient = await prisma.patient.findUnique({
    where: { id: patientId },
    select: { patNum1: true },
  })
  if (!patient?.patNum1 || !isValidWhatsAppPhone(patient.patNum1)) {
    return { phone: null, label: null }
  }
  const labels = await resolvePatientLabels([patientId])
  return {
    phone: patient.patNum1,
    label: labels.get(patientId.toString())?.label ?? null,
  }
}

async function skipLog(
  eventType: WhatsAppEventType,
  reason: string,
  input: {
    patientId?: bigint
    phone?: string
    referenceType?: string
    referenceId?: bigint
  } = {},
) {
  await writeWhatsAppLog({
    eventType,
    status: 'SKIPPED',
    patientId: input.patientId ?? null,
    phone: input.phone ?? '',
    referenceType: input.referenceType ?? null,
    referenceId: input.referenceId ?? null,
    errorMessage: reason,
  })
}

async function guardEnabled(eventType: WhatsAppEventType): Promise<boolean> {
  if (!isWhatsAppNotificationsEnabled()) {
    await skipLog(eventType, 'Notifications WhatsApp désactivées (WHATSAPP_NOTIFICATIONS_ENABLED)')
    return false
  }
  if (!getWasenderApiKey()) {
    await skipLog(eventType, 'WASENDER_API_KEY manquant')
    return false
  }
  return true
}

export async function notifyWalletRecharge(input: {
  patientId: string
  walletTransactionId: string
  montant: number
  solde: number
}): Promise<void> {
  const eventType: WhatsAppEventType = 'WALLET_RECHARGE'
  if (!(await guardEnabled(eventType))) return

  const patientId = BigInt(input.patientId)
  const referenceId = BigInt(input.walletTransactionId)
  const { phone, label } = await resolvePatientPhone(patientId)

  if (!phone) {
    await skipLog(eventType, 'Numéro WhatsApp patient invalide ou absent', {
      patientId,
      referenceType: 'WalletTransaction',
      referenceId,
    })
    return
  }

  const clinique = await resolveCliniqueName()
  const text = walletRechargeMessage({
    patientLabel: label,
    patientId: input.patientId,
    clinique,
    montant: input.montant,
    solde: input.solde,
  })

  const to = formatPhoneForWasender(phone)
  const result = await sendTextMessage(to, text)

  await writeWhatsAppLog({
    eventType,
    status: result.success ? 'SENT' : 'FAILED',
    patientId,
    phone,
    referenceType: 'WalletTransaction',
    referenceId,
    messagePreview: text,
    errorMessage: result.error ?? null,
    wasenderResponse: result.raw as object | undefined,
  })
}

export async function notifyEncaissement(encaissementId: string): Promise<void> {
  const eventType: WhatsAppEventType = 'ENCAISSEMENT'
  if (!(await guardEnabled(eventType))) return

  const recu = await loadEncaissementRecuDetail(encaissementId)
  if (!recu) {
    await skipLog(eventType, 'Encaissement introuvable', {
      referenceType: 'Encaissement',
      referenceId: BigInt(encaissementId),
    })
    return
  }

  const patientId = BigInt(recu.patientId)
  const referenceId = BigInt(encaissementId)
  const { phone, label } = await resolvePatientPhone(patientId)

  if (!phone) {
    await skipLog(eventType, 'Numéro WhatsApp patient invalide ou absent', {
      patientId,
      referenceType: 'Encaissement',
      referenceId,
    })
    return
  }

  const clinique = await resolveCliniqueName()
  const text = encaissementMessage({
    patientLabel: label ?? recu.patientLabel,
    patientId: recu.patientId,
    clinique,
    montant: recu.montant,
    numero: recu.numero,
    solde: recu.walletSoldeApres,
  })

  try {
    const pdfBuffer = await generateRecuPdfBuffer(recu)
    const upload = await uploadPdfBuffer(pdfBuffer)
    if (!upload.success || !upload.publicUrl) {
      await writeWhatsAppLog({
        eventType,
        status: 'FAILED',
        patientId,
        phone,
        referenceType: 'Encaissement',
        referenceId,
        messagePreview: text,
        errorMessage: upload.error ?? 'Échec upload PDF',
      })
      return
    }

    const to = formatPhoneForWasender(phone)
    const fileName = `recu-${recu.numero.replace(/\//g, '-')}.pdf`
    const result = await sendDocumentMessage({
      to,
      text,
      documentUrl: upload.publicUrl,
      fileName,
    })

    await writeWhatsAppLog({
      eventType,
      status: result.success ? 'SENT' : 'FAILED',
      patientId,
      phone,
      referenceType: 'Encaissement',
      referenceId,
      messagePreview: text,
      errorMessage: result.error ?? null,
      wasenderResponse: result.raw as object | undefined,
    })
  } catch (e) {
    await writeWhatsAppLog({
      eventType,
      status: 'FAILED',
      patientId,
      phone,
      referenceType: 'Encaissement',
      referenceId,
      messagePreview: text,
      errorMessage: e instanceof Error ? e.message : 'Erreur génération PDF',
    })
  }
}

export async function notifyRetourPharmacie(input: {
  retourId: string
  patientId: string
  numero: string
  montantAvoir: number
}): Promise<void> {
  const eventType: WhatsAppEventType = 'RETOUR_PHARMACIE'
  if (!(await guardEnabled(eventType))) return

  if (input.montantAvoir <= 0) {
    await skipLog(eventType, 'Montant avoir nul', {
      patientId: BigInt(input.patientId),
      referenceType: 'RetourPharmacie',
      referenceId: BigInt(input.retourId),
    })
    return
  }

  const patientId = BigInt(input.patientId)
  const referenceId = BigInt(input.retourId)
  const { phone, label } = await resolvePatientPhone(patientId)

  if (!phone) {
    await skipLog(eventType, 'Numéro WhatsApp patient invalide ou absent', {
      patientId,
      referenceType: 'RetourPharmacie',
      referenceId,
    })
    return
  }

  const wallet = await prisma.wallet.findUnique({ where: { patientId } })
  const solde = wallet ? await computeWalletSolde(wallet.id) : input.montantAvoir
  const clinique = await resolveCliniqueName()

  const text = retourPharmacieMessage({
    patientLabel: label,
    patientId: input.patientId,
    clinique,
    numero: input.numero,
    montant: input.montantAvoir,
    solde,
  })

  const to = formatPhoneForWasender(phone)
  const result = await sendTextMessage(to, text)

  await writeWhatsAppLog({
    eventType,
    status: result.success ? 'SENT' : 'FAILED',
    patientId,
    phone,
    referenceType: 'RetourPharmacie',
    referenceId,
    messagePreview: text,
    errorMessage: result.error ?? null,
    wasenderResponse: result.raw as object | undefined,
  })
}
