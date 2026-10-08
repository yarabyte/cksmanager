'use server'

import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { toSerializable } from '@/lib/json-bigint'
import { acteCreateSchema, acteUpdateSchema, normalizeActeType } from '@/lib/validations/acte'
import { Decimal } from '@prisma/client/runtime/library'

function typeActeWhere(typeActe?: string): Prisma.ActeWhereInput {
  if (!typeActe || typeActe === 'all') return {}
  if (normalizeActeType(typeActe) === 'PLENITUDE') {
    return {
      OR: [
        { typeActe: { equals: 'plenitude', mode: 'insensitive' } },
        { typeActe: { equals: 'plénitude', mode: 'insensitive' } },
      ],
    }
  }
  return {
    OR: [
      { typeActe: { equals: 'cks', mode: 'insensitive' } },
      { typeActe: null },
      { typeActe: '' },
    ],
  }
}

export async function listActes(params: {
  q?: string
  categorieId?: string
  assureurId?: string
  typeActe?: string
  skip?: number
  take?: number
}) {
  const take = Math.min(params.take ?? 50, 100)
  const skip = params.skip ?? 0
  const q = params.q?.trim()

  const where: Prisma.ActeWhereInput = {
    ...(q && q.length > 0
      ? { nom: { contains: q, mode: 'insensitive' } }
      : {}),
    ...(params.categorieId && params.categorieId !== 'all'
      ? { categorieId: BigInt(params.categorieId) }
      : {}),
    ...(params.assureurId && params.assureurId !== 'all'
      ? params.assureurId === 'none'
        ? { assureurId: null }
        : { assureurId: BigInt(params.assureurId) }
      : {}),
    ...typeActeWhere(params.typeActe),
  }

  const [items, total] = await Promise.all([
    prisma.acte.findMany({
      where,
      skip,
      take,
      orderBy: { id: 'desc' },
      include: { categorie: true, assureur: true },
    }),
    prisma.acte.count({ where }),
  ])
  return toSerializable({ items, total })
}

export async function getActeById(id: string) {
  const row = await prisma.acte.findUnique({
    where: { id: BigInt(id) },
    include: { categorie: true, assureur: true },
  })
  return row ? toSerializable(row) : null
}

export async function createActe(data: unknown) {
  const v = acteCreateSchema.parse(data)
  const row = await prisma.acte.create({
    data: {
      nom: v.nom,
      categorieId: BigInt(v.categorieId),
      assureurId: v.assureurId ? BigInt(v.assureurId) : null,
      codeBase: v.codeBase ?? null,
      coefficient: v.coefficient,
      valeurFixe: v.valeurFixe ?? null,
      prixHnc:
        v.prixHnc && v.prixHnc.length > 0 ? new Decimal(v.prixHnc) : null,
      imputeAssurance: v.imputeAssurance ?? null,
      typeActe: v.typeActe,
      exonerePartPatient: v.exonerePartPatient,
    },
  })
  return toSerializable(row)
}

export async function updateActe(data: unknown) {
  const v = acteUpdateSchema.parse(data)
  const row = await prisma.acte.update({
    where: { id: BigInt(v.id) },
    data: {
      nom: v.nom,
      categorieId: BigInt(v.categorieId),
      assureurId: v.assureurId ? BigInt(v.assureurId) : null,
      codeBase: v.codeBase ?? null,
      coefficient: v.coefficient,
      valeurFixe: v.valeurFixe ?? null,
      prixHnc:
        v.prixHnc && v.prixHnc.length > 0 ? new Decimal(v.prixHnc) : null,
      imputeAssurance: v.imputeAssurance ?? null,
      typeActe: v.typeActe,
      exonerePartPatient: v.exonerePartPatient,
    },
  })
  return toSerializable(row)
}

export async function deleteActe(id: string) {
  await prisma.acte.delete({ where: { id: BigInt(id) } })
}
