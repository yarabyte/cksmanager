'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { toSerializable } from '@/lib/json-bigint'
import { encaisserSchema } from '@/lib/validations/caisse'
import { requireUserId } from '@/lib/auth/session'
import {
  ensureWallet,
  getFeuillesInConfirmedFactureIds,
  loadFeuilleLignes,
  loadPrescriptionLignes,
  maybeMarkVisiteFacturee,
  nextRecuNumero,
  resolvePatientLabels,
  round2,
  montantPatientDuFeuille,
  sumPrescriptionMontants,
  writeJournalCaisseEntry,
} from '@/lib/caisse/helpers'
import { getOpenSessionForUser, requireOpenSession } from '@/lib/caisse/session'
import { payFromWalletInTx } from '@/app/actions/wallets'
import { notifyEncaissement } from '@/lib/whatsapp/notify'
import { notifyEventAsync } from '@/lib/notifications/create-notification'
import { formatFactureNumero } from '@/lib/formatting'
import { ensureFactureAndEnqueueBac } from '@/lib/facture/auto-from-encaissement'
import { hasHospitalisationEnCoursForVisite } from '@/lib/hospitalisation/helpers'
import type {
  CaisseEnAttenteItem,
  CaisseStats,
  EncaissementContext,
  EncaissementRecuDetail,
  JournalCaisseJour,
  JournalCaisseRow,
  JournalCaisseFilters,
} from '@/lib/types/caisse'

import {
  endOfDayDouala,
  parseDoualaIsoDate,
  shiftDoualaDays,
  startOfDayDouala,
  startOfWeekDouala,
  zonedDateTimeToUtc,
} from '@/lib/timezone'

function buildJournalDateFilter(
  periode?: string,
  dateFrom?: string,
  dateTo?: string,
): { gte?: Date; lte?: Date } | undefined {
  const now = new Date()
  if (!periode || periode === 'session' || periode === 'all') return undefined
  if (periode === 'custom' && dateFrom) {
    const from = parseDoualaIsoDate(dateFrom)
    const toDate = dateTo ? parseDoualaIsoDate(dateTo) : from
    if (from && toDate) {
      const gte = startOfDayDouala(from)
      const lte = endOfDayDouala(toDate)
      return { gte, lte: lte < gte ? endOfDayDouala(from) : lte }
    }
    return undefined
  }
  if (periode === 'today') return { gte: startOfDayDouala(now), lte: endOfDayDouala(now) }
  if (periode === 'yesterday') {
    const y = shiftDoualaDays(now, -1)
    return { gte: startOfDayDouala(y), lte: endOfDayDouala(y) }
  }
  if (periode === 'week') {
    const start = shiftDoualaDays(now, -6)
    return { gte: startOfDayDouala(start), lte: endOfDayDouala(now) }
  }
  if (periode === 'last_week') {
    const thisWeekStart = startOfWeekDouala(now)
    const lastWeekEnd = new Date(thisWeekStart.getTime() - 1)
    const lastWeekStart = shiftDoualaDays(thisWeekStart, -7)
    return { gte: startOfDayDouala(lastWeekStart), lte: endOfDayDouala(lastWeekEnd) }
  }
  if (periode === 'month') {
    const p = startOfDayDouala(now)
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Africa/Douala',
      year: 'numeric',
      month: '2-digit',
    }).formatToParts(p)
    const year = Number(parts.find((x) => x.type === 'year')?.value)
    const month = Number(parts.find((x) => x.type === 'month')?.value)
    return {
      gte: zonedDateTimeToUtc(year, month, 1, 0, 0, 0, 0),
      lte: endOfDayDouala(now),
    }
  }
  return undefined
}

export async function getCaisseStats(): Promise<CaisseStats> {
  const userId = await requireUserId()
  const now = new Date()
  const session = await getOpenSessionForUser(userId)
  const dayFilter = { gte: startOfDayDouala(now), lte: endOfDayDouala(now) }

  const [encaissementsJour, feuilles, factures, prescriptions] = await Promise.all([
    prisma.encaissement.aggregate({
      where: {
        createdAt: dayFilter,
        ...(session ? { sessionId: session.id } : {}),
      },
      _sum: { montant: true },
    }),
    listFeuillesEnAttente(),
    listFacturesEnAttente(),
    listPrescriptionsEnAttente(),
  ])

  const montantEnAttente =
    feuilles.reduce((s, f) => s + f.montantPatient, 0) +
    factures.reduce((s, f) => s + f.montantPatient, 0) +
    prescriptions.reduce((s, f) => s + f.montantPatient, 0)

  return {
    encaissementsJour: round2(Number(encaissementsJour._sum.montant ?? 0)),
    nbEnAttente: feuilles.length + factures.length + prescriptions.length,
    montantEnAttente: round2(montantEnAttente),
  }
}

async function listFeuillesEnAttente(q?: string): Promise<CaisseEnAttenteItem[]> {
  const lockedIds = await getFeuillesInConfirmedFactureIds()

  const feuilles = await prisma.feuilleCirculation.findMany({
    where: {
      statut: 'CONFIRMEE',
      statutPaiement: 'IMPAYEE',
      id: lockedIds.length ? { notIn: lockedIds } : undefined,
    },
    orderBy: [{ confirmedAt: 'desc' }, { id: 'desc' }],
    include: {
      visite: {
        select: {
          id: true,
          patientId: true,
          dateVisite: true,
          medecin: { select: { name: true, titre: true } },
        },
      },
    },
  })

  const labels = await resolvePatientLabels(feuilles.map((f) => f.visite.patientId))

  const items: CaisseEnAttenteItem[] = []
  for (const f of feuilles) {
    const { montantPatient, montantAssurance } = await montantPatientDuFeuille(f.id)
    const pl = labels.get(f.visite.patientId.toString())
    const medecinNom = f.visite.medecin
      ? `${f.visite.medecin.titre ? f.visite.medecin.titre + ' ' : ''}${f.visite.medecin.name}`
      : null
    const item: CaisseEnAttenteItem = {
      type: 'FEUILLE',
      id: f.id.toString(),
      numero: f.numero,
      patientId: f.visite.patientId.toString(),
      patientLabel: pl?.label ?? null,
      patientDob: pl?.dob ?? null,
      visiteId: f.visite.id.toString(),
      dateVisite: f.visite.dateVisite.toISOString(),
      medecinNom,
      montantPatient,
      montantAssurance,
      libelle: f.libelle,
      confirmedAt: f.confirmedAt ? f.confirmedAt.toISOString() : null,
    }
    if (q?.trim()) {
      const term = q.trim().toLowerCase()
      const hay = [
        item.numero,
        item.patientLabel,
        item.patientId,
        item.libelle,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      if (!hay.includes(term)) continue
    }
    items.push(item)
  }
  return items
}

async function listFacturesEnAttente(q?: string): Promise<CaisseEnAttenteItem[]> {
  const factures = await prisma.facture.findMany({
    where: { statut: 'CONFIRMEE' },
    orderBy: [{ confirmedAt: 'desc' }, { id: 'desc' }],
    include: {
      visite: {
        select: {
          id: true,
          patientId: true,
          dateVisite: true,
          medecin: { select: { name: true, titre: true } },
        },
      },
      _count: { select: { feuilles: true } },
    },
  })

  const labels = await resolvePatientLabels(factures.map((f) => f.patientId))

  const items: CaisseEnAttenteItem[] = []
  for (const f of factures) {
    const pl = labels.get(f.patientId.toString())
    const medecinNom = f.visite.medecin
      ? `${f.visite.medecin.titre ? f.visite.medecin.titre + ' ' : ''}${f.visite.medecin.name}`
      : null
    const item: CaisseEnAttenteItem = {
      type: 'FACTURE',
      id: f.id.toString(),
      numero: f.numero,
      patientId: f.patientId.toString(),
      patientLabel: pl?.label ?? null,
      patientDob: pl?.dob ?? null,
      visiteId: f.visite.id.toString(),
      dateVisite: f.visite.dateVisite.toISOString(),
      medecinNom,
      montantPatient: round2(Number(f.montantPatient)),
      montantAssurance: round2(Number(f.montantAssurance)),
      libelle: null,
      nbFeuilles: f._count.feuilles,
      confirmedAt: f.confirmedAt ? f.confirmedAt.toISOString() : null,
    }
    if (q?.trim()) {
      const term = q.trim().toLowerCase()
      const hay = [item.numero, item.patientLabel, item.patientId].join(' ').toLowerCase()
      if (!hay.includes(term)) continue
    }
    items.push(item)
  }
  return items
}

async function listPrescriptionsEnAttente(q?: string): Promise<CaisseEnAttenteItem[]> {
  const prescriptions = await prisma.prescription.findMany({
    where: {
      statut: 'CONFIRMEE',
      statutPaiement: 'IMPAYEE',
    },
    orderBy: [{ confirmedAt: 'desc' }, { id: 'desc' }],
    include: {
      visite: {
        select: {
          id: true,
          patientId: true,
          dateVisite: true,
        },
      },
      medecin: { select: { name: true, titre: true } },
    },
  })

  const labels = await resolvePatientLabels(prescriptions.map((p) => p.visite.patientId))

  const items: CaisseEnAttenteItem[] = []
  for (const p of prescriptions) {
    const { montantPatient, montantAssurance } = await sumPrescriptionMontants(p.id)
    const pl = labels.get(p.visite.patientId.toString())
    const medecinNom = p.medecin
      ? `${p.medecin.titre ? p.medecin.titre + ' ' : ''}${p.medecin.name}`
      : null
    const item: CaisseEnAttenteItem = {
      type: 'PRESCRIPTION',
      id: p.id.toString(),
      numero: p.numero,
      patientId: p.visite.patientId.toString(),
      patientLabel: pl?.label ?? null,
      patientDob: pl?.dob ?? null,
      visiteId: p.visite.id.toString(),
      dateVisite: p.visite.dateVisite.toISOString(),
      medecinNom,
      montantPatient,
      montantAssurance,
      libelle: p.libelle,
      sourceLabel: 'Prescription',
      confirmedAt: p.confirmedAt ? p.confirmedAt.toISOString() : null,
    }
    if (q?.trim()) {
      const term = q.trim().toLowerCase()
      const hay = [item.numero, item.patientLabel, item.patientId, item.libelle]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      if (!hay.includes(term)) continue
    }
    items.push(item)
  }
  return items
}

export async function listEncaissementsEnAttente(params?: {
  q?: string
  type?: 'FEUILLE' | 'FACTURE' | 'PRESCRIPTION' | 'ALL'
}): Promise<{ feuilles: CaisseEnAttenteItem[]; factures: CaisseEnAttenteItem[]; prescriptions: CaisseEnAttenteItem[] }> {
  const type = params?.type ?? 'ALL'
  const q = params?.q
  const [feuilles, factures, prescriptions] = await Promise.all([
    type === 'FACTURE' || type === 'PRESCRIPTION' ? Promise.resolve([]) : listFeuillesEnAttente(q),
    type === 'FEUILLE' || type === 'PRESCRIPTION' ? Promise.resolve([]) : listFacturesEnAttente(q),
    type === 'FEUILLE' || type === 'FACTURE' ? Promise.resolve([]) : listPrescriptionsEnAttente(q),
  ])
  return toSerializable({ feuilles, factures, prescriptions }) as {
    feuilles: CaisseEnAttenteItem[]
    factures: CaisseEnAttenteItem[]
    prescriptions: CaisseEnAttenteItem[]
  }
}

export async function getEncaissementContext(
  type: 'FEUILLE' | 'FACTURE' | 'PRESCRIPTION',
  id: string,
): Promise<EncaissementContext | null> {
  const lists = await listEncaissementsEnAttente({ type })
  const item =
    type === 'FEUILLE'
      ? lists.feuilles.find((f) => f.id === id)
      : type === 'FACTURE'
        ? lists.factures.find((f) => f.id === id)
        : lists.prescriptions.find((f) => f.id === id)
  if (!item) return null

  await ensureWallet(BigInt(item.patientId))
  const { getWalletSolde } = await import('@/app/actions/wallets')
  const walletSolde = await getWalletSolde(item.patientId)
  const montantDu = item.montantPatient
  const manque = Math.max(0, round2(montantDu - walletSolde))

  const ctx: EncaissementContext = {
    item,
    walletSolde,
    montantDu,
    manque,
    peutEncaisser: montantDu <= 0 || walletSolde >= montantDu,
  }

  if (type === 'FEUILLE') {
    const { lignes, totaux } = await loadFeuilleLignes(BigInt(id))
    ctx.lignes = lignes
    ctx.totaux = totaux
  } else if (type === 'PRESCRIPTION') {
    const { lignes, totaux } = await loadPrescriptionLignes(BigInt(id))
    ctx.lignes = lignes
    ctx.totaux = totaux
  } else {
    const facture = await prisma.facture.findUnique({
      where: { id: BigInt(id) },
      include: {
        feuilles: {
          include: {
            feuille: { select: { id: true, numero: true } },
          },
        },
      },
    })
    if (facture) {
      const feuillesGroupes = []
      for (const link of facture.feuilles) {
        const { lignes, totaux } = await loadFeuilleLignes(link.feuilleCirculationId)
        feuillesGroupes.push({
          feuilleId: link.feuille.id.toString(),
          numero: link.feuille.numero,
          lignes,
          totaux,
        })
      }
      ctx.feuillesGroupes = feuillesGroupes
    }
  }

  return toSerializable(ctx) as EncaissementContext
}

export async function encaisserFeuille(
  feuilleId: string,
): Promise<{ ok: true; encaissementId: string } | { ok: false; error: string }> {
  return encaisser({ type: 'FEUILLE', id: feuilleId })
}

export async function encaisserFacture(
  factureId: string,
): Promise<{ ok: true; encaissementId: string } | { ok: false; error: string }> {
  return encaisser({ type: 'FACTURE', id: factureId })
}

export async function encaisserPrescription(
  prescriptionId: string,
): Promise<{ ok: true; encaissementId: string } | { ok: false; error: string }> {
  return encaisser({ type: 'PRESCRIPTION', id: prescriptionId })
}

async function encaisser(
  data: unknown,
): Promise<{ ok: true; encaissementId: string } | { ok: false; error: string }> {
  try {
    const userId = await requireUserId()
    const session = await requireOpenSession(userId)
    const v = encaisserSchema.parse(data)

    const encaissementId = await prisma.$transaction(async (tx) => {
      if (v.type === 'FEUILLE') {
        const feuilleId = BigInt(v.id)
        const locked = await getFeuillesInConfirmedFactureIds()
        if (locked.includes(feuilleId)) {
          throw new Error('Cette feuille de circulation est incluse dans une facture groupée.')
        }

        const feuille = await tx.feuilleCirculation.findUnique({
          where: { id: feuilleId },
          include: { visite: { select: { patientId: true, id: true } } },
        })
        if (!feuille) throw new Error('Feuille de circulation introuvable.')
        if (feuille.statut !== 'CONFIRMEE') {
          throw new Error('La feuille de circulation doit être confirmée.')
        }
        if (feuille.statutPaiement === 'PAYEE') {
          throw new Error('Feuille de circulation déjà payée.')
        }

        const { montantPatient } = await montantPatientDuFeuille(feuilleId)
        // 0 FCFA est un reçu valide (part patient entièrement exonérée).
        if (montantPatient < 0) throw new Error('Montant patient invalide.')

        await ensureWallet(feuille.visite.patientId, userId)

        const wt = await payFromWalletInTx(tx, {
          patientId: feuille.visite.patientId,
          montant: montantPatient,
          description: `Paiement feuille de circulation ${feuille.numero}`,
          transactionableType: 'FeuilleCirculation',
          transactionableId: feuilleId,
          userId,
          sessionId: session.id,
        })

        const numero = await nextRecuNumero(tx)
        const enc = await tx.encaissement.create({
          data: {
            numero,
            type: 'FEUILLE',
            feuilleId,
            patientId: feuille.visite.patientId,
            montant: montantPatient,
            walletTransactionId: wt.id,
            sessionId: session.id,
            userId,
          },
        })

        await writeJournalCaisseEntry(tx, {
          sens: 'ENCAISSEMENT',
          montant: montantPatient,
          modePaiement: 'PORTEFEUILLE',
          libelle: `Encaissement reçu ${numero} — feuille de circulation ${feuille.numero}`,
          patientId: feuille.visite.patientId,
          referenceType: 'Encaissement',
          referenceId: enc.id,
          encaissementId: enc.id,
          sessionId: session.id,
          userId,
        })

        await tx.feuilleCirculation.update({
          where: { id: feuilleId },
          data: { statutPaiement: 'PAYEE', paidAt: new Date() },
        })

        await maybeMarkVisiteFacturee(tx, feuille.visite.id)
        return enc.id
      }

      if (v.type === 'PRESCRIPTION') {
        const prescriptionId = BigInt(v.id)
        const prescription = await tx.prescription.findUnique({
          where: { id: prescriptionId },
          include: { visite: { select: { patientId: true, id: true } } },
        })
        if (!prescription) throw new Error('Prescription introuvable.')
        if (prescription.statut !== 'CONFIRMEE') {
          throw new Error('La prescription doit etre confirmee.')
        }
        if (prescription.statutPaiement === 'PAYEE') {
          throw new Error('Prescription deja payee.')
        }

        const { montantPatient } = await sumPrescriptionMontants(prescriptionId)
        if (montantPatient < 0) throw new Error('Montant patient invalide.')

        await ensureWallet(prescription.visite.patientId, userId)

        const wt = await payFromWalletInTx(tx, {
          patientId: prescription.visite.patientId,
          montant: montantPatient,
          description: `Paiement prescription ${prescription.numero}`,
          transactionableType: 'Prescription',
          transactionableId: prescriptionId,
          userId,
          sessionId: session.id,
        })

        const numero = await nextRecuNumero(tx)
        const enc = await tx.encaissement.create({
          data: {
            numero,
            type: 'PRESCRIPTION',
            prescriptionId,
            patientId: prescription.visite.patientId,
            montant: montantPatient,
            walletTransactionId: wt.id,
            sessionId: session.id,
            userId,
          },
        })

        await writeJournalCaisseEntry(tx, {
          sens: 'ENCAISSEMENT',
          montant: montantPatient,
          modePaiement: 'PORTEFEUILLE',
          libelle: `Encaissement recu ${numero} - prescription ${prescription.numero}`,
          patientId: prescription.visite.patientId,
          referenceType: 'Encaissement',
          referenceId: enc.id,
          encaissementId: enc.id,
          sessionId: session.id,
          userId,
        })

        await tx.prescription.update({
          where: { id: prescriptionId },
          data: { statutPaiement: 'PAYEE', paidAt: new Date() },
        })

        return enc.id
      }

      const factureId = BigInt(v.id)
      const facture = await tx.facture.findUnique({
        where: { id: factureId },
        include: { feuilles: true, visite: { select: { id: true } } },
      })
      if (!facture) throw new Error('Facture introuvable.')
      if (facture.statut !== 'CONFIRMEE') {
        if (facture.statut === 'PAYEE') throw new Error('Facture déjà payée.')
        throw new Error('La facture doit être confirmée.')
      }

      const montantPatient = round2(Number(facture.montantPatient))
      if (montantPatient < 0) throw new Error('Montant patient invalide.')

      await ensureWallet(facture.patientId, userId)

      const wt = await payFromWalletInTx(tx, {
        patientId: facture.patientId,
        montant: montantPatient,
        description: `Paiement facture ${facture.numero}`,
        transactionableType: 'Facture',
        transactionableId: factureId,
        userId,
        sessionId: session.id,
      })

      const numero = await nextRecuNumero(tx)
      const enc = await tx.encaissement.create({
        data: {
          numero,
          type: 'FACTURE',
          factureId,
          patientId: facture.patientId,
          montant: montantPatient,
          walletTransactionId: wt.id,
          sessionId: session.id,
          userId,
        },
      })

      await writeJournalCaisseEntry(tx, {
        sens: 'ENCAISSEMENT',
        montant: montantPatient,
        modePaiement: 'PORTEFEUILLE',
        libelle: `Encaissement reçu ${numero} — facture ${facture.numero}`,
        patientId: facture.patientId,
        referenceType: 'Encaissement',
        referenceId: enc.id,
        encaissementId: enc.id,
        sessionId: session.id,
        userId,
      })

      const now = new Date()
      for (const link of facture.feuilles) {
        await tx.feuilleCirculation.update({
          where: { id: link.feuilleCirculationId },
          data: { statutPaiement: 'PAYEE', paidAt: now },
        })
      }

      await tx.facture.update({
        where: { id: factureId },
        data: { statut: 'PAYEE', paidAt: now },
      })

      await maybeMarkVisiteFacturee(tx, facture.visite.id)
      return enc.id
    })

    // Bac / facture auto : après le paiement, pour ne jamais bloquer le reçu matriciel
    // Hospitalisation en cours : reçu oui, pas de facture (regroupement à la sortie — v2)
    try {
      let skipBac = false
      if (v.type === 'FEUILLE') {
        const feuille = await prisma.feuilleCirculation.findUnique({
          where: { id: BigInt(v.id) },
          select: { visiteId: true },
        })
        if (
          feuille &&
          (await hasHospitalisationEnCoursForVisite(feuille.visiteId))
        ) {
          skipBac = true
        }
      }
      if (!skipBac) {
        await prisma.$transaction(async (tx) => {
          await ensureFactureAndEnqueueBac(tx, {
            type: v.type,
            sourceId: BigInt(v.id),
            encaissementId,
            userId,
          })
        })
      }
    } catch (err) {
      console.error('[bac-facture] enqueue après encaissement:', err)
    }

    revalidatePath('/caisse')
    revalidatePath('/facturation')
    revalidatePath('/facturation/bac')
    revalidatePath('/feuilles-circulation')
    revalidatePath('/prescriptions')
    revalidatePath('/hospitalisation')

    const encId = encaissementId.toString()
    void notifyEncaissement(encId).catch((err) => console.error('[whatsapp] encaissement:', err))

    if (v.type === 'FEUILLE') {
      const feuille = await prisma.feuilleCirculation.findUnique({
        where: { id: BigInt(v.id) },
        select: { id: true, numero: true },
      })
      if (feuille) {
        notifyEventAsync({
          type: 'FEUILLE_PAYEE',
          message: `Feuille de circulation ${feuille.numero} payée`,
          href: `/feuilles-circulation/${feuille.id}`,
          entityType: 'FeuilleCirculation',
          entityId: feuille.id,
          actorUserId: userId,
        })
      }
    } else if (v.type === 'FACTURE') {
      const facture = await prisma.facture.findUnique({
        where: { id: BigInt(v.id) },
        select: { id: true, numero: true },
      })
      if (facture) {
        notifyEventAsync({
          type: 'FACTURE_PAYEE',
          message: `Facture ${formatFactureNumero(facture.numero)} payée intégralement`,
          href: `/facturation/${facture.id}`,
          entityType: 'Facture',
          entityId: facture.id,
          actorUserId: userId,
        })
      }
    }

    return { ok: true, encaissementId: encId }
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : 'Erreur lors de l\'encaissement',
    }
  }
}

export async function getEncaissementForRecu(id: string): Promise<EncaissementRecuDetail | null> {
  const { loadEncaissementRecuDetail } = await import('@/lib/caisse/encaissement-recu')
  return loadEncaissementRecuDetail(id)
}

export async function getJournalCaisseJour(
  sessionId?: string,
  filters: JournalCaisseFilters = {},
): Promise<JournalCaisseJour> {
  const userId = await requireUserId()
  const session = sessionId
    ? await prisma.caisseSession.findUnique({
        where: { id: BigInt(sessionId) },
        include: { poste: { select: { id: true } } },
      })
    : await getOpenSessionForUser(userId)

  const periode = filters.periode ?? 'session'

  if (!session) {
    return { lignes: [], totalEncaissements: 0, totalDecaissements: 0, solde: 0, periode }
  }

  const dateFilter = buildJournalDateFilter(periode, filters.dateFrom, filters.dateTo)
  // Sur la page caisse (période session), n'afficher que la journée en cours
  const sessionTodayFilter =
    periode === 'session'
      ? {
          gte: startOfDayDouala(new Date()),
          lte: endOfDayDouala(new Date()),
        }
      : undefined
  const rows = await prisma.journalCaisse.findMany({
    where:
      periode === 'session'
        ? { sessionId: session.id, createdAt: sessionTodayFilter }
        : {
            session: { posteId: session.posteId },
            ...(dateFilter ? { createdAt: dateFilter } : {}),
          },
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    include: { user: { select: { name: true } } },
  })

  const patientIds = rows.map((r) => r.patientId).filter((id): id is bigint => id != null)
  const labels = await resolvePatientLabels(patientIds)

  let totalEncaissements = 0
  let totalDecaissements = 0

  const lignes: JournalCaisseRow[] = rows.map((r) => {
    const montant = round2(Number(r.montant))
    if (r.sens === 'ENCAISSEMENT') totalEncaissements += montant
    else totalDecaissements += montant

    const pl = r.patientId ? labels.get(r.patientId.toString()) : undefined

    return {
      id: r.id.toString(),
      sens: r.sens as JournalCaisseRow['sens'],
      montant,
      modePaiement: r.modePaiement as JournalCaisseRow['modePaiement'],
      libelle: r.libelle,
      patientId: r.patientId ? r.patientId.toString() : null,
      patientLabel: pl?.label ?? null,
      referenceType: r.referenceType,
      referenceId: r.referenceId ? r.referenceId.toString() : null,
      encaissementId: r.encaissementId ? r.encaissementId.toString() : null,
      versementId: r.versementId ? r.versementId.toString() : null,
      createdAt: r.createdAt ? r.createdAt.toISOString() : new Date().toISOString(),
      userName: r.user?.name ?? null,
    }
  })

  return toSerializable({
    lignes,
    totalEncaissements: round2(totalEncaissements),
    totalDecaissements: round2(totalDecaissements),
    solde: round2(totalEncaissements - totalDecaissements),
    periode,
  }) as JournalCaisseJour
}
