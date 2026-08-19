'use server'

import { prisma } from '@/lib/prisma'
import { toSerializable } from '@/lib/json-bigint'
import { formatPatientIdentityLine, calculateAge } from '@/lib/formatting'
import { requireUserId } from '@/lib/auth/session'
import {
  getVisiteIdsEligiblesObsObstetricale,
  isVisiteEligibleObsObstetricale,
} from '@/lib/medical/eligibilite-obs-obstetricale'
import { SEXE_FEMININ } from '@/lib/medical/eligibilite-obs-gyneco'
import { AGE_PEDIATRIQUE_MAX } from '@/lib/medical/bandelette'
import { observationObstetricaleUpsertSchema } from '@/lib/validations/observation-obstetricale'
import {
  endOfDayDouala,
  parseDoualaIsoDate,
  shiftDoualaDays,
  startOfDayDouala,
  startOfWeekDouala,
  zonedDateTimeToUtc,
} from '@/lib/timezone'

export type VisiteEligibleObsObstetricaleRow = {
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

export type ObservationObstetricaleDetail = {
  id: string
  visiteId: string
  typeObservation: string | null
  motifConsult: string | null
  ddr: string | null
  dateDebutGrossesse: string | null
  histMaladie: string | null
  mouvementsFoetaux: string | null
  contractions: string | null
  ressentiesDouloureuses: string | null
  endRessenties: string | null
  perteLiquideAmnio: string | null
  pruritVaginal: string | null
  pruritNu: string | null
  signesHta: string | null
  glasgow: string | null
  cephalees: string | null
  endCephalees: string | null
  oedemesMi: string | null
  oedemesMains: string | null
  oedemesVisage: string | null
  barreEpigastrique: string | null
  obnubilation: string | null
  troublesVigilance: string | null
  noteInterrogatoire: string | null
  hauteurUterineCm: string | null
  consistanceUterine: string | null
  malformationUterine: string | null
  speculum: string | null
  metrorragies: string | null
  perteLiquideTarnier: string | null
  aspectLeucorrhees: string | null
  cdsLateraux: string | null
  col: string | null
  presentation: string | null
  cdsDouglas: string | null
  bishop: string | null
  noteToucherVaginal: string | null
  echoObstetricale: string | null
  hypothese1: string | null
  hypothese2: string | null
  hypothese3: string | null
  createdAt: string | null
  updatedAt: string | null
}

export type VisiteObsObstetricaleSibling = {
  id: string
  dateVisite: string
  observationRemplie: boolean
  motifConsult: string | null
}

export type ObservationObstetricaleFormContext = {
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
  observation: ObservationObstetricaleDetail | null
  eligible: boolean
  /** Autres visites de la même patiente (avec ou sans fiche) */
  visitesPatiente: VisiteObsObstetricaleSibling[]
}

function toDetail(row: {
  id: bigint
  visiteId: bigint
  typeObservation: string | null
  motifConsult: string | null
  ddr: string | null
  dateDebutGrossesse: string | null
  histMaladie: string | null
  mouvementsFoetaux: string | null
  contractions: string | null
  ressentiesDouloureuses: string | null
  endRessenties: string | null
  perteLiquideAmnio: string | null
  pruritVaginal: string | null
  pruritNu: string | null
  signesHta: string | null
  glasgow: string | null
  cephalees: string | null
  endCephalees: string | null
  oedemesMi: string | null
  oedemesMains: string | null
  oedemesVisage: string | null
  barreEpigastrique: string | null
  obnubilation: string | null
  troublesVigilance: string | null
  noteInterrogatoire: string | null
  hauteurUterineCm: string | null
  consistanceUterine: string | null
  malformationUterine: string | null
  speculum: string | null
  metrorragies: string | null
  perteLiquideTarnier: string | null
  aspectLeucorrhees: string | null
  cdsLateraux: string | null
  col: string | null
  presentation: string | null
  cdsDouglas: string | null
  bishop: string | null
  noteToucherVaginal: string | null
  echoObstetricale: string | null
  hypothese1: string | null
  hypothese2: string | null
  hypothese3: string | null
  createdAt: Date | null
  updatedAt: Date | null
}): ObservationObstetricaleDetail {
  return {
    id: row.id.toString(),
    visiteId: row.visiteId.toString(),
    typeObservation: row.typeObservation,
    motifConsult: row.motifConsult,
    ddr: row.ddr,
    dateDebutGrossesse: row.dateDebutGrossesse,
    histMaladie: row.histMaladie,
    mouvementsFoetaux: row.mouvementsFoetaux,
    contractions: row.contractions,
    ressentiesDouloureuses: row.ressentiesDouloureuses,
    endRessenties: row.endRessenties,
    perteLiquideAmnio: row.perteLiquideAmnio,
    pruritVaginal: row.pruritVaginal,
    pruritNu: row.pruritNu,
    signesHta: row.signesHta,
    glasgow: row.glasgow,
    cephalees: row.cephalees,
    endCephalees: row.endCephalees,
    oedemesMi: row.oedemesMi,
    oedemesMains: row.oedemesMains,
    oedemesVisage: row.oedemesVisage,
    barreEpigastrique: row.barreEpigastrique,
    obnubilation: row.obnubilation,
    troublesVigilance: row.troublesVigilance,
    noteInterrogatoire: row.noteInterrogatoire,
    hauteurUterineCm: row.hauteurUterineCm,
    consistanceUterine: row.consistanceUterine,
    malformationUterine: row.malformationUterine,
    speculum: row.speculum,
    metrorragies: row.metrorragies,
    perteLiquideTarnier: row.perteLiquideTarnier,
    aspectLeucorrhees: row.aspectLeucorrhees,
    cdsLateraux: row.cdsLateraux,
    col: row.col,
    presentation: row.presentation,
    cdsDouglas: row.cdsDouglas,
    bishop: row.bishop,
    noteToucherVaginal: row.noteToucherVaginal,
    echoObstetricale: row.echoObstetricale,
    hypothese1: row.hypothese1,
    hypothese2: row.hypothese2,
    hypothese3: row.hypothese3,
    createdAt: row.createdAt?.toISOString() ?? null,
    updatedAt: row.updatedAt?.toISOString() ?? null,
  }
}

export type ListVisitesEligiblesObsObstetricaleResult = {
  items: VisiteEligibleObsObstetricaleRow[]
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

export async function listVisitesEligiblesObsObstetricale(params?: {
  q?: string
  onlyMissing?: boolean
  page?: number
  pageSize?: number
  periode?: string
  dateFrom?: string
  dateTo?: string
}): Promise<ListVisitesEligiblesObsObstetricaleResult> {
  const pageSize = Math.min(
    100,
    Math.max(1, params?.pageSize ?? DEFAULT_PAGE_SIZE),
  )
  let page = Math.max(1, params?.page ?? 1)

  const empty = (): ListVisitesEligiblesObsObstetricaleResult => ({
    items: [],
    total: 0,
    page: 1,
    pageSize,
  })

  const eligibleIds = await getVisiteIdsEligiblesObsObstetricale()
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
        ? { observationObstetricale: { is: null } }
        : {}),
      ...(dateFilter ? { dateVisite: dateFilter } : {}),
    },
    include: {
      motif: { select: { libelle: true } },
      medecin: { select: { name: true } },
      observationObstetricale: { select: { id: true } },
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

  let result: VisiteEligibleObsObstetricaleRow[] = rows
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
        observationRemplie: !!v.observationObstetricale,
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

export async function getObservationObstetricaleByVisiteId(
  visiteId: string,
): Promise<ObservationObstetricaleFormContext | null> {
  if (!/^\d+$/.test(visiteId)) return null

  const vid = BigInt(visiteId)
  const visite = await prisma.visite.findUnique({
    where: { id: vid },
    include: {
      motif: { select: { libelle: true } },
      medecin: { select: { name: true } },
      observationObstetricale: true,
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
  const eligible = await isVisiteEligibleObsObstetricale(vid)

  const siblings = await prisma.visite.findMany({
    where: { patientId: visite.patientId },
    select: {
      id: true,
      dateVisite: true,
      observationObstetricale: {
        select: { id: true, motifConsult: true },
      },
    },
    orderBy: { dateVisite: 'desc' },
  })

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
    observation: visite.observationObstetricale
      ? toDetail(visite.observationObstetricale)
      : null,
    eligible,
    visitesPatiente: siblings.map((s) => ({
      id: s.id.toString(),
      dateVisite: s.dateVisite.toISOString(),
      observationRemplie: !!s.observationObstetricale,
      motifConsult: s.observationObstetricale?.motifConsult ?? null,
    })),
  }
}

export async function upsertObservationObstetricale(data: unknown) {
  const parsed = observationObstetricaleUpsertSchema.safeParse(data)
  if (!parsed.success) throw parsed.error

  const visiteId = BigInt(parsed.data.visiteId)

  const eligible = await isVisiteEligibleObsObstetricale(visiteId)
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
    typeObservation: d.typeObservation ?? null,
    motifConsult: d.motifConsult ?? null,
    ddr: d.ddr ?? null,
    dateDebutGrossesse: d.dateDebutGrossesse ?? null,
    histMaladie: d.histMaladie ?? null,
    mouvementsFoetaux: d.mouvementsFoetaux ?? null,
    contractions: d.contractions ?? null,
    ressentiesDouloureuses: d.ressentiesDouloureuses ?? null,
    endRessenties: d.endRessenties ?? null,
    perteLiquideAmnio: d.perteLiquideAmnio ?? null,
    pruritVaginal: d.pruritVaginal ?? null,
    pruritNu: d.pruritNu ?? null,
    signesHta: d.signesHta ?? null,
    glasgow: d.glasgow ?? null,
    cephalees: d.cephalees ?? null,
    endCephalees: d.endCephalees ?? null,
    oedemesMi: d.oedemesMi ?? null,
    oedemesMains: d.oedemesMains ?? null,
    oedemesVisage: d.oedemesVisage ?? null,
    barreEpigastrique: d.barreEpigastrique ?? null,
    obnubilation: d.obnubilation ?? null,
    troublesVigilance: d.troublesVigilance ?? null,
    noteInterrogatoire: d.noteInterrogatoire ?? null,
    hauteurUterineCm: d.hauteurUterineCm ?? null,
    consistanceUterine: d.consistanceUterine ?? null,
    malformationUterine: d.malformationUterine ?? null,
    speculum: d.speculum ?? null,
    metrorragies: d.metrorragies ?? null,
    perteLiquideTarnier: d.perteLiquideTarnier ?? null,
    aspectLeucorrhees: d.aspectLeucorrhees ?? null,
    cdsLateraux: d.cdsLateraux ?? null,
    col: d.col ?? null,
    presentation: d.presentation ?? null,
    cdsDouglas: d.cdsDouglas ?? null,
    bishop: d.bishop ?? null,
    noteToucherVaginal: d.noteToucherVaginal ?? null,
    echoObstetricale: d.echoObstetricale ?? null,
    hypothese1: d.hypothese1 ?? null,
    hypothese2: d.hypothese2 ?? null,
    hypothese3: d.hypothese3 ?? null,
  }

  const row = await prisma.observationObstetricale.upsert({
    where: { visiteId },
    create: { visiteId, ...payload },
    update: payload,
  })

  return toSerializable(toDetail(row))
}
