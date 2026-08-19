import type { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { round2 } from '@/lib/caisse/helpers'

type Db = Prisma.TransactionClient | typeof prisma

export async function nextPharmaNumero(
  prefix: string,
  tx: Prisma.TransactionClient,
  model: 'approvisionnement' | 'transfertMagasin' | 'sortiePharmacie' | 'retourPharmacie',
): Promise<string> {
  const year = new Date().getFullYear()
  const start = `${prefix}-${year}-`
  const finders = {
    approvisionnement: () =>
      tx.approvisionnement.findFirst({
        where: { numero: { startsWith: start } },
        orderBy: { numero: 'desc' },
        select: { numero: true },
      }),
    transfertMagasin: () =>
      tx.transfertMagasin.findFirst({
        where: { numero: { startsWith: start } },
        orderBy: { numero: 'desc' },
        select: { numero: true },
      }),
    sortiePharmacie: () =>
      tx.sortiePharmacie.findFirst({
        where: { numero: { startsWith: start } },
        orderBy: { numero: 'desc' },
        select: { numero: true },
      }),
    retourPharmacie: () =>
      tx.retourPharmacie.findFirst({
        where: { numero: { startsWith: start } },
        orderBy: { numero: 'desc' },
        select: { numero: true },
      }),
  }
  const last = await finders[model]()
  let seq = 1
  if (last?.numero) {
    const n = parseInt(last.numero.slice(start.length), 10)
    if (!Number.isNaN(n)) seq = n + 1
  }
  return `${start}${String(seq).padStart(4, '0')}`
}

export async function upsertStockLot(
  tx: Prisma.TransactionClient,
  data: {
    produitId: bigint
    magasinId: bigint
    numeroLot: string
    datePeremption: Date
    quantiteDelta: number
    prixAchat?: number
  },
) {
  const existing = await tx.stockLot.findUnique({
    where: {
      produitId_magasinId_numeroLot: {
        produitId: data.produitId,
        magasinId: data.magasinId,
        numeroLot: data.numeroLot,
      },
    },
  })

  if (existing) {
    const nextQty = existing.quantite + data.quantiteDelta
    if (nextQty < 0) {
      throw new Error(`Stock insuffisant sur le lot ${data.numeroLot}.`)
    }
    return tx.stockLot.update({
      where: { id: existing.id },
      data: {
        quantite: nextQty,
        datePeremption: data.datePeremption,
        ...(data.prixAchat != null ? { prixAchat: round2(data.prixAchat) } : {}),
      },
    })
  }

  if (data.quantiteDelta < 0) {
    throw new Error(`Lot ${data.numeroLot} introuvable.`)
  }

  return tx.stockLot.create({
    data: {
      produitId: data.produitId,
      magasinId: data.magasinId,
      numeroLot: data.numeroLot,
      datePeremption: data.datePeremption,
      quantite: data.quantiteDelta,
      prixAchat: round2(data.prixAchat ?? 0),
    },
  })
}

export async function writeMouvement(
  tx: Prisma.TransactionClient,
  data: {
    type: string
    stockLotId: bigint
    quantite: number
    referenceType?: string
    referenceId?: bigint
    userId: bigint
  },
) {
  return tx.mouvementStock.create({
    data: {
      type: data.type,
      stockLotId: data.stockLotId,
      quantite: data.quantite,
      referenceType: data.referenceType ?? null,
      referenceId: data.referenceId ?? null,
      userId: data.userId,
    },
  })
}

export async function getUserPharmacieContext(userId: bigint, tx?: Prisma.TransactionClient) {
  const db: Db = tx ?? prisma
  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      pharmacieId: true,
      pharmacie: {
        select: {
          id: true,
          nom: true,
          actif: true,
          magasinId: true,
          magasin: { select: { id: true, nom: true, actif: true } },
        },
      },
    },
  })
  if (!user?.pharmacie || !user.pharmacie.actif) {
    throw new Error('Aucune pharmacie active affectée à votre compte.')
  }
  if (!user.pharmacie.magasin.actif) {
    throw new Error('Le magasin de votre pharmacie est inactif.')
  }
  return {
    pharmacieId: user.pharmacie.id,
    pharmacieNom: user.pharmacie.nom,
    magasinId: user.pharmacie.magasinId,
    magasinNom: user.pharmacie.magasin.nom,
  }
}

export function parseDateOnly(value: string): Date {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(value.trim())
  if (!m) throw new Error('Date invalide.')
  return new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])))
}
