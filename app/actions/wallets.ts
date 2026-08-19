'use server'

import type { Prisma } from '@prisma/client'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { toSerializable } from '@/lib/json-bigint'
import { rechargeWalletSchema } from '@/lib/validations/caisse'
import { requireUserId } from '@/lib/auth/session'
import {
  computeWalletSolde,
  ensureWallet,
  round2,
  writeJournalCaisseEntry,
} from '@/lib/caisse/helpers'
import { requireOpenSession } from '@/lib/caisse/session'
import type { PatientWalletDetail, WalletTransactionRow } from '@/lib/types/wallet'
import { notifyWalletRecharge } from '@/lib/whatsapp/notify'

function num(v: { toString(): string } | number | null | undefined): number {
  if (v === null || v === undefined) return 0
  return Number(v)
}

export async function getPatientWallet(patientId: string): Promise<PatientWalletDetail | null> {
  const bid = BigInt(patientId)
  const patient = await prisma.patient.findUnique({
    where: { id: bid },
    select: { id: true },
  })
  if (!patient) return null

  const wallet = await ensureWallet(bid)

  const [transactions, solde, entreesAgg, sortiesAgg] = await Promise.all([
    prisma.walletTransaction.findMany({
      where: { walletId: wallet.id },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      include: { user: { select: { name: true } } },
    }),
    computeWalletSolde(wallet.id),
    prisma.walletTransaction.aggregate({
      where: { walletId: wallet.id, montant: { gt: 0 } },
      _sum: { montant: true },
    }),
    prisma.walletTransaction.aggregate({
      where: { walletId: wallet.id, montant: { lt: 0 } },
      _sum: { montant: true },
    }),
  ])

  const totalEntrees = round2(num(entreesAgg._sum.montant))
  const totalSorties = round2(Math.abs(num(sortiesAgg._sum.montant)))

  const rows: WalletTransactionRow[] = transactions.map((t) => ({
    id: t.id.toString(),
    type: t.type,
    montant: num(t.montant),
    modePaiement: t.modePaiement as WalletTransactionRow['modePaiement'],
    description: t.description,
    createdAt: t.createdAt ? t.createdAt.toISOString() : null,
    userName: t.user?.name ?? null,
  }))

  return toSerializable({
    id: wallet.id.toString(),
    patientId: wallet.patientId.toString(),
    solde,
    totalEntrees,
    totalSorties,
    createdAt: wallet.createdAt ? wallet.createdAt.toISOString() : null,
    transactions: rows,
  }) as PatientWalletDetail
}

export async function getWalletSolde(patientId: string): Promise<number> {
  const wallet = await ensureWallet(BigInt(patientId))
  return computeWalletSolde(wallet.id)
}

export async function rechargeWallet(
  data: unknown,
): Promise<{ ok: true; solde: number } | { ok: false; error: string }> {
  try {
    const userId = await requireUserId()
    const session = await requireOpenSession(userId)
    const v = rechargeWalletSchema.parse(data)
    const patientId = BigInt(v.patientId)
    const montant = round2(v.montant)

    const wallet = await ensureWallet(patientId, userId)

    let walletTransactionId!: bigint

    await prisma.$transaction(async (tx) => {
      const wt = await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          type: 'recharge',
          montant,
          modePaiement: v.modePaiement,
          description:
            v.description?.trim() ||
            `Recharge ${v.modePaiement === 'ESPECES' ? 'espèces' : 'Mobile Money'}`,
          userId,
          sessionId: session.id,
        },
      })

      walletTransactionId = wt.id

      const libelle =
        v.description?.trim() ||
        `Recharge portemonnaie — ${v.modePaiement === 'ESPECES' ? 'espèces' : 'Mobile Money'}`

      await writeJournalCaisseEntry(tx, {
        sens: 'ENCAISSEMENT',
        montant,
        modePaiement: v.modePaiement,
        libelle,
        patientId,
        referenceType: 'WalletTransaction',
        referenceId: wt.id,
        sessionId: session.id,
        userId,
      })
    })

    const solde = await computeWalletSolde(wallet.id)

    revalidatePath('/caisse')
    revalidatePath(`/patients/${v.patientId}`)

    void notifyWalletRecharge({
      patientId: v.patientId,
      walletTransactionId: walletTransactionId.toString(),
      montant,
      solde,
    }).catch((err) => console.error('[whatsapp] recharge:', err))

    return { ok: true, solde }
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : 'Erreur lors de la recharge',
    }
  }
}

export type PayFromWalletInput = {
  patientId: bigint
  montant: number
  description: string
  transactionableType: 'FeuilleCirculation' | 'Facture'
  transactionableId: bigint
  userId: bigint
  sessionId: bigint
}

/** Débit portemonnaie (montant négatif). À appeler dans une transaction Prisma existante. */
export async function payFromWalletInTx(
  tx: Prisma.TransactionClient,
  input: PayFromWalletInput,
) {
  const wallet = await tx.wallet.findUnique({ where: { patientId: input.patientId } })
  if (!wallet) throw new Error('Portemonnaie introuvable.')

  const agg = await tx.walletTransaction.aggregate({
    where: { walletId: wallet.id },
    _sum: { montant: true },
  })
  const solde = round2(num(agg._sum.montant))
  if (solde < input.montant) {
    throw new Error(
      `Solde insuffisant (${solde.toLocaleString('fr-FR')} FCFA). Rechargez le portemonnaie.`,
    )
  }

  const wt = await tx.walletTransaction.create({
    data: {
      walletId: wallet.id,
      type: 'paiement',
      montant: -round2(input.montant),
      description: input.description,
      transactionableType: input.transactionableType,
      transactionableId: input.transactionableId,
      userId: input.userId,
      sessionId: input.sessionId,
    },
  })

  await writeJournalCaisseEntry(tx, {
    sens: 'DECAISSEMENT',
    montant: input.montant,
    modePaiement: 'PORTEFEUILLE',
    libelle: input.description,
    patientId: input.patientId,
    referenceType: 'WalletTransaction',
    referenceId: wt.id,
    sessionId: input.sessionId,
    userId: input.userId,
  })

  return wt
}
