'use server'

import { prisma } from '@/lib/prisma'
import { toSerializable } from '@/lib/json-bigint'
import { formatPatientIdentityLine, calculateAge } from '@/lib/formatting'
import { requireUserId } from '@/lib/auth/session'
import {
  getVisiteIdsEligiblesObsGyneco,
  isVisiteEligibleObsGyneco,
  SEXE_FEMININ,
} from '@/lib/medical/eligibilite-obs-gyneco'
import { AGE_PEDIATRIQUE_MAX } from '@/lib/medical/bandelette'
import { observationGynecologiqueUpsertSchema } from '@/lib/validations/observation-gynecologique'
import {
  endOfDayDouala,
  parseDoualaIsoDate,
  shiftDoualaDays,
  startOfDayDouala,
  startOfWeekDouala,
  zonedDateTimeToUtc,
} from '@/lib/timezone'

export type VisiteEligibleObsGynecoRow = {
  id: string
  patientId: string
  patientLabel: string | null
  patientAge: number | null
  isPediatrique: boolean
  motifLibelle: string
  medecinNom: string
  dateVisite: string
  statut: string
  observationRemplie: boolean
}

export type ObservationGynecologiqueDetail = {
  id: string
  visiteId: string
  typeConsult: string | null
  motifConsult: string | null
  ddr: string | null
  contraception: string | null
  dernierFcv: string | null
  derniereMammo: string | null
  menopause: string | null
  thm: string | null
  histMaladie: string | null
  modeVieSexuelle: string | null
  menorragies: string | null
  metrorragies: string | null
  dysmenorrhees: string | null
  algiesPelviennes: string | null
  dyspareunies: string | null
  prurit: string | null
  noteInterrogatoire: string | null
  seins: string | null
  inspection: string | null
  palpation: string | null
  eruptionGenitale: string | null
  leucorrhees: string | null
  metrorragiesExam: string | null
  col: string | null
  vagin: string | null
  auscultation: string | null
  toucherVaginal: string | null
  culsSacLateraux: string | null
  culSacDouglas: string | null
  notePhysique: string | null
  echoPelvienne: string | null
  hypothese1: string | null
  hypothese2: string | null
  hypothese3: string | null
  createdAt: string | null
  updatedAt: string | null
}

export type ObservationGynecologiqueFormContext = {
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
  observation: ObservationGynecologiqueDetail | null
  eligible: boolean
}

function toDetail(row: {
  id: bigint
  visiteId: bigint
  typeConsult: string | null
  motifConsult: string | null
  ddr: string | null
  contraception: string | null
  dernierFcv: string | null
  derniereMammo: string | null
  menopause: string | null
  thm: string | null
  histMaladie: string | null
  modeVieSexuelle: string | null
  menorragies: string | null
  metrorragies: string | null
  dysmenorrhees: string | null
  algiesPelviennes: string | null
  dyspareunies: string | null
  prurit: string | null
  noteInterrogatoire: string | null
  seins: string | null
  inspection: string | null
  palpation: string | null
  eruptionGenitale: string | null
  leucorrhees: string | null
  metrorragiesExam: string | null
  col: string | null
  vagin: string | null
  auscultation: string | null
  toucherVaginal: string | null
  culsSacLateraux: string | null
  culSacDouglas: string | null
  notePhysique: string | null
  echoPelvienne: string | null
  hypothese1: string | null
  hypothese2: string | null
  hypothese3: string | null
  createdAt: Date | null
  updatedAt: Date | null
}): ObservationGynecologiqueDetail {
  return {
    id: row.id.toString(),
    visiteId: row.visiteId.toString(),
    typeConsult: row.typeConsult,
    motifConsult: row.motifConsult,
    ddr: row.ddr,
    contraception: row.contraception,
    dernierFcv: row.dernierFcv,
    derniereMammo: row.derniereMammo,
    menopause: row.menopause,
    thm: row.thm,
    histMaladie: row.histMaladie,
    modeVieSexuelle: row.modeVieSexuelle,
    menorragies: row.menorragies,
    metrorragies: row.metrorragies,
    dysmenorrhees: row.dysmenorrhees,
    algiesPelviennes: row.algiesPelviennes,
    dyspareunies: row.dyspareunies,
    prurit: row.prurit,
    noteInterrogatoire: row.noteInterrogatoire,
    seins: row.seins,
    inspection: row.inspection,
    palpation: row.palpation,
    eruptionGenitale: row.eruptionGenitale,
    leucorrhees: row.leucorrhees,
    metrorragiesExam: row.metrorragiesExam,
    col: row.col,
    vagin: row.vagin,
    auscultation: row.auscultation,
    toucherVaginal: row.toucherVaginal,
    culsSacLateraux: row.culsSacLateraux,
    culSacDouglas: row.culSacDouglas,
    notePhysique: row.notePhysique,
    echoPelvienne: row.echoPelvienne,
    hypothese1: row.hypothese1,
    hypothese2: row.hypothese2,
    hypothese3: row.hypothese3,
    createdAt: row.createdAt?.toISOString() ?? null,
    updatedAt: row.updatedAt?.toISOString() ?? null,
  }
}

export type ListVisitesEligiblesObsGynecoResult = {
  items: VisiteEligibleObsGynecoRow[]
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

export async function listVisitesEligiblesObsGyneco(params?: {
  q?: string
  onlyMissing?: boolean
  page?: number
  pageSize?: number
  periode?: string
  dateFrom?: string
  dateTo?: string
}): Promise<ListVisitesEligiblesObsGynecoResult> {
  const pageSize = Math.min(
    100,
    Math.max(1, params?.pageSize ?? DEFAULT_PAGE_SIZE),
  )
  let page = Math.max(1, params?.page ?? 1)

  const empty = (): ListVisitesEligiblesObsGynecoResult => ({
    items: [],
    total: 0,
    page: 1,
    pageSize,
  })

  const eligibleIds = await getVisiteIdsEligiblesObsGyneco()
  if (eligibleIds.length === 0) return empty()

  const dateFilter = buildDateFilter(
    params?.periode,
    params?.dateFrom,
    params?.dateTo,
  )

  const rows = await prisma.visite.findMany({
    where: {
      id: { in: eligibleIds },
      ...(params?.onlyMissing
        ? { observationGynecologique: { is: null } }
        : {}),
      ...(dateFilter ? { dateVisite: dateFilter } : {}),
    },
    include: {
      motif: { select: { libelle: true } },
      medecin: { select: { name: true } },
      observationGynecologique: { select: { id: true } },
    },
    orderBy: { dateVisite: 'desc' },
  })

  const patientIds = [...new Set(rows.map((r) => r.patientId))]
  const patients = await prisma.patient.findMany({
    where: { id: { in: patientIds }, sexe: SEXE_FEMININ },
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

  let result: VisiteEligibleObsGynecoRow[] = rows
    .filter((v) => patientMap.has(v.patientId.toString()))
    .map((v) => {
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
        observationRemplie: !!v.observationGynecologique,
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

export async function getObservationGynecologiqueByVisiteId(
  visiteId: string,
): Promise<ObservationGynecologiqueFormContext | null> {
  if (!/^\d+$/.test(visiteId)) return null

  const vid = BigInt(visiteId)
  const visite = await prisma.visite.findUnique({
    where: { id: vid },
    include: {
      motif: { select: { libelle: true } },
      medecin: { select: { name: true } },
      observationGynecologique: true,
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
  const eligible = await isVisiteEligibleObsGyneco(vid)

  return {
    visite: {
      id: visite.id.toString(),
      patientId: visite.patientId.toString(),
      patientLabel: patient
        ? formatPatientIdentityLine(
            String(patient.patName),
            String(patient.patSurname),
            Number(patient.sexe),
            patient.nomJeuneFille != null &&
              String(patient.nomJeuneFille).trim() !== ''
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
    observation: visite.observationGynecologique
      ? toDetail(visite.observationGynecologique)
      : null,
    eligible,
  }
}

export async function upsertObservationGynecologique(data: unknown) {
  const parsed = observationGynecologiqueUpsertSchema.safeParse(data)
  if (!parsed.success) throw parsed.error

  const visiteId = BigInt(parsed.data.visiteId)

  const eligible = await isVisiteEligibleObsGyneco(visiteId)
  if (!eligible) {
    throw new Error(
      'Cette visite n’est pas éligible : patiente féminine et reste patient (feuille ou facture) soldé requis.',
    )
  }

  const visite = await prisma.visite.findUnique({
    where: { id: visiteId },
    select: { id: true },
  })
  if (!visite) throw new Error('Visite introuvable.')

  const userId = await requireUserId()
  const d = parsed.data

  const payload = {
    userId,
    typeConsult: d.typeConsult ?? null,
    motifConsult: d.motifConsult ?? null,
    ddr: d.ddr ?? null,
    contraception: d.contraception ?? null,
    dernierFcv: d.dernierFcv ?? null,
    derniereMammo: d.derniereMammo ?? null,
    menopause: d.menopause ?? null,
    thm: d.thm ?? null,
    histMaladie: d.histMaladie ?? null,
    modeVieSexuelle: d.modeVieSexuelle ?? null,
    menorragies: d.menorragies ?? null,
    metrorragies: d.metrorragies ?? null,
    dysmenorrhees: d.dysmenorrhees ?? null,
    algiesPelviennes: d.algiesPelviennes ?? null,
    dyspareunies: d.dyspareunies ?? null,
    prurit: d.prurit ?? null,
    noteInterrogatoire: d.noteInterrogatoire ?? null,
    seins: d.seins ?? null,
    inspection: d.inspection ?? null,
    palpation: d.palpation ?? null,
    eruptionGenitale: d.eruptionGenitale ?? null,
    leucorrhees: d.leucorrhees ?? null,
    metrorragiesExam: d.metrorragiesExam ?? null,
    col: d.col ?? null,
    vagin: d.vagin ?? null,
    auscultation: d.auscultation ?? null,
    toucherVaginal: d.toucherVaginal ?? null,
    culsSacLateraux: d.culsSacLateraux ?? null,
    culSacDouglas: d.culSacDouglas ?? null,
    notePhysique: d.notePhysique ?? null,
    echoPelvienne: d.echoPelvienne ?? null,
    hypothese1: d.hypothese1 ?? null,
    hypothese2: d.hypothese2 ?? null,
    hypothese3: d.hypothese3 ?? null,
  }

  const row = await prisma.observationGynecologique.upsert({
    where: { visiteId },
    create: { visiteId, ...payload },
    update: payload,
  })

  return toSerializable(toDetail(row))
}
