'use server'

import { Prisma } from '@prisma/client'
import { Decimal } from '@prisma/client/runtime/library'
import { prisma } from '@/lib/prisma'
import { toSerializable, toSerializableAs } from '@/lib/json-bigint'
import {
  kitActeCreateSchema,
  kitActeUpdateSchema,
  kitActeLigneCreateSchema,
  kitActeLigneUpdateSchema,
} from '@/lib/validations/kits'
import type {
  ActeSelectRow,
  KitActeDetailSerializable,
  ProduitSelectRow,
} from '@/lib/types/kits'

function optBigInt(v: string | null | undefined): bigint | null {
  if (v == null || v === '') return null
  return BigInt(v)
}

export async function listActesForKitSelect(): Promise<ActeSelectRow[]> {
  const rows = await prisma.acte.findMany({
    orderBy: { nom: 'asc' },
    take: 500,
    select: { id: true, nom: true },
  })
  return toSerializableAs<ActeSelectRow[]>(rows)
}

export async function listProduitsForKitSelect(params?: {
  q?: string
}): Promise<ProduitSelectRow[]> {
  const q = params?.q?.trim()
  const where: Prisma.ProduitWhereInput =
    q && q.length > 0
      ? { nom: { contains: q, mode: 'insensitive' } }
      : {}
  const rows = await prisma.produit.findMany({
    where,
    orderBy: { nom: 'asc' },
    take: 80,
    select: { id: true, nom: true, dosage: true },
  })
  return toSerializableAs<ProduitSelectRow[]>(rows)
}

export async function listKitActes(params: {
  q?: string
  actif?: string
  userId?: string
  skip?: number
  take?: number
}) {
  const take = Math.min(params.take ?? 50, 100)
  const skip = params.skip ?? 0
  const q = params.q?.trim()
  const where: Prisma.KitActeWhereInput = {
    ...(q && q.length > 0
      ? {
          OR: [
            { nom: { contains: q, mode: 'insensitive' } },
            { description: { contains: q, mode: 'insensitive' } },
          ],
        }
      : {}),
    ...(params.actif === 'true' ? { actif: true } : {}),
    ...(params.actif === 'false' ? { actif: false } : {}),
    ...(params.userId && params.userId !== 'all'
      ? { userId: BigInt(params.userId) }
      : {}),
  }
  const [items, total] = await Promise.all([
    prisma.kitActe.findMany({
      where,
      skip,
      take,
      orderBy: { id: 'desc' },
      include: {
        user: { select: { id: true, name: true, email: true } },
        _count: { select: { lignes: true } },
      },
    }),
    prisma.kitActe.count({ where }),
  ])
  return toSerializable({ items, total })
}

export async function getKitActeById(
  id: string,
): Promise<KitActeDetailSerializable | null> {
  const row = await prisma.kitActe.findUnique({
    where: { id: BigInt(id) },
    include: {
      user: { select: { id: true, name: true, email: true } },
      lignes: {
        orderBy: [{ position: 'asc' }, { id: 'asc' }],
        include: {
          acte: { select: { id: true, nom: true } },
          produit: { select: { id: true, nom: true, dosage: true } },
        },
      },
    },
  })
  return row ? toSerializableAs<KitActeDetailSerializable>(row) : null
}

export async function createKitActe(data: unknown) {
  const v = kitActeCreateSchema.parse(data)
  const row = await prisma.kitActe.create({
    data: {
      nom: v.nom,
      description: v.description ?? null,
      userId: BigInt(v.userId),
      actif: v.actif,
    },
    include: {
      user: { select: { id: true, name: true, email: true } },
      _count: { select: { lignes: true } },
    },
  })
  return toSerializable(row)
}

export async function updateKitActe(data: unknown) {
  const v = kitActeUpdateSchema.parse(data)
  const row = await prisma.kitActe.update({
    where: { id: BigInt(v.id) },
    data: {
      nom: v.nom,
      description: v.description ?? null,
      userId: BigInt(v.userId),
      actif: v.actif,
    },
    include: {
      user: { select: { id: true, name: true, email: true } },
      _count: { select: { lignes: true } },
    },
  })
  return toSerializable(row)
}

export async function deleteKitActe(id: string) {
  await prisma.kitActe.delete({ where: { id: BigInt(id) } })
}

export async function createKitActeLigne(data: unknown) {
  const v = kitActeLigneCreateSchema.parse(data)
  const row = await prisma.kitActeLigne.create({
    data: {
      kitActeId: BigInt(v.kitActeId),
      typeLigne: v.typeLigne,
      acteId: optBigInt(v.acteId ?? undefined),
      quantite: v.quantite,
      produitId: optBigInt(v.produitId ?? undefined),
      remiseUnitaire: new Decimal(v.remiseUnitaire || '0'),
      position: v.position,
    },
    include: {
      acte: { select: { id: true, nom: true } },
      produit: { select: { id: true, nom: true, dosage: true } },
    },
  })
  return toSerializable(row)
}

export async function updateKitActeLigne(data: unknown) {
  const v = kitActeLigneUpdateSchema.parse(data)
  const row = await prisma.kitActeLigne.update({
    where: { id: BigInt(v.id) },
    data: {
      typeLigne: v.typeLigne,
      acteId: optBigInt(v.acteId ?? undefined),
      quantite: v.quantite,
      produitId: optBigInt(v.produitId ?? undefined),
      remiseUnitaire: new Decimal(v.remiseUnitaire || '0'),
      position: v.position,
    },
    include: {
      acte: { select: { id: true, nom: true } },
      produit: { select: { id: true, nom: true, dosage: true } },
    },
  })
  return toSerializable(row)
}

export async function deleteKitActeLigne(id: string) {
  await prisma.kitActeLigne.delete({ where: { id: BigInt(id) } })
}
