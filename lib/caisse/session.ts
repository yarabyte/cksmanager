import type { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { round2, num } from '@/lib/caisse/helpers'

export async function getOpenSessionForUser(userId: bigint) {
  return prisma.caisseSession.findFirst({
    where: { userId, statut: 'OUVERTE' },
    include: {
      poste: { select: { id: true, nom: true } },
      user: { select: { id: true, name: true } },
    },
    orderBy: { openedAt: 'desc' },
  })
}

export async function requireOpenSession(userId: bigint) {
  const session = await getOpenSessionForUser(userId)
  if (!session) {
    throw new Error('Aucune caisse ouverte. Ouvrez votre caisse avant de continuer.')
  }
  return session
}

export async function computeSessionSoldeTheorique(
  sessionId: bigint,
  tx?: Prisma.TransactionClient,
) {
  const db = tx ?? prisma
  const session = await db.caisseSession.findUnique({
    where: { id: sessionId },
    select: { soldeOuverture: true },
  })
  if (!session) throw new Error('Session introuvable.')

  const [recharges, versements] = await Promise.all([
    db.walletTransaction.aggregate({
      where: { sessionId, type: 'recharge' },
      _sum: { montant: true },
    }),
    db.versementCaisse.aggregate({
      where: { sessionId },
      _sum: { montant: true },
    }),
  ])

  return round2(
    num(session.soldeOuverture) +
      num(recharges._sum.montant) -
      num(versements._sum.montant),
  )
}

export async function getSessionStats(sessionId: bigint) {
  const [soldeTheorique, recharges, versements, encaissements] = await Promise.all([
    computeSessionSoldeTheorique(sessionId),
    prisma.walletTransaction.aggregate({
      where: { sessionId, type: 'recharge' },
      _sum: { montant: true },
      _count: true,
    }),
    prisma.versementCaisse.aggregate({
      where: { sessionId },
      _sum: { montant: true },
      _count: true,
    }),
    prisma.encaissement.aggregate({
      where: { sessionId },
      _sum: { montant: true },
      _count: true,
    }),
  ])

  return {
    soldeTheorique,
    totalRecharges: round2(num(recharges._sum.montant)),
    nbRecharges: recharges._count,
    totalVersements: round2(num(versements._sum.montant)),
    nbVersements: versements._count,
    totalEncaissements: round2(num(encaissements._sum.montant)),
    nbEncaissements: encaissements._count,
  }
}

function padNum(n: number, len: number) {
  return String(n).padStart(len, '0')
}

export async function nextVersementNumero(tx: Prisma.TransactionClient): Promise<string> {
  const p = await tx.parametre.findFirst({ select: { id: true, numeroVersementDepart: true } })
  const seq = p?.numeroVersementDepart ?? 1
  const now = new Date()
  const numero = `VERS-${padNum(seq, 4)}/${padNum(now.getMonth() + 1, 2)}/${String(now.getFullYear()).slice(-2)}`
  if (p) {
    await tx.parametre.update({
      where: { id: p.id },
      data: { numeroVersementDepart: seq + 1 },
    })
  }
  return numero
}
