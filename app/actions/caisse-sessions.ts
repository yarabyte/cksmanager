'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { syncPgSerial } from '@/lib/db/sync-pg-serial'
import { toSerializable } from '@/lib/json-bigint'
import { requireUser, requireUserId } from '@/lib/auth/session'
import { userIsAdmin } from '@/lib/user-role'
import { hasPermissionForRoles } from '@/lib/permissions-server'
import { mapLegacyRoleStringToAppRole } from '@/lib/user-role'
import { round2, num, writeJournalCaisseEntry } from '@/lib/caisse/helpers'
import { notifyCaisseClotureRapport } from '@/lib/whatsapp/notify-caisse-cloture'
import {
  computeSessionSoldeTheorique,
  getOpenSessionForUser,
  getSessionStats,
  nextVersementNumero,
  requireOpenSession,
} from '@/lib/caisse/session'
import type {
  CaisseSessionActive,
  CaisseSessionDetail,
  CaisseSessionHistoriqueRow,
  VersementRecuDetail,
  VersementsPageData,
} from '@/lib/types/caisse-session'

const openSessionSchema = z.object({
  posteId: z.string().regex(/^\d+$/),
  soldeOuverture: z.number().min(0),
})

const closeSessionSchema = z.object({
  soldeReel: z.number().min(0),
  commentaireEcart: z.string().max(500).optional().nullable(),
})

const versementSchema = z.object({
  montant: z.number().positive(),
  libelle: z.string().min(1).max(500),
  beneficiaire: z.string().max(255).optional().nullable(),
})

export async function getActiveCaisseSession(): Promise<CaisseSessionActive | null> {
  const userId = await requireUserId()
  const session = await getOpenSessionForUser(userId)
  if (!session) return null

  const stats = await getSessionStats(session.id)

  return toSerializable({
    id: session.id.toString(),
    posteId: session.posteId.toString(),
    posteNom: session.poste.nom,
    userId: session.userId.toString(),
    userName: session.user?.name ?? '',
    soldeOuverture: round2(Number(session.soldeOuverture)),
    soldeTheorique: stats.soldeTheorique,
    stats: {
      totalRecharges: stats.totalRecharges,
      nbRecharges: stats.nbRecharges,
      totalVersements: stats.totalVersements,
      nbVersements: stats.nbVersements,
      totalEncaissements: stats.totalEncaissements,
      nbEncaissements: stats.nbEncaissements,
    },
    openedAt: session.openedAt.toISOString(),
  }) as CaisseSessionActive
}

export async function listPostesDisponiblesPourOuverture() {
  const userId = await requireUserId()
  const existing = await getOpenSessionForUser(userId)
  if (existing) {
    return { hasOpenSession: true as const, postes: [] }
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      role: true,
      caissePosteId: true,
      caissePoste: { select: { id: true, nom: true, actif: true } },
    },
  })
  if (!dbUser) {
    throw new Error('Utilisateur introuvable.')
  }

  const isCaisseRole = mapLegacyRoleStringToAppRole(dbUser.role) === 'Caisse'
  const assignedPosteNom = dbUser.caissePoste?.nom ?? null

  if (isCaisseRole && !dbUser.caissePosteId) {
    return toSerializable({
      hasOpenSession: false as const,
      postes: [],
      requiresAssignment: true as const,
    })
  }

  if (dbUser.caissePosteId && !dbUser.caissePoste?.actif) {
    return toSerializable({
      hasOpenSession: false as const,
      postes: [],
      assignedPosteInactif: true as const,
      assignedPosteNom,
    })
  }

  const postes = await prisma.caissePoste.findMany({
    where: {
      actif: true,
      ...(dbUser.caissePosteId ? { id: dbUser.caissePosteId } : {}),
    },
    orderBy: { nom: 'asc' },
    include: {
      sessions: {
        where: { statut: 'OUVERTE' },
        select: { id: true },
        take: 1,
      },
    },
  })

  const libres = postes
    .filter((p) => p.sessions.length === 0)
    .map((p) => ({
      id: p.id.toString(),
      nom: p.nom,
      description: p.description,
    }))

  return toSerializable({
    hasOpenSession: false as const,
    postes: libres,
    assignedPosteNom,
    posteOccupe:
      Boolean(dbUser.caissePosteId) && libres.length === 0 && postes.length > 0,
  })
}

export async function openCaisseSession(
  data: unknown,
): Promise<{ ok: true; sessionId: string } | { ok: false; error: string }> {
  try {
    const userId = await requireUserId()
    const v = openSessionSchema.parse(data)
    const posteId = BigInt(v.posteId)

    const dbUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, caissePosteId: true },
    })
    if (!dbUser) {
      return { ok: false, error: 'Utilisateur introuvable.' }
    }

    const isCaisseRole = mapLegacyRoleStringToAppRole(dbUser.role) === 'Caisse'
    if (isCaisseRole && !dbUser.caissePosteId) {
      return { ok: false, error: 'Aucun poste de caisse ne vous est affecté.' }
    }
    if (dbUser.caissePosteId && dbUser.caissePosteId !== posteId) {
      return { ok: false, error: 'Vous ne pouvez ouvrir que votre poste affecté.' }
    }

    const existingUserSession = await getOpenSessionForUser(userId)
    if (existingUserSession) {
      return { ok: false, error: 'Vous avez déjà une caisse ouverte.' }
    }

    const poste = await prisma.caissePoste.findUnique({ where: { id: posteId } })
    if (!poste || !poste.actif) {
      return { ok: false, error: 'Poste de caisse introuvable ou inactif.' }
    }

    const posteBusy = await prisma.caisseSession.findFirst({
      where: { posteId, statut: 'OUVERTE' },
    })
    if (posteBusy) {
      return { ok: false, error: 'Ce poste est déjà utilisé par un autre caissier.' }
    }

    await syncPgSerial('caisse_sessions')
    const session = await prisma.caisseSession.create({
      data: {
        posteId,
        userId,
        statut: 'OUVERTE',
        soldeOuverture: round2(v.soldeOuverture),
      },
    })

    revalidatePath('/caisse')
    revalidatePath('/caisse/ouverture')
    revalidatePath('/cloture')

    return { ok: true, sessionId: session.id.toString() }
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : 'Erreur lors de l\'ouverture.',
    }
  }
}

export async function closeCaisseSession(
  data: unknown,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const userId = await requireUserId()
    const v = closeSessionSchema.parse(data)
    const session = await requireOpenSession(userId)

    const soldeTheorique = await computeSessionSoldeTheorique(session.id)
    const soldeReel = round2(v.soldeReel)
    const ecart = round2(soldeReel - soldeTheorique)

    if (ecart !== 0 && !v.commentaireEcart?.trim()) {
      return {
        ok: false,
        error: 'Un commentaire est obligatoire en cas d\'écart de caisse.',
      }
    }

    const sessionId = session.id

    await prisma.caisseSession.update({
      where: { id: sessionId },
      data: {
        statut: 'FERMEE',
        soldeTheoriqueCloture: soldeTheorique,
        soldeReelCloture: soldeReel,
        ecart,
        commentaireEcart: v.commentaireEcart?.trim() || null,
        closedAt: new Date(),
      },
    })

    revalidatePath('/caisse')
    revalidatePath('/cloture')
    revalidatePath('/cloture/historique')

    void notifyCaisseClotureRapport(sessionId.toString()).catch((err) =>
      console.error('[whatsapp] cloture caisse:', err),
    )

    return { ok: true }
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : 'Erreur lors de la clôture.',
    }
  }
}

export async function creerVersement(
  data: unknown,
): Promise<{ ok: true; versementId: string } | { ok: false; error: string }> {
  try {
    const user = await requireUser()
    if (!userIsAdmin(user.roles)) {
      return { ok: false, error: 'Seuls les administrateurs peuvent enregistrer un versement.' }
    }
    const userId = user.id
    const v = versementSchema.parse(data)
    const session = await requireOpenSession(userId)
    const montant = round2(v.montant)

    const soldeTheorique = await computeSessionSoldeTheorique(session.id)
    if (montant > soldeTheorique) {
      return {
        ok: false,
        error: `Solde insuffisant (${soldeTheorique.toLocaleString('fr-FR')} FCFA).`,
      }
    }

    const versementId = await prisma.$transaction(async (tx) => {
      const numero = await nextVersementNumero(tx)
      const versement = await tx.versementCaisse.create({
        data: {
          sessionId: session.id,
          numero,
          montant,
          libelle: v.libelle.trim(),
          beneficiaire: v.beneficiaire?.trim() || null,
          userId,
        },
      })

      await writeJournalCaisseEntry(tx, {
        sens: 'DECAISSEMENT',
        montant,
        modePaiement: 'ESPECES',
        libelle: `Versement ${numero} — ${v.libelle.trim()}`,
        sessionId: session.id,
        referenceType: 'VersementCaisse',
        referenceId: versement.id,
        versementId: versement.id,
        userId,
      })

      return versement.id
    })

    revalidatePath('/caisse')
    revalidatePath('/caisse/versements')
    revalidatePath('/cloture')

    return { ok: true, versementId: versementId.toString() }
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : 'Erreur lors du versement.',
    }
  }
}

export async function getVersementsPageData(): Promise<VersementsPageData | null> {
  const user = await requireUser()
  if (!userIsAdmin(user.roles)) return null
  const userId = user.id
  const session = await getOpenSessionForUser(userId)
  if (!session) return null

  const [versements, soldeTheorique, stats] = await Promise.all([
    prisma.versementCaisse.findMany({
      where: { sessionId: session.id },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    }),
    computeSessionSoldeTheorique(session.id),
    getSessionStats(session.id),
  ])

  return toSerializable({
    sessionId: session.id.toString(),
    posteNom: session.poste.nom,
    soldeTheorique,
    totalVersements: stats.totalVersements,
    versements: versements.map((v) => ({
      id: v.id.toString(),
      numero: v.numero,
      montant: round2(Number(v.montant)),
      libelle: v.libelle,
      beneficiaire: v.beneficiaire,
      createdAt: v.createdAt ? v.createdAt.toISOString() : new Date().toISOString(),
    })),
  }) as VersementsPageData
}

export async function getClotureContext() {
  const userId = await requireUserId()
  const session = await getOpenSessionForUser(userId)
  if (!session) return null

  const stats = await getSessionStats(session.id)

  return toSerializable({
    session: {
      id: session.id.toString(),
      posteNom: session.poste.nom,
      soldeOuverture: round2(Number(session.soldeOuverture)),
      openedAt: session.openedAt.toISOString(),
    },
    stats,
  })
}

export async function listCaisseSessionsHistorique(): Promise<CaisseSessionHistoriqueRow[]> {
  const user = await requireUser()
  const isAdminOrManager =
    user.roles.includes('Admin') || user.roles.includes('Manager')
  if (
    !(await hasPermissionForRoles(user.roles, 'caisse', 'view')) &&
    !isAdminOrManager
  ) {
    throw new Error('Accès refusé.')
  }

  const onlyOwnSessions =
    user.roles.includes('Caisse') && !isAdminOrManager
  const sessions = await prisma.caisseSession.findMany({
    where: onlyOwnSessions ? { userId: user.id } : undefined,
    orderBy: [{ openedAt: 'desc' }],
    take: 100,
    include: {
      poste: { select: { nom: true } },
      user: { select: { name: true } },
    },
  })

  const rows: CaisseSessionHistoriqueRow[] = []
  for (const s of sessions) {
    const stats = await getSessionStats(s.id)
    rows.push({
      id: s.id.toString(),
      posteNom: s.poste.nom,
      caissierNom: s.user.name,
      statut: s.statut as 'OUVERTE' | 'FERMEE',
      soldeOuverture: round2(Number(s.soldeOuverture)),
      soldeTheoriqueCloture:
        s.soldeTheoriqueCloture != null ? round2(Number(s.soldeTheoriqueCloture)) : null,
      soldeReelCloture: s.soldeReelCloture != null ? round2(Number(s.soldeReelCloture)) : null,
      ecart: s.ecart != null ? round2(Number(s.ecart)) : null,
      commentaireEcart: s.commentaireEcart,
      openedAt: s.openedAt.toISOString(),
      closedAt: s.closedAt ? s.closedAt.toISOString() : null,
      totalRecharges: stats.totalRecharges,
      totalVersements: stats.totalVersements,
      totalEncaissements: stats.totalEncaissements,
    })
  }

  return toSerializable(rows) as CaisseSessionHistoriqueRow[]
}

export async function getCaisseSessionDetail(id: string): Promise<CaisseSessionDetail | null> {
  const user = await requireUser()
  const session = await prisma.caisseSession.findUnique({
    where: { id: BigInt(id) },
    include: {
      poste: { select: { nom: true } },
      user: { select: { name: true, id: true } },
      versements: { orderBy: { createdAt: 'desc' } },
      encaissements: { orderBy: { createdAt: 'desc' } },
    },
  })
  if (!session) return null
  const onlyOwn =
    user.roles.includes('Caisse') &&
    !user.roles.includes('Admin') &&
    !user.roles.includes('Manager')
  if (onlyOwn && session.userId !== user.id) return null

  const stats = await getSessionStats(session.id)

  return toSerializable({
    id: session.id.toString(),
    posteNom: session.poste.nom,
    caissierNom: session.user.name,
    statut: session.statut as 'OUVERTE' | 'FERMEE',
    soldeOuverture: round2(Number(session.soldeOuverture)),
    soldeTheoriqueCloture:
      session.soldeTheoriqueCloture != null
        ? round2(Number(session.soldeTheoriqueCloture))
        : null,
    soldeReelCloture:
      session.soldeReelCloture != null ? round2(Number(session.soldeReelCloture)) : null,
    ecart: session.ecart != null ? round2(Number(session.ecart)) : null,
    commentaireEcart: session.commentaireEcart,
    openedAt: session.openedAt.toISOString(),
    closedAt: session.closedAt ? session.closedAt.toISOString() : null,
    totalRecharges: stats.totalRecharges,
    totalVersements: stats.totalVersements,
    totalEncaissements: stats.totalEncaissements,
    versements: session.versements.map((v) => ({
      id: v.id.toString(),
      numero: v.numero,
      montant: round2(Number(v.montant)),
      libelle: v.libelle,
      beneficiaire: v.beneficiaire,
      createdAt: v.createdAt ? v.createdAt.toISOString() : new Date().toISOString(),
    })),
    encaissements: session.encaissements.map((e) => ({
      id: e.id.toString(),
      numero: e.numero,
      montant: round2(Number(e.montant)),
      type: e.type,
      createdAt: e.createdAt ? e.createdAt.toISOString() : new Date().toISOString(),
    })),
  }) as CaisseSessionDetail
}

export async function getVersementForRecu(id: string): Promise<VersementRecuDetail | null> {
  const versement = await prisma.versementCaisse.findUnique({
    where: { id: BigInt(id) },
    include: {
      user: { select: { name: true } },
      session: { include: { poste: { select: { nom: true } } } },
    },
  })
  if (!versement) return null

  const soldeApres = await computeSessionSoldeTheorique(versement.sessionId)
  const parametres = await prisma.parametre.findFirst()

  return toSerializable({
    id: versement.id.toString(),
    numero: versement.numero,
    montant: round2(Number(versement.montant)),
    libelle: versement.libelle,
    beneficiaire: versement.beneficiaire,
    createdAt: versement.createdAt
      ? versement.createdAt.toISOString()
      : new Date().toISOString(),
    caissierNom: versement.user?.name ?? null,
    posteNom: versement.session.poste.nom,
    soldeApres,
    clinique: {
      nomClinique: parametres?.nomClinique ?? null,
      adresse: parametres?.adresse ?? null,
      telephone: parametres?.telephone ?? null,
      email: parametres?.email ?? null,
      niu: parametres?.niu ?? null,
      registreCommerce: parametres?.registreCommerce ?? null,
    },
  }) as VersementRecuDetail
}
