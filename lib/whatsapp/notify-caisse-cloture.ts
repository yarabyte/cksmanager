import { prisma } from '@/lib/prisma'
import { round2, num } from '@/lib/caisse/helpers'
import { getSessionStats } from '@/lib/caisse/session'
import { formatDate, formatTime } from '@/lib/formatting'
import { isValidWhatsAppPhone } from '@/lib/phone'
import {
  getWasenderApiKey,
  getWhatsAppClinicNameFallback,
  isWhatsAppNotificationsEnabled,
} from '@/lib/whatsapp/config'
import { writeWhatsAppLog } from '@/lib/whatsapp/log'
import { caisseClotureRapportMessage } from '@/lib/whatsapp/templates'
import { formatPhoneForWasender, sendTextMessage } from '@/lib/whatsapp/wasender-client'
import type { WhatsAppEventType } from '@/lib/whatsapp/types'

const EVENT_TYPE: WhatsAppEventType = 'CAISSE_CLOTURE'

async function resolveCliniqueName(): Promise<string> {
  const fromEnv = getWhatsAppClinicNameFallback()
  if (fromEnv) return fromEnv
  const p = await prisma.parametre.findFirst({ select: { nomClinique: true } })
  return p?.nomClinique?.trim() || 'la clinique'
}

function responsablePhones(parametres: {
  whatsappRapportCaisse1: string | null
  whatsappRapportCaisse2: string | null
}): string[] {
  const phones = [parametres.whatsappRapportCaisse1, parametres.whatsappRapportCaisse2]
    .filter((p): p is string => !!p && isValidWhatsAppPhone(p))
  return [...new Set(phones)]
}

export async function notifyCaisseClotureRapport(sessionId: string): Promise<void> {
  if (!isWhatsAppNotificationsEnabled()) {
    await writeWhatsAppLog({
      eventType: EVENT_TYPE,
      status: 'SKIPPED',
      phone: '',
      referenceType: 'CaisseSession',
      referenceId: BigInt(sessionId),
      errorMessage: 'Notifications WhatsApp désactivées',
    })
    return
  }

  if (!getWasenderApiKey()) {
    await writeWhatsAppLog({
      eventType: EVENT_TYPE,
      status: 'SKIPPED',
      phone: '',
      referenceType: 'CaisseSession',
      referenceId: BigInt(sessionId),
      errorMessage: 'WASENDER_API_KEY manquant',
    })
    return
  }

  const [session, parametres] = await Promise.all([
    prisma.caisseSession.findUnique({
      where: { id: BigInt(sessionId) },
      include: {
        poste: { select: { nom: true } },
        user: { select: { name: true } },
      },
    }),
    prisma.parametre.findFirst({
      select: {
        nomClinique: true,
        whatsappRapportCaisse1: true,
        whatsappRapportCaisse2: true,
      },
    }),
  ])

  if (!session || session.statut !== 'FERMEE') return

  const phones = parametres ? responsablePhones(parametres) : []
  if (phones.length === 0) {
    await writeWhatsAppLog({
      eventType: EVENT_TYPE,
      status: 'SKIPPED',
      phone: '',
      referenceType: 'CaisseSession',
      referenceId: session.id,
      errorMessage: 'Aucun numéro responsable configuré',
    })
    return
  }

  const stats = await getSessionStats(session.id)
  const clinique = (await resolveCliniqueName()) || parametres?.nomClinique || 'la clinique'

  const formatSessionMoment = (d: Date | null) =>
    d ? `${formatDate(d.toISOString())} à ${formatTime(d.toISOString())}` : '—'

  const text = caisseClotureRapportMessage({
    clinique,
    posteNom: session.poste.nom,
    caissierNom: session.user.name,
    openedAt: formatSessionMoment(session.openedAt),
    closedAt: formatSessionMoment(session.closedAt),
    soldeOuverture: round2(num(session.soldeOuverture)),
    totalRecharges: stats.totalRecharges,
    nbRecharges: stats.nbRecharges,
    totalVersements: stats.totalVersements,
    nbVersements: stats.nbVersements,
    totalEncaissements: stats.totalEncaissements,
    nbEncaissements: stats.nbEncaissements,
    soldeTheorique: round2(num(session.soldeTheoriqueCloture)),
    soldeReel: round2(num(session.soldeReelCloture)),
    ecart: round2(num(session.ecart)),
    commentaireEcart: session.commentaireEcart,
  })

  for (const phone of phones) {
    const to = formatPhoneForWasender(phone)
    const result = await sendTextMessage(to, text)
    await writeWhatsAppLog({
      eventType: EVENT_TYPE,
      status: result.success ? 'SENT' : 'FAILED',
      phone,
      referenceType: 'CaisseSession',
      referenceId: session.id,
      messagePreview: text.slice(0, 500),
      errorMessage: result.error ?? null,
      wasenderResponse: result.raw as object | undefined,
    })
  }
}
