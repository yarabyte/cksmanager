'use server'

import { Decimal } from '@prisma/client/runtime/library'
import { prisma } from '@/lib/prisma'
import { toSerializable } from '@/lib/json-bigint'
import { formatPatientIdentityLine, calculateAge } from '@/lib/formatting'
import { requireUserId } from '@/lib/auth/session'
import {
  getVisiteIdsEligiblesParametres,
  isVisiteEligibleParametres,
} from '@/lib/medical/eligibilite-parametres'
import { AGE_PEDIATRIQUE_MAX } from '@/lib/medical/bandelette'
import { computeImc } from '@/lib/medical/imc'
import { parametrePatientBaseSchema, parametrePatientUpsertSchema } from '@/lib/validations/parametre-patient'
import {
  endOfDayDouala,
  parseDoualaIsoDate,
  shiftDoualaDays,
  startOfDayDouala,
  startOfWeekDouala,
  zonedDateTimeToUtc,
} from '@/lib/timezone'

export type VisiteEligibleParametresRow = {
  id: string
  patientId: string
  patientLabel: string | null
  patientAge: number | null
  isPediatrique: boolean
  motifLibelle: string
  medecinNom: string
  dateVisite: string
  statut: string
  parametresRemplis: boolean
}

export type ParametrePatientDetail = {
  id: string
  visiteId: string
  poidsKg: string
  tailleCm: string
  imc: string
  pas: number
  pad: number
  pouls: number
  temperatureC: string
  nitrite: string
  sang: string
  leucocytes: string
  proteine: string
  cetones: string
  ph: string
  sucre: string | null
  perimetreCranien: string | null
  perimetreBrachial: string | null
  frequenceRespiratoire: number | null
  sao2: number | null
  createdAt: string | null
  updatedAt: string | null
}

export type ParametrePatientFormContext = {
  visite: {
    id: string
    patientId: string
    patientLabel: string | null
    patientAge: number | null
    isPediatrique: boolean
    motifLibelle: string
    medecinNom: string
    dateVisite: string
    statut: string
  }
  parametre: ParametrePatientDetail | null
  eligible: boolean
}

function numStr(d: Decimal | number | null | undefined): string | null {
  if (d == null) return null
  return String(d)
}

function toParametreDetail(row: {
  id: bigint
  visiteId: bigint
  poidsKg: Decimal
  tailleCm: Decimal
  imc: Decimal
  pas: number
  pad: number
  pouls: number
  temperatureC: Decimal
  nitrite: string
  sang: string
  leucocytes: string
  proteine: string
  cetones: string
  ph: string
  sucre: string | null
  perimetreCranien: Decimal | null
  perimetreBrachial: Decimal | null
  frequenceRespiratoire: number | null
  sao2: number | null
  createdAt: Date | null
  updatedAt: Date | null
}): ParametrePatientDetail {
  return {
    id: row.id.toString(),
    visiteId: row.visiteId.toString(),
    poidsKg: String(row.poidsKg),
    tailleCm: String(row.tailleCm),
    imc: String(row.imc),
    pas: row.pas,
    pad: row.pad,
    pouls: row.pouls,
    temperatureC: String(row.temperatureC),
    nitrite: row.nitrite,
    sang: row.sang,
    leucocytes: row.leucocytes,
    proteine: row.proteine,
    cetones: row.cetones,
    ph: row.ph,
    sucre: row.sucre,
    perimetreCranien: numStr(row.perimetreCranien),
    perimetreBrachial: numStr(row.perimetreBrachial),
    frequenceRespiratoire: row.frequenceRespiratoire,
    sao2: row.sao2,
    createdAt: row.createdAt?.toISOString() ?? null,
    updatedAt: row.updatedAt?.toISOString() ?? null,
  }
}

export type ListVisitesEligiblesParametresResult = {
  items: VisiteEligibleParametresRow[]
  total: number
  page: number
  pageSize: number
}

const DEFAULT_PAGE_SIZE = 20

function buildDateFilter(
  periode?: string,
  dateFrom?: string,
  dateTo?: string,
): { gte?: Date; lte?: Date } | undefined {
  const now = new Date()
  if (periode === 'custom' && dateFrom) {
    const from = parseDoualaIsoDate(dateFrom)
    const toDate = dateTo ? parseDoualaIsoDate(dateTo) : from
    if (from && toDate) {
      const gte = startOfDayDouala(from)
      const lte = endOfDayDouala(toDate)
      return { gte, lte: lte < gte ? endOfDayDouala(from) : lte }
    }
    return undefined
  }
  if (periode === 'today') {
    return { gte: startOfDayDouala(now), lte: endOfDayDouala(now) }
  }
  if (periode === 'yesterday') {
    const y = shiftDoualaDays(now, -1)
    return { gte: startOfDayDouala(y), lte: endOfDayDouala(y) }
  }
  if (periode === 'week') {
    return { gte: startOfWeekDouala(now), lte: endOfDayDouala(now) }
  }
  if (periode === 'month') {
    const p = startOfDayDouala(now)
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Africa/Douala',
      year: 'numeric',
      month: '2-digit',
    }).formatToParts(p)
    const year = Number(parts.find((x) => x.type === 'year')?.value)
    const month = Number(parts.find((x) => x.type === 'month')?.value)
    return {
      gte: zonedDateTimeToUtc(year, month, 1, 0, 0, 0, 0),
      lte: endOfDayDouala(now),
    }
  }
  return undefined
}

export async function listVisitesEligiblesParametres(params?: {
  q?: string
  onlyMissing?: boolean
  page?: number
  pageSize?: number
  /** today | yesterday | week | month | custom | all */
  periode?: string
  dateFrom?: string
  dateTo?: string
}): Promise<ListVisitesEligiblesParametresResult> {
  const pageSize = Math.min(
    100,
    Math.max(1, params?.pageSize ?? DEFAULT_PAGE_SIZE),
  )
  let page = Math.max(1, params?.page ?? 1)

  const empty = (): ListVisitesEligiblesParametresResult => ({
    items: [],
    total: 0,
    page: 1,
    pageSize,
  })

  const eligibleIds = await getVisiteIdsEligiblesParametres()
  if (eligibleIds.length === 0) return empty()

  const dateFilter = buildDateFilter(
    params?.periode,
    params?.dateFrom,
    params?.dateTo,
  )

  const rows = await prisma.visite.findMany({
    where: {
      id: { in: eligibleIds },
      ...(params?.onlyMissing ? { parametrePatient: { is: null } } : {}),
      ...(dateFilter ? { dateVisite: dateFilter } : {}),
    },
    include: {
      motif: { select: { libelle: true } },
      medecin: { select: { name: true } },
      parametrePatient: { select: { id: true } },
    },
    orderBy: { dateVisite: 'desc' },
  })

  const patientIds = [...new Set(rows.map((r) => r.patientId))]
  const patients = await prisma.patient.findMany({
    where: { id: { in: patientIds } },
    select: {
      id: true,
      patName: true,
      patSurname: true,
      sexe: true,
      nomJeuneFille: true,
      patDob: true,
    },
  })
  const patientMap = new Map(
    patients.map((p) => [
      p.id.toString(),
      {
        label: formatPatientIdentityLine(
          String(p.patName),
          String(p.patSurname),
          Number(p.sexe),
          p.nomJeuneFille != null && String(p.nomJeuneFille).trim() !== ''
            ? String(p.nomJeuneFille)
            : null,
        ),
        age: calculateAge(p.patDob.toISOString()),
      },
    ]),
  )

  let result: VisiteEligibleParametresRow[] = rows.map((v) => {
    const p = patientMap.get(v.patientId.toString())
    const age = p?.age ?? null
    return {
      id: v.id.toString(),
      patientId: v.patientId.toString(),
      patientLabel: p?.label ?? null,
      patientAge: age,
      isPediatrique: age != null && age < AGE_PEDIATRIQUE_MAX,
      motifLibelle: v.motif.libelle,
      medecinNom: v.medecin.name,
      dateVisite: v.dateVisite.toISOString(),
      statut: v.statut,
      parametresRemplis: !!v.parametrePatient,
    }
  })

  const q = params?.q?.trim().toLowerCase()
  if (q) {
    result = result.filter(
      (r) =>
        (r.patientLabel ?? '').toLowerCase().includes(q) ||
        r.motifLibelle.toLowerCase().includes(q) ||
        r.id.includes(q),
    )
  }

  const total = result.length
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  if (page > totalPages) page = totalPages
  const start = (page - 1) * pageSize

  return {
    items: result.slice(start, start + pageSize),
    total,
    page,
    pageSize,
  }
}

export async function getParametrePatientByVisiteId(
  visiteId: string,
): Promise<ParametrePatientFormContext | null> {
  if (!/^\d+$/.test(visiteId)) return null

  const vid = BigInt(visiteId)
  const visite = await prisma.visite.findUnique({
    where: { id: vid },
    include: {
      motif: { select: { libelle: true } },
      medecin: { select: { name: true } },
      parametrePatient: true,
    },
  })
  if (!visite) return null

  const patient = await prisma.patient.findUnique({
    where: { id: visite.patientId },
    select: {
      patName: true,
      patSurname: true,
      sexe: true,
      nomJeuneFille: true,
      patDob: true,
    },
  })

  const age = patient ? calculateAge(patient.patDob.toISOString()) : null
  const eligible = await isVisiteEligibleParametres(vid)

  return {
    visite: {
      id: visite.id.toString(),
      patientId: visite.patientId.toString(),
      patientLabel: patient
        ? formatPatientIdentityLine(
            String(patient.patName),
            String(patient.patSurname),
            Number(patient.sexe),
            patient.nomJeuneFille != null && String(patient.nomJeuneFille).trim() !== ''
              ? String(patient.nomJeuneFille)
              : null,
          )
        : null,
      patientAge: age,
      isPediatrique: age != null && age < AGE_PEDIATRIQUE_MAX,
      motifLibelle: visite.motif.libelle,
      medecinNom: visite.medecin.name,
      dateVisite: visite.dateVisite.toISOString(),
      statut: visite.statut,
    },
    parametre: visite.parametrePatient
      ? toParametreDetail(visite.parametrePatient)
      : null,
    eligible,
  }
}

export async function upsertParametrePatient(data: unknown) {
  const soft = parametrePatientBaseSchema
    .omit({ requirePediatrique: true })
    .safeParse(data)
  if (!soft.success) throw soft.error

  const visiteId = BigInt(soft.data.visiteId)

  const eligible = await isVisiteEligibleParametres(visiteId)
  if (!eligible) {
    throw new Error(
      'Cette visite n’est pas éligible : le reste patient (feuille ou facture) doit être soldé.',
    )
  }

  const visite = await prisma.visite.findUnique({
    where: { id: visiteId },
    select: { patientId: true, statut: true },
  })
  if (!visite) throw new Error('Visite introuvable.')

  const patient = await prisma.patient.findUnique({
    where: { id: visite.patientId },
    select: { patDob: true },
  })
  const age = patient ? calculateAge(patient.patDob.toISOString()) : null
  const isPediatrique = age != null && age < AGE_PEDIATRIQUE_MAX

  const parsed = parametrePatientUpsertSchema.parse({
    ...soft.data,
    requirePediatrique: isPediatrique,
  })

  const userId = await requireUserId()
  const imc = new Decimal(computeImc(parsed.poidsKg, parsed.tailleCm).toFixed(1))

  const payload = {
    userId,
    poidsKg: new Decimal(parsed.poidsKg),
    tailleCm: new Decimal(parsed.tailleCm),
    imc,
    pas: parsed.pas,
    pad: parsed.pad,
    pouls: parsed.pouls,
    temperatureC: new Decimal(parsed.temperatureC),
    nitrite: parsed.nitrite,
    sang: parsed.sang,
    leucocytes: parsed.leucocytes,
    proteine: parsed.proteine,
    cetones: parsed.cetones,
    ph: parsed.ph,
    sucre: parsed.sucre ?? null,
    perimetreCranien:
      isPediatrique && parsed.perimetreCranien != null
        ? new Decimal(parsed.perimetreCranien)
        : null,
    perimetreBrachial:
      isPediatrique && parsed.perimetreBrachial != null
        ? new Decimal(parsed.perimetreBrachial)
        : null,
    frequenceRespiratoire: isPediatrique ? parsed.frequenceRespiratoire ?? null : null,
    sao2: isPediatrique ? parsed.sao2 ?? null : null,
  }

  const row = await prisma.parametrePatient.upsert({
    where: { visiteId },
    create: { visiteId, ...payload },
    update: payload,
  })

  if (visite.statut !== 'TERMINEE') {
    await prisma.visite.update({
      where: { id: visiteId },
      data: { statut: 'EN_COURS', updatedAt: new Date() },
    })
  }

  return toSerializable(toParametreDetail(row))
}

/** Exposé pour calcul côté client (même formule). */
export async function previewImc(poidsKg: number, tailleCm: number) {
  return computeImc(poidsKg, tailleCm)
}

export type SalleAttenteRow = {
  id: string
  patientId: string
  patientLabel: string | null
  patientAge: number | null
  isPediatrique: boolean
  motifLibelle: string
  medecinNom: string
  medecinTitre: string | null
  dateVisite: string
  parametresAt: string | null
}

/** Patients en consultation (EN_COURS) avec paramètres déjà saisis — file d’attente médecins. */
export async function listSalleAttente(): Promise<SalleAttenteRow[]> {
  const rows = await prisma.visite.findMany({
    where: {
      statut: 'EN_COURS',
      parametrePatient: { isNot: null },
    },
    include: {
      motif: { select: { libelle: true } },
      medecin: { select: { name: true, titre: true } },
      parametrePatient: { select: { createdAt: true, updatedAt: true } },
    },
    orderBy: { dateVisite: 'asc' },
    take: 200,
  })

  const patientIds = [...new Set(rows.map((r) => r.patientId))]
  const patients = await prisma.patient.findMany({
    where: { id: { in: patientIds } },
    select: {
      id: true,
      patName: true,
      patSurname: true,
      sexe: true,
      nomJeuneFille: true,
      patDob: true,
    },
  })
  const patientMap = new Map(
    patients.map((p) => [
      p.id.toString(),
      {
        label: formatPatientIdentityLine(
          String(p.patName),
          String(p.patSurname),
          Number(p.sexe),
          p.nomJeuneFille != null && String(p.nomJeuneFille).trim() !== ''
            ? String(p.nomJeuneFille)
            : null,
        ),
        age: calculateAge(p.patDob.toISOString()),
      },
    ]),
  )

  const mapped: SalleAttenteRow[] = rows.map((v) => {
    const p = patientMap.get(v.patientId.toString())
    const age = p?.age ?? null
    const parametresAt =
      v.parametrePatient?.updatedAt?.toISOString() ??
      v.parametrePatient?.createdAt?.toISOString() ??
      null
    return {
      id: v.id.toString(),
      patientId: v.patientId.toString(),
      patientLabel: p?.label ?? null,
      patientAge: age,
      isPediatrique: age != null && age < AGE_PEDIATRIQUE_MAX,
      motifLibelle: v.motif.libelle,
      medecinNom: v.medecin.name,
      medecinTitre: v.medecin.titre,
      dateVisite: v.dateVisite.toISOString(),
      parametresAt,
    }
  })

  // File d’attente : plus ancien en paramètres d’abord
  mapped.sort((a, b) => {
    const ta = a.parametresAt ? new Date(a.parametresAt).getTime() : 0
    const tb = b.parametresAt ? new Date(b.parametresAt).getTime() : 0
    return ta - tb
  })

  return mapped
}

/** Compteur léger pour badge nav Salle d’attente. */
export async function getSalleAttenteNavCount(): Promise<number> {
  try {
    return await prisma.visite.count({
      where: {
        statut: 'EN_COURS',
        parametrePatient: { isNot: null },
      },
    })
  } catch {
    return 0
  }
}
