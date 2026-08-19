'use server'

import { prisma } from '@/lib/prisma'
import { toSerializable } from '@/lib/json-bigint'
import {
  categorieActeSchema,
  categorieActeUpdateSchema,
} from '@/lib/validations/acte'

export async function listCategorieActes() {
  const items = await prisma.categorieActe.findMany({
    orderBy: { nom: 'asc' },
  })
  return toSerializable(items)
}

export async function createCategorieActe(data: unknown) {
  const v = categorieActeSchema.parse(data)
  const row = await prisma.categorieActe.create({ data: { nom: v.nom } })
  return toSerializable(row)
}

export async function updateCategorieActe(data: unknown) {
  const v = categorieActeUpdateSchema.parse(data)
  const row = await prisma.categorieActe.update({
    where: { id: BigInt(v.id) },
    data: { nom: v.nom },
  })
  return toSerializable(row)
}

export async function deleteCategorieActe(id: string) {
  await prisma.categorieActe.delete({ where: { id: BigInt(id) } })
}
