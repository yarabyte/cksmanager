'use server'

import { prisma } from '@/lib/prisma'
import { toSerializable } from '@/lib/json-bigint'
import { requireUser } from '@/lib/auth/session'
import {
  assertCanAssignAssurance,
  assertCanEditTauxPromoteur,
} from '@/lib/assurance/promoteur'
import {
  assurancePatientCreateSchema,
  assurancePatientUpdateSchema,
  assurancePatientCouvertureSchema,
  assurancePatientCouvertureUpdateSchema,
} from '@/lib/validations/assurance-patient'

async function loadAssuranceOrThrow(assuranceId: bigint) {
  const assurance = await prisma.assurance.findUnique({
    where: { id: assuranceId },
    select: { id: true, promoteurUserId: true },
  })
  if (!assurance) throw new Error('Assureur introuvable.')
  return assurance
}

async function loadAssurancePatientWithAssuranceOrThrow(id: bigint) {
  const row = await prisma.assurancePatient.findUnique({
    where: { id },
    include: {
      assurance: { select: { id: true, promoteurUserId: true } },
    },
  })
  if (!row) throw new Error('Affiliation assurance introuvable.')
  return row
}

export async function createAssurancePatient(data: unknown) {
  const user = await requireUser()
  const v = assurancePatientCreateSchema.parse(data)
  const patientId = BigInt(v.patientId)
  const assuranceId = BigInt(v.assuranceId)

  const assurance = await loadAssuranceOrThrow(assuranceId)
  assertCanAssignAssurance(user.id, assurance)

  const existing = await prisma.assurancePatient.findFirst({
    where: { patientId },
  })

  // Un seul lien autorisé : si déjà présent (ex. « Non assuré » à la création), on le met à jour.
  if (existing) {
    if (
      existing.tauxCouverture !== v.tauxCouverture &&
      existing.assuranceId === assuranceId
    ) {
      assertCanEditTauxPromoteur(user.id, assurance)
    } else if (existing.assuranceId !== assuranceId) {
      assertCanAssignAssurance(user.id, assurance)
    }
    const row = await prisma.assurancePatient.update({
      where: { id: existing.id },
      data: {
        assuranceId,
        dateDebut: v.dateDebut ?? null,
        dateFin: v.dateFin ?? null,
        numeroAttestation: v.numeroAttestation ?? null,
        tauxCouverture: v.tauxCouverture,
      },
      include: { assurance: true },
    })
    return toSerializable(row)
  }

  const row = await prisma.assurancePatient.create({
    data: {
      patientId,
      assuranceId,
      dateDebut: v.dateDebut ?? null,
      dateFin: v.dateFin ?? null,
      numeroAttestation: v.numeroAttestation ?? null,
      tauxCouverture: v.tauxCouverture,
    },
    include: { assurance: true },
  })
  return toSerializable(row)
}

export async function updateAssurancePatient(data: unknown) {
  const user = await requireUser()
  const v = assurancePatientUpdateSchema.parse(data)
  const targetAssurance = await loadAssuranceOrThrow(BigInt(v.assuranceId))
  assertCanAssignAssurance(user.id, targetAssurance)

  const existing = await loadAssurancePatientWithAssuranceOrThrow(BigInt(v.id))
  if (
    existing.tauxCouverture !== v.tauxCouverture &&
    existing.assuranceId === BigInt(v.assuranceId)
  ) {
    assertCanEditTauxPromoteur(user.id, existing.assurance)
  }

  const row = await prisma.assurancePatient.update({
    where: { id: BigInt(v.id) },
    data: {
      assuranceId: BigInt(v.assuranceId),
      dateDebut: v.dateDebut ?? null,
      dateFin: v.dateFin ?? null,
      numeroAttestation: v.numeroAttestation ?? null,
      tauxCouverture: v.tauxCouverture,
    },
    include: { assurance: true },
  })
  return toSerializable(row)
}

export async function deleteAssurancePatient(id: string) {
  await requireUser()
  await prisma.assurancePatient.delete({ where: { id: BigInt(id) } })
}

export async function createAssurancePatientCouverture(data: unknown) {
  const user = await requireUser()
  const v = assurancePatientCouvertureSchema.parse(data)
  const ap = await loadAssurancePatientWithAssuranceOrThrow(
    BigInt(v.assurancePatientId),
  )
  assertCanEditTauxPromoteur(user.id, ap.assurance)

  const row = await prisma.assurancePatientCouverture.create({
    data: {
      assurancePatientId: BigInt(v.assurancePatientId),
      categorieId: BigInt(v.categorieId),
      tauxCouverture: v.tauxCouverture,
    },
    include: { categorie: true },
  })
  return toSerializable(row)
}

export async function updateAssurancePatientCouverture(data: unknown) {
  const user = await requireUser()
  const v = assurancePatientCouvertureUpdateSchema.parse(data)
  const cov = await prisma.assurancePatientCouverture.findUnique({
    where: { id: BigInt(v.id) },
    include: {
      assurancePatient: {
        include: {
          assurance: { select: { id: true, promoteurUserId: true } },
        },
      },
    },
  })
  if (!cov) throw new Error('Couverture introuvable.')
  assertCanEditTauxPromoteur(user.id, cov.assurancePatient.assurance)

  const row = await prisma.assurancePatientCouverture.update({
    where: { id: BigInt(v.id) },
    data: {
      categorieId: BigInt(v.categorieId),
      tauxCouverture: v.tauxCouverture,
    },
    include: { categorie: true },
  })
  return toSerializable(row)
}

export async function deleteAssurancePatientCouverture(id: string) {
  const user = await requireUser()
  const cov = await prisma.assurancePatientCouverture.findUnique({
    where: { id: BigInt(id) },
    include: {
      assurancePatient: {
        include: {
          assurance: { select: { id: true, promoteurUserId: true } },
        },
      },
    },
  })
  if (!cov) throw new Error('Couverture introuvable.')
  assertCanEditTauxPromoteur(user.id, cov.assurancePatient.assurance)

  await prisma.assurancePatientCouverture.delete({
    where: { id: BigInt(id) },
  })
}
