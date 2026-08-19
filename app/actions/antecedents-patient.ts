'use server'

import { Decimal } from '@prisma/client/runtime/library'
import { prisma } from '@/lib/prisma'
import { toSerializable } from '@/lib/json-bigint'
import { formatPatientIdentityLine, calculateAge } from '@/lib/formatting'
import { requireUserId } from '@/lib/auth/session'
import {
  getVisiteIdsEligiblesAntecedents,
  isVisiteEligibleAntecedents,
} from '@/lib/medical/eligibilite-antecedents'
import { AGE_PEDIATRIQUE_MAX } from '@/lib/medical/bandelette'
import { antecedentPatientUpsertSchema } from '@/lib/validations/antecedent-patient'
import {
  endOfDayDouala,
  parseDoualaIsoDate,
  shiftDoualaDays,
  startOfDayDouala,
  startOfWeekDouala,
  zonedDateTimeToUtc,
} from '@/lib/timezone'

export type VisiteEligibleAntecedentsRow = {
  id: string
  patientId: string
  patientLabel: string | null
  patientAge: number | null
  isPediatrique: boolean
  motifLibelle: string
  medecinNom: string
  dateVisite: string
  statut: string
  antecedentsRemplis: boolean
}

export type AntecedentPatientDetail = {
  id: string
  visiteId: string
  situationMatrimoniale: string | null
  nbrCigarJour: number | null
  nbrAnneeCigar: number | null
  alcool: string | null
  drogue: string | null
  activitePhysique: string | null
  poidsKg: string | null
  tailleCm: string | null
  tourTaille: string | null
  pointure: number | null
  groupeSanguin: string | null
  imc: string | null
  pa: string | null
  familDiabete: string | null
  familHta: string | null
  familTrombo: string | null
  familCardioAvc: string | null
  familDysthyroidie: string | null
  familCancer: string | null
  familAutres: string | null
  menarches: string | null
  cyclesReguliers: string | null
  nbreJoursCycle: string | null
  nbreJoursRegles: string | null
  nbreChanges: string | null
  menopause: string | null
  traitMenopause: string | null
  dernierFcv: string | null
  derniereMammo: string | null
  medHta: string | null
  medDiabete: string | null
  medDyslipidemie: string | null
  medNotes: string | null
  chirAppendicectomie: string | null
  chirPelvienne: string | null
  chirNotes: string | null
  allMedicaments: string | null
  allRespiratoires: string | null
  allContact: string | null
  allAlimentaires: string | null
  notesTransfusion: string | null
  gynGestite: string | null
  gynParite: string | null
  gynIst: string | null
  gynConisation: string | null
  gynKystes: string | null
  gynMyomes: string | null
  gynNotes: string | null
  createdAt: string | null
  updatedAt: string | null
}

export type AntecedentFromParametres = {
  poidsKg: string | null
  imc: string | null
  /** Date/heure de prise (updatedAt, sinon createdAt). */
  takenAt: string | null
  sourceVisiteId: string
  fromCurrentVisite: boolean
}

export type AntecedentPatientFormContext = {
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
  antecedent: AntecedentPatientDetail | null
  eligible: boolean
  /** Poids / IMC issus des paramètres (visite courante, sinon dernière fiche patient). */
  fromParametres: AntecedentFromParametres | null
}

function numStr(d: Decimal | number | null | undefined): string | null {
  if (d == null) return null
  return String(d)
}

function toAntecedentDetail(row: {
  id: bigint
  visiteId: bigint
  situationMatrimoniale: string | null
  nbrCigarJour: number | null
  nbrAnneeCigar: number | null
  alcool: string | null
  drogue: string | null
  activitePhysique: string | null
  poidsKg: Decimal | null
  tailleCm: Decimal | null
  tourTaille: string | null
  pointure: number | null
  groupeSanguin: string | null
  imc: string | null
  pa: string | null
  familDiabete: string | null
  familHta: string | null
  familTrombo: string | null
  familCardioAvc: string | null
  familDysthyroidie: string | null
  familCancer: string | null
  familAutres: string | null
  menarches: string | null
  cyclesReguliers: string | null
  nbreJoursCycle: string | null
  nbreJoursRegles: string | null
  nbreChanges: string | null
  menopause: string | null
  traitMenopause: string | null
  dernierFcv: string | null
  derniereMammo: string | null
  medHta: string | null
  medDiabete: string | null
  medDyslipidemie: string | null
  medNotes: string | null
  chirAppendicectomie: string | null
  chirPelvienne: string | null
  chirNotes: string | null
  allMedicaments: string | null
  allRespiratoires: string | null
  allContact: string | null
  allAlimentaires: string | null
  notesTransfusion: string | null
  gynGestite: string | null
  gynParite: string | null
  gynIst: string | null
  gynConisation: string | null
  gynKystes: string | null
  gynMyomes: string | null
  gynNotes: string | null
  createdAt: Date | null
  updatedAt: Date | null
}): AntecedentPatientDetail {
  return {
    id: row.id.toString(),
    visiteId: row.visiteId.toString(),
    situationMatrimoniale: row.situationMatrimoniale,
    nbrCigarJour: row.nbrCigarJour,
    nbrAnneeCigar: row.nbrAnneeCigar,
    alcool: row.alcool,
    drogue: row.drogue,
    activitePhysique: row.activitePhysique,
    poidsKg: numStr(row.poidsKg),
    tailleCm: numStr(row.tailleCm),
    tourTaille: row.tourTaille,
    pointure: row.pointure,
    groupeSanguin: row.groupeSanguin,
    imc: row.imc,
    pa: row.pa,
    familDiabete: row.familDiabete,
    familHta: row.familHta,
    familTrombo: row.familTrombo,
    familCardioAvc: row.familCardioAvc,
    familDysthyroidie: row.familDysthyroidie,
    familCancer: row.familCancer,
    familAutres: row.familAutres,
    menarches: row.menarches,
    cyclesReguliers: row.cyclesReguliers,
    nbreJoursCycle: row.nbreJoursCycle,
    nbreJoursRegles: row.nbreJoursRegles,
    nbreChanges: row.nbreChanges,
    menopause: row.menopause,
    traitMenopause: row.traitMenopause,
    dernierFcv: row.dernierFcv,
    derniereMammo: row.derniereMammo,
    medHta: row.medHta,
    medDiabete: row.medDiabete,
    medDyslipidemie: row.medDyslipidemie,
    medNotes: row.medNotes,
    chirAppendicectomie: row.chirAppendicectomie,
    chirPelvienne: row.chirPelvienne,
    chirNotes: row.chirNotes,
    allMedicaments: row.allMedicaments,
    allRespiratoires: row.allRespiratoires,
    allContact: row.allContact,
    allAlimentaires: row.allAlimentaires,
    notesTransfusion: row.notesTransfusion,
    gynGestite: row.gynGestite,
    gynParite: row.gynParite,
    gynIst: row.gynIst,
    gynConisation: row.gynConisation,
    gynKystes: row.gynKystes,
    gynMyomes: row.gynMyomes,
    gynNotes: row.gynNotes,
    createdAt: row.createdAt?.toISOString() ?? null,
    updatedAt: row.updatedAt?.toISOString() ?? null,
  }
}

export type ListVisitesEligiblesAntecedentsResult = {
  items: VisiteEligibleAntecedentsRow[]
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

export async function listVisitesEligiblesAntecedents(params?: {
  q?: string
  onlyMissing?: boolean
  page?: number
  pageSize?: number
  periode?: string
  dateFrom?: string
  dateTo?: string
}): Promise<ListVisitesEligiblesAntecedentsResult> {
  const pageSize = Math.min(
    100,
    Math.max(1, params?.pageSize ?? DEFAULT_PAGE_SIZE),
  )
  let page = Math.max(1, params?.page ?? 1)

  const empty = (): ListVisitesEligiblesAntecedentsResult => ({
    items: [],
    total: 0,
    page: 1,
    pageSize,
  })

  const eligibleIds = await getVisiteIdsEligiblesAntecedents()
  if (eligibleIds.length === 0) return empty()

  const dateFilter = buildDateFilter(
    params?.periode,
    params?.dateFrom,
    params?.dateTo,
  )

  const rows = await prisma.visite.findMany({
    where: {
      id: { in: eligibleIds },
      ...(params?.onlyMissing ? { antecedentPatient: { is: null } } : {}),
      ...(dateFilter ? { dateVisite: dateFilter } : {}),
    },
    include: {
      motif: { select: { libelle: true } },
      medecin: { select: { name: true } },
      antecedentPatient: { select: { id: true } },
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

  let result: VisiteEligibleAntecedentsRow[] = rows.map((v) => {
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
      antecedentsRemplis: !!v.antecedentPatient,
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

function parametreTakenAt(
  row: { updatedAt: Date | null; createdAt: Date | null },
): string | null {
  const at = row.updatedAt ?? row.createdAt
  return at ? at.toISOString() : null
}

async function loadParametresForAntecedent(
  visiteId: bigint,
  patientId: bigint,
): Promise<AntecedentFromParametres | null> {
  const select = {
    poidsKg: true,
    imc: true,
    visiteId: true,
    createdAt: true,
    updatedAt: true,
  } as const

  const current = await prisma.parametrePatient.findUnique({
    where: { visiteId },
    select,
  })
  if (current) {
    return {
      poidsKg: String(current.poidsKg),
      imc: String(current.imc),
      takenAt: parametreTakenAt(current),
      sourceVisiteId: current.visiteId.toString(),
      fromCurrentVisite: true,
    }
  }

  const latest = await prisma.parametrePatient.findFirst({
    where: { visite: { patientId } },
    orderBy: { visite: { dateVisite: 'desc' } },
    select,
  })
  if (!latest) return null

  return {
    poidsKg: String(latest.poidsKg),
    imc: String(latest.imc),
    takenAt: parametreTakenAt(latest),
    sourceVisiteId: latest.visiteId.toString(),
    fromCurrentVisite: false,
  }
}

export async function getAntecedentPatientByVisiteId(
  visiteId: string,
): Promise<AntecedentPatientFormContext | null> {
  if (!/^\d+$/.test(visiteId)) return null

  const vid = BigInt(visiteId)
  const visite = await prisma.visite.findUnique({
    where: { id: vid },
    include: {
      motif: { select: { libelle: true } },
      medecin: { select: { name: true } },
      antecedentPatient: true,
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
  const eligible = await isVisiteEligibleAntecedents(vid)
  const fromParametres = await loadParametresForAntecedent(vid, visite.patientId)

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
    antecedent: visite.antecedentPatient
      ? toAntecedentDetail(visite.antecedentPatient)
      : null,
    eligible,
    fromParametres,
  }
}

function toDecimalOrNull(v: number | null | undefined): Decimal | null {
  if (v == null || !Number.isFinite(v)) return null
  return new Decimal(v)
}

export async function upsertAntecedentPatient(data: unknown) {
  const parsed = antecedentPatientUpsertSchema.safeParse(data)
  if (!parsed.success) throw parsed.error

  const visiteId = BigInt(parsed.data.visiteId)

  const eligible = await isVisiteEligibleAntecedents(visiteId)
  if (!eligible) {
    throw new Error(
      'Cette visite n’est pas éligible : le reste patient (feuille ou facture) doit être soldé.',
    )
  }

  const visite = await prisma.visite.findUnique({
    where: { id: visiteId },
    select: { id: true, patientId: true },
  })
  if (!visite) throw new Error('Visite introuvable.')

  const userId = await requireUserId()
  const d = parsed.data
  const fromParametres = await loadParametresForAntecedent(
    visiteId,
    visite.patientId,
  )

  // PA = paquet-années = (cig/jour × années) / 20
  let paValue = d.pa ?? null
  if (d.nbrCigarJour != null && d.nbrAnneeCigar != null) {
    const pa = (d.nbrCigarJour * d.nbrAnneeCigar) / 20
    if (Number.isFinite(pa)) {
      paValue = String(Math.round(pa * 100) / 100)
    }
  }

  const payload = {
    userId,
    situationMatrimoniale: d.situationMatrimoniale ?? null,
    nbrCigarJour: d.nbrCigarJour ?? null,
    nbrAnneeCigar: d.nbrAnneeCigar ?? null,
    alcool: d.alcool ?? null,
    drogue: d.drogue ?? null,
    activitePhysique: d.activitePhysique ?? null,
    poidsKg:
      fromParametres?.poidsKg != null
        ? toDecimalOrNull(Number(fromParametres.poidsKg))
        : toDecimalOrNull(d.poidsKg ?? null),
    tailleCm: toDecimalOrNull(d.tailleCm ?? null),
    tourTaille: d.tourTaille ?? null,
    pointure: d.pointure ?? null,
    groupeSanguin: d.groupeSanguin ?? null,
    imc: fromParametres?.imc ?? d.imc ?? null,
    pa: paValue,
    familDiabete: d.familDiabete ?? null,
    familHta: d.familHta ?? null,
    familTrombo: d.familTrombo ?? null,
    familCardioAvc: d.familCardioAvc ?? null,
    familDysthyroidie: d.familDysthyroidie ?? null,
    familCancer: d.familCancer ?? null,
    familAutres: d.familAutres ?? null,
    menarches: d.menarches ?? null,
    cyclesReguliers: d.cyclesReguliers ?? null,
    nbreJoursCycle: d.nbreJoursCycle ?? null,
    nbreJoursRegles: d.nbreJoursRegles ?? null,
    nbreChanges: d.nbreChanges ?? null,
    menopause: d.menopause ?? null,
    traitMenopause: d.traitMenopause ?? null,
    dernierFcv: d.dernierFcv ?? null,
    derniereMammo: d.derniereMammo ?? null,
    medHta: d.medHta ?? null,
    medDiabete: d.medDiabete ?? null,
    medDyslipidemie: d.medDyslipidemie ?? null,
    medNotes: d.medNotes ?? null,
    chirAppendicectomie: d.chirAppendicectomie ?? null,
    chirPelvienne: d.chirPelvienne ?? null,
    chirNotes: d.chirNotes ?? null,
    allMedicaments: d.allMedicaments ?? null,
    allRespiratoires: d.allRespiratoires ?? null,
    allContact: d.allContact ?? null,
    allAlimentaires: d.allAlimentaires ?? null,
    notesTransfusion: d.notesTransfusion ?? null,
    gynGestite: d.gynGestite ?? null,
    gynParite: d.gynParite ?? null,
    gynIst: d.gynIst ?? null,
    gynConisation: d.gynConisation ?? null,
    gynKystes: d.gynKystes ?? null,
    gynMyomes: d.gynMyomes ?? null,
    gynNotes: d.gynNotes ?? null,
  }

  const row = await prisma.antecedentPatient.upsert({
    where: { visiteId },
    create: { visiteId, ...payload },
    update: payload,
  })

  return toSerializable(toAntecedentDetail(row))
}
