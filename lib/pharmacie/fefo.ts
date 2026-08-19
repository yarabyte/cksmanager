import type { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'

type Db = Prisma.TransactionClient | typeof prisma

export type LotAllocation = {
  stockLotId: bigint
  numeroLot: string
  datePeremption: Date
  quantite: number
  prixAchat: number
}

/** Alloue une quantité selon FEFO (péremption la plus proche d’abord). */
export async function allocateFefo(
  magasinId: bigint,
  produitId: bigint,
  quantite: number,
  tx?: Prisma.TransactionClient,
): Promise<LotAllocation[]> {
  if (quantite <= 0) return []
  const db: Db = tx ?? prisma

  const lots = await db.stockLot.findMany({
    where: { magasinId, produitId, quantite: { gt: 0 } },
    orderBy: [{ datePeremption: 'asc' }, { id: 'asc' }],
  })

  const available = lots.reduce((s, l) => s + l.quantite, 0)
  if (available < quantite) {
    throw new Error(
      `Stock insuffisant pour le produit #${produitId} (disponible : ${available}, demandé : ${quantite}).`,
    )
  }

  let remaining = quantite
  const allocations: LotAllocation[] = []
  for (const lot of lots) {
    if (remaining <= 0) break
    const take = Math.min(lot.quantite, remaining)
    allocations.push({
      stockLotId: lot.id,
      numeroLot: lot.numeroLot,
      datePeremption: lot.datePeremption,
      quantite: take,
      prixAchat: Number(lot.prixAchat),
    })
    remaining -= take
  }
  return allocations
}

/** Prévisualise l’allocation FEFO sans modifier le stock. */
export async function previewFefo(
  magasinId: bigint,
  produitId: bigint,
  quantite: number,
): Promise<{
  stockDisponible: number
  stockSuffisant: boolean
  allocations: LotAllocation[]
  lotsDisponibles: Array<{
    stockLotId: bigint
    numeroLot: string
    datePeremption: Date
    quantite: number
  }>
}> {
  const lots = await prisma.stockLot.findMany({
    where: { magasinId, produitId, quantite: { gt: 0 } },
    orderBy: [{ datePeremption: 'asc' }, { id: 'asc' }],
  })

  const stockDisponible = lots.reduce((s, l) => s + l.quantite, 0)
  if (quantite <= 0) {
    return {
      stockDisponible,
      stockSuffisant: true,
      allocations: [],
      lotsDisponibles: lots.map((l) => ({
        stockLotId: l.id,
        numeroLot: l.numeroLot,
        datePeremption: l.datePeremption,
        quantite: l.quantite,
      })),
    }
  }

  if (stockDisponible < quantite) {
    return {
      stockDisponible,
      stockSuffisant: false,
      allocations: [],
      lotsDisponibles: lots.map((l) => ({
        stockLotId: l.id,
        numeroLot: l.numeroLot,
        datePeremption: l.datePeremption,
        quantite: l.quantite,
      })),
    }
  }

  const allocations = await allocateFefo(magasinId, produitId, quantite)
  return {
    stockDisponible,
    stockSuffisant: true,
    allocations,
    lotsDisponibles: lots.map((l) => ({
      stockLotId: l.id,
      numeroLot: l.numeroLot,
      datePeremption: l.datePeremption,
      quantite: l.quantite,
    })),
  }
}
