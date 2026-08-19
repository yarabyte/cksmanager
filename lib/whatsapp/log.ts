import { prisma } from '@/lib/prisma'
import type { Prisma } from '@prisma/client'
import type { WhatsAppEventType, WhatsAppLogStatus } from '@/lib/whatsapp/types'

export async function writeWhatsAppLog(input: {
  eventType: WhatsAppEventType
  status: WhatsAppLogStatus
  patientId?: bigint | null
  phone: string
  referenceType?: string | null
  referenceId?: bigint | null
  messagePreview?: string | null
  errorMessage?: string | null
  wasenderResponse?: Prisma.InputJsonValue
}) {
  await prisma.whatsAppNotificationLog.create({
    data: {
      eventType: input.eventType,
      status: input.status,
      patientId: input.patientId ?? null,
      phone: input.phone.slice(0, 20),
      referenceType: input.referenceType ?? null,
      referenceId: input.referenceId ?? null,
      messagePreview: input.messagePreview?.slice(0, 500) ?? null,
      errorMessage: input.errorMessage ?? null,
      wasenderResponse: input.wasenderResponse ?? undefined,
    },
  })
}
