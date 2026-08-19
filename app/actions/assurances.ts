'use server'

import { prisma } from '@/lib/prisma'
import { toSerializable } from '@/lib/json-bigint'
import {
  assuranceCreateSchema,
  assuranceUpdateSchema,
  assuranceValeurSchema,
  assuranceValeurUpdateSchema,
} from '@/lib/validations/assurance'

export async function listAssurances() {
  const items = await prisma.assurance.findMany({
    orderBy: { nom: 'asc' },
    include: {
      promoteurUser: { select: { id: true, name: true, email: true } },
    },
  })
  return toSerializable(items)
}

export async function getAssuranceById(id: string) {
  const a = await prisma.assurance.findUnique({
    where: { id: BigInt(id) },
    include: {
      assuranceValeurs: true,
      promoteurUser: { select: { id: true, name: true, email: true } },
    },
  })
  return a ? toSerializable(a) : null
}

function isUniqueCodeError(e: unknown): boolean {
  return (
    typeof e === 'object' &&
    e !== null &&
    'code' in e &&
    (e as { code: string }).code === 'P2002'
  )
}

export async function createAssurance(data: unknown) {
  const v = assuranceCreateSchema.parse(data)
  try {
    const row = await prisma.assurance.create({
      data: {
        nom: v.nom,
        code: v.code ?? null,
        type: v.type ?? null,
        description: v.description ?? null,
        promoteurUserId: v.promoteurUserId ? BigInt(v.promoteurUserId) : null,
      },
      include: {
        promoteurUser: { select: { id: true, name: true, email: true } },
      },
    })
    return toSerializable(row)
  } catch (e) {
    if (isUniqueCodeError(e)) throw new Error('Ce code assureur est déjà utilisé.')
    throw e
  }
}

export async function updateAssurance(data: unknown) {
  const v = assuranceUpdateSchema.parse(data)
  try {
    const row = await prisma.assurance.update({
      where: { id: BigInt(v.id) },
      data: {
        nom: v.nom,
        code: v.code ?? null,
        type: v.type ?? null,
        description: v.description ?? null,
        promoteurUserId: v.promoteurUserId ? BigInt(v.promoteurUserId) : null,
      },
      include: {
        promoteurUser: { select: { id: true, name: true, email: true } },
      },
    })
    return toSerializable(row)
  } catch (e) {
    if (isUniqueCodeError(e)) throw new Error('Ce code assureur est déjà utilisé.')
    throw e
  }
}

export async function deleteAssurance(id: string) {
  await prisma.assurance.delete({ where: { id: BigInt(id) } })
}

export async function createAssuranceValeur(data: unknown) {
  const v = assuranceValeurSchema.parse(data)
  const row = await prisma.assuranceValeur.create({
    data: {
      assuranceId: BigInt(v.assuranceId),
      codeBase: v.codeBase,
      valeurUnitaire: v.valeurUnitaire,
      dateDebut: v.dateDebut ?? null,
      dateFin: v.dateFin ?? null,
    },
  })
  return toSerializable(row)
}

export async function updateAssuranceValeur(data: unknown) {
  const v = assuranceValeurUpdateSchema.parse(data)
  const row = await prisma.assuranceValeur.update({
    where: { id: BigInt(v.id) },
    data: {
      codeBase: v.codeBase,
      valeurUnitaire: v.valeurUnitaire,
      dateDebut: v.dateDebut ?? null,
      dateFin: v.dateFin ?? null,
    },
  })
  return toSerializable(row)
}

export async function deleteAssuranceValeur(id: string) {
  await prisma.assuranceValeur.delete({ where: { id: BigInt(id) } })
}
