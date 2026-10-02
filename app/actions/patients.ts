'use server'

import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { toSerializable } from '@/lib/json-bigint'
import {
  patientCreateSchema,
  patientUpdateSchema,
} from '@/lib/validations/patient'
import { normalizeWhatsAppPhone } from '@/lib/phone'
import { findNonAssureAssurance } from '@/lib/assurance/non-assure'
import { assertCanAssignAssurance } from '@/lib/assurance/promoteur'
import { requireUser, requireUserId } from '@/lib/auth/session'
import { z } from 'zod'
import { notifyEventAsync } from '@/lib/notifications/create-notification'
import { formatPatientIdentityLine } from '@/lib/formatting'
import { insertWithNextId, prismaWriteErrorMessage } from '@/lib/db/sync-pg-serial'

export async function listPatients(params: {
  q?: string
  skip?: number
  take?: number
  sexe?: number
  assuranceId?: string
}) {
  const take = Math.min(params.take ?? 50, 100)
  const skip = params.skip ?? 0
  const q = params.q?.trim()

  const and: Prisma.PatientWhereInput[] = []

  if (q && q.length > 0) {
    and.push({
      OR: [
        { patName: { contains: q, mode: 'insensitive' } },
        { patSurname: { contains: q, mode: 'insensitive' } },
        { nomJeuneFille: { contains: q, mode: 'insensitive' } },
        { patNum1: { contains: q } },
        ...( /^\d+$/.test(q) ? [{ id: BigInt(q) }] : []),
      ],
    })
  }

  if (params.sexe === 1 || params.sexe === 2) {
    and.push({ sexe: params.sexe })
  }

  if (params.assuranceId === 'none') {
    and.push({ assurancePatients: { none: {} } })
  } else if (params.assuranceId && params.assuranceId !== 'all') {
    and.push({
      assurancePatients: { some: { assuranceId: BigInt(params.assuranceId) } },
    })
  }

  const where: Prisma.PatientWhereInput = and.length > 0 ? { AND: and } : {}

  const [items, total] = await Promise.all([
    prisma.patient.findMany({
      where,
      skip,
      take,
      orderBy: { id: 'desc' },
      include: {
        assurancePatients: {
          include: { assurance: true },
        },
      },
    }),
    prisma.patient.count({ where }),
  ])
  return toSerializable({ items, total })
}

export async function getPatientById(id: string) {
  const bid = BigInt(id)
  const patient = await prisma.patient.findUnique({
    where: { id: bid },
    include: {
      assurancePatients: {
        include: {
          assurance: true,
          couvertures: { include: { categorie: true } },
        },
      },
    },
  })
  return patient ? toSerializable(patient) : null
}

export async function createPatient(data: unknown): Promise<{ ok: true; patient: unknown } | { ok: false; error: string }> {
  try {
    const userId = await requireUserId()
    const v = patientCreateSchema.parse(data)
    const patNum1 = normalizeWhatsAppPhone(v.patNum1)!
    const patNum2 =
      v.patNum2 && v.patNum2.trim() ? normalizeWhatsAppPhone(v.patNum2) : null

    const patient = await prisma.$transaction(async (tx) => {
      const created = await insertWithNextId(
        'patients',
        (id) =>
          tx.patient.create({
            data: {
              id,
              civilite: v.civilite,
              patName: v.patName,
              patSurname: v.patSurname,
              nomJeuneFille:
                v.sexe === 2 ? (v.nomJeuneFille?.trim() ? v.nomJeuneFille.trim() : null) : null,
              patEmail: v.patEmail || null,
              patDob: v.patDob,
              patLieuNaiss: v.patLieuNaiss,
              patCni: v.patCni ?? null,
              patAdress: v.patAdress,
              patNum1,
              patNum2,
              patProfession: v.patProfession ?? null,
              sexe: v.sexe,
            },
          }),
        tx,
      )

      await insertWithNextId(
        'wallets',
        (id) =>
          tx.wallet.create({
            data: {
              id,
              patientId: created.id,
              userId,
            },
          }),
        tx,
      )

      const nonAssure = await findNonAssureAssurance(tx)
      if (nonAssure) {
        await insertWithNextId(
          'assurance_patient',
          (id) =>
            tx.assurancePatient.create({
              data: {
                id,
                patientId: created.id,
                assuranceId: nonAssure.id,
                tauxCouverture: 0,
              },
            }),
          tx,
        )
      }

      return created
    })

    notifyEventAsync({
      type: 'PATIENT_CREE',
      message: `Nouveau patient créé : ${formatPatientIdentityLine(
        String(patient.patName),
        String(patient.patSurname),
        Number(patient.sexe),
        patient.nomJeuneFille != null && String(patient.nomJeuneFille).trim() !== ''
          ? String(patient.nomJeuneFille)
          : null,
      )}`,
      href: `/patients/${patient.id}`,
      entityType: 'Patient',
      entityId: patient.id,
      actorUserId: userId,
    })

    return { ok: true, patient: toSerializable(patient) }
  } catch (e) {
    return {
      ok: false,
      error: prismaWriteErrorMessage(e, 'Impossible de créer le patient.'),
    }
  }
}

const patientAssuranceOnCreateSchema = z.object({
  assuranceId: z.string().regex(/^\d+$/),
  dateDebut: z.coerce.date().optional().nullable(),
  dateFin: z.coerce.date().optional().nullable(),
  numeroAttestation: z.string().max(255).optional().nullable(),
  tauxCouverture: z.number().int().min(0).max(100),
  couvertures: z
    .array(
      z.object({
        categorieId: z.string().regex(/^\d+$/),
        tauxCouverture: z.number().min(0).max(100),
      }),
    )
    .optional(),
})

const createPatientWithAssuranceSchema = z.object({
  patient: patientCreateSchema,
  assurance: patientAssuranceOnCreateSchema.optional().nullable(),
})

export async function createPatientWithAssurance(
  data: unknown,
): Promise<{ ok: true; patient: unknown } | { ok: false; error: string }> {
  try {
    const user = await requireUser()
    const userId = user.id
    const parsed = createPatientWithAssuranceSchema.parse(data)
    const v = parsed.patient
    const patNum1 = normalizeWhatsAppPhone(v.patNum1)!
    const patNum2 =
      v.patNum2 && v.patNum2.trim() ? normalizeWhatsAppPhone(v.patNum2) : null

    if (parsed.assurance) {
      const assurance = await prisma.assurance.findUnique({
        where: { id: BigInt(parsed.assurance.assuranceId) },
        select: { id: true, promoteurUserId: true },
      })
      if (!assurance) return { ok: false, error: 'Assureur introuvable.' }
      assertCanAssignAssurance(userId, assurance)
    }

    const patient = await prisma.$transaction(async (tx) => {
      const created = await insertWithNextId(
        'patients',
        (id) =>
          tx.patient.create({
            data: {
              id,
              civilite: v.civilite,
              patName: v.patName,
              patSurname: v.patSurname,
              nomJeuneFille:
                v.sexe === 2 ? (v.nomJeuneFille?.trim() ? v.nomJeuneFille.trim() : null) : null,
              patEmail: v.patEmail || null,
              patDob: v.patDob,
              patLieuNaiss: v.patLieuNaiss,
              patCni: v.patCni ?? null,
              patAdress: v.patAdress,
              patNum1,
              patNum2,
              patProfession: v.patProfession ?? null,
              sexe: v.sexe,
            },
          }),
        tx,
      )

      await insertWithNextId(
        'wallets',
        (id) =>
          tx.wallet.create({
            data: {
              id,
              patientId: created.id,
              userId,
            },
          }),
        tx,
      )

      if (parsed.assurance) {
        const a = parsed.assurance
        const ap = await insertWithNextId(
          'assurance_patient',
          (id) =>
            tx.assurancePatient.create({
              data: {
                id,
                patientId: created.id,
                assuranceId: BigInt(a.assuranceId),
                dateDebut: a.dateDebut ?? null,
                dateFin: a.dateFin ?? null,
                numeroAttestation: a.numeroAttestation?.trim() || null,
                tauxCouverture: a.tauxCouverture,
              },
            }),
          tx,
        )
        for (const c of a.couvertures ?? []) {
          await insertWithNextId(
            'assurance_patient_couvertures',
            (lid) =>
              tx.assurancePatientCouverture.create({
                data: {
                  id: lid,
                  assurancePatientId: ap.id,
                  categorieId: BigInt(c.categorieId),
                  tauxCouverture: c.tauxCouverture,
                },
              }),
            tx,
          )
        }
      } else {
        const nonAssure = await findNonAssureAssurance(tx)
        if (nonAssure) {
          await insertWithNextId(
            'assurance_patient',
            (id) =>
              tx.assurancePatient.create({
                data: {
                  id,
                  patientId: created.id,
                  assuranceId: nonAssure.id,
                  tauxCouverture: 0,
                },
              }),
            tx,
          )
        }
      }

      return created
    })

    notifyEventAsync({
      type: 'PATIENT_CREE',
      message: `Nouveau patient créé : ${formatPatientIdentityLine(
        String(patient.patName),
        String(patient.patSurname),
        Number(patient.sexe),
        patient.nomJeuneFille != null && String(patient.nomJeuneFille).trim() !== ''
          ? String(patient.nomJeuneFille)
          : null,
      )}`,
      href: `/patients/${patient.id}`,
      entityType: 'Patient',
      entityId: patient.id,
      actorUserId: userId,
    })

    return { ok: true, patient: toSerializable(patient) }
  } catch (e) {
    return {
      ok: false,
      error: prismaWriteErrorMessage(e, 'Impossible de créer le patient.'),
    }
  }
}

export async function updatePatient(data: unknown) {
  const v = patientUpdateSchema.parse(data)
  const id = BigInt(v.id)
  const patNum1 = normalizeWhatsAppPhone(v.patNum1)!
  const patNum2 =
    v.patNum2 && v.patNum2.trim() ? normalizeWhatsAppPhone(v.patNum2) : null

  const patient = await prisma.patient.update({
    where: { id },
    data: {
      civilite: v.civilite,
      patName: v.patName,
      patSurname: v.patSurname,
      nomJeuneFille:
        v.sexe === 2 ? (v.nomJeuneFille?.trim() ? v.nomJeuneFille.trim() : null) : null,
      patEmail: v.patEmail || null,
      patDob: v.patDob,
      patLieuNaiss: v.patLieuNaiss,
      patCni: v.patCni ?? null,
      patAdress: v.patAdress,
      patNum1,
      patNum2,
      patProfession: v.patProfession ?? null,
      sexe: v.sexe,
    },
  })
  return toSerializable(patient)
}

export async function deletePatient(id: string) {
  const bid = BigInt(id)
  await prisma.patient.delete({ where: { id: bid } })
}

/** Valeurs distinctes déjà saisies sur la table `patients` (autocomplétion Select2). */
export type PatientSelect2Suggestions = {
  lieux: string[]
  adresses: string[]
  professions: string[]
}

const EMPTY_SELECT2: PatientSelect2Suggestions = {
  lieux: [],
  adresses: [],
  professions: [],
}

const SELECT2_LIMIT = 250

function uniqueTrimmed(values: (string | null | undefined)[]): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const raw of values) {
    const s = (raw ?? '').trim()
    if (!s || seen.has(s)) continue
    seen.add(s)
    out.push(s)
    if (out.length >= SELECT2_LIMIT) break
  }
  return out
}

export async function getPatientSelect2Suggestions(): Promise<PatientSelect2Suggestions> {
  try {
    const [lieuRows, adrRows, profRows] = await Promise.all([
      prisma.$queryRaw<{ v: string }[]>`
        SELECT DISTINCT "PatLieuNaiss" AS v FROM patients
        WHERE "PatLieuNaiss" IS NOT NULL AND TRIM("PatLieuNaiss") <> ''
        ORDER BY 1 ASC
        LIMIT 250
      `,
      prisma.$queryRaw<{ v: string }[]>`
        SELECT DISTINCT "PatAdress" AS v FROM patients
        WHERE "PatAdress" IS NOT NULL AND TRIM("PatAdress") <> ''
        ORDER BY 1 ASC
        LIMIT 250
      `,
      prisma.$queryRaw<{ v: string }[]>`
        SELECT DISTINCT "PatProfession" AS v FROM patients
        WHERE "PatProfession" IS NOT NULL AND TRIM("PatProfession") <> ''
        ORDER BY 1 ASC
        LIMIT 250
      `,
    ])
    return {
      lieux: uniqueTrimmed(lieuRows.map((r) => r.v)),
      adresses: uniqueTrimmed(adrRows.map((r) => r.v)),
      professions: uniqueTrimmed(profRows.map((r) => r.v)),
    }
  } catch {
    return EMPTY_SELECT2
  }
}
