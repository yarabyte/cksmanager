'use server'

import { prisma } from '@/lib/prisma'
import { formatPatientIdentityLine } from '@/lib/formatting'
import {
  ensurePatientNonAssureLink,
  isNonAssureAssuranceName,
} from '@/lib/assurance/non-assure'
import {
  endOfDayDouala,
  shiftDoualaDays,
  startOfDayDouala,
  zonedDateTimeToUtc,
} from '@/lib/timezone'
import { requireUserId } from '@/lib/auth/session'
import { notifyEventAsync } from '@/lib/notifications/create-notification'

export type PatientAssurancePreview = {
  assuranceNom: string
  tauxCouverture: number
  expiree: boolean
  nonAssure: boolean
}

/** Assurance active du patient à la date de visite (affichage formulaire nouvelle visite). */
export async function getPatientAssuranceForVisite(
  patientId: string,
  dateVisiteIso?: string,
): Promise<PatientAssurancePreview | null> {
  if (!/^\d+$/.test(patientId)) return null

  const refDate = dateVisiteIso ? new Date(dateVisiteIso) : new Date()
  const day = startOfDayDouala(refDate)

  let ap = await prisma.assurancePatient.findFirst({
    where: { patientId: BigInt(patientId) },
    include: { assurance: { select: { nom: true } } },
    orderBy: { id: 'asc' },
  })

  if (!ap) {
    await ensurePatientNonAssureLink(BigInt(patientId))
    ap = await prisma.assurancePatient.findFirst({
      where: { patientId: BigInt(patientId) },
      include: { assurance: { select: { nom: true } } },
      orderBy: { id: 'asc' },
    })
  }
  if (!ap) return null

  const dateDebut = ap.dateDebut ? startOfDayDouala(ap.dateDebut) : null
  const dateFin = ap.dateFin ? startOfDayDouala(ap.dateFin) : null
  const expiree =
    (dateDebut != null && dateDebut.getTime() > day.getTime()) ||
    (dateFin != null && dateFin.getTime() < day.getTime())

  const nonAssure = isNonAssureAssuranceName(ap.assurance.nom)

  return {
    assuranceNom: ap.assurance.nom,
    tauxCouverture: Number(ap.tauxCouverture),
    expiree,
    nonAssure,
  }
}

export type VisiteRow = {
  id: string
  patientId: string
  /** Identité (table `patients`, même format que /patients) — null si `patient_id` sans ligne */
  patientLabel: string | null
  motifId: string
  motifLibelle: string
  userId: string
  userNom: string
  medecinId: string
  medecinNom: string
  medecinTitre: string | null
  dateVisite: string
  commentaires: string | null
  statut: string
  createdAt: string | null
  /** True si une fiche ParametrePatient existe pour cette visite. */
  parametresPatientRemplis: boolean
}

export type VisiteFilters = {
  /** 'today' | 'yesterday' | 'week' | 'month' | 'all' */
  periode?: string
  medecinId?: string
  statut?: string
  patientId?: string
}

function toRow(
  v: {
    id: bigint
    patientId: bigint
    motifId: bigint
    userId: bigint
    medecinId: bigint
    dateVisite: Date
    commentaires: string | null
    statut: string
    createdAt: Date | null
    motif: { libelle: string }
    user: { name: string }
    medecin: { name: string; titre: string | null }
    parametrePatient?: { id: bigint } | null
  },
  patientLabel: string | null = null,
): VisiteRow {
  return {
    id: v.id.toString(),
    patientId: v.patientId.toString(),
    patientLabel,
    motifId: v.motifId.toString(),
    motifLibelle: v.motif.libelle,
    userId: v.userId.toString(),
    userNom: v.user.name,
    medecinId: v.medecinId.toString(),
    medecinNom: v.medecin.name,
    medecinTitre: v.medecin.titre,
    dateVisite: v.dateVisite.toISOString(),
    commentaires: v.commentaires,
    statut: v.statut,
    createdAt: v.createdAt ? v.createdAt.toISOString() : null,
    parametresPatientRemplis: !!v.parametrePatient,
  }
}

function buildDateFilter(periode?: string): { gte?: Date; lte?: Date } | undefined {
  const now = new Date()
  if (periode === 'today') {
    return { gte: startOfDayDouala(now), lte: endOfDayDouala(now) }
  }
  if (periode === 'yesterday') {
    const y = shiftDoualaDays(now, -1)
    return { gte: startOfDayDouala(y), lte: endOfDayDouala(y) }
  }
  if (periode === 'week') {
    const start = shiftDoualaDays(now, -7)
    return { gte: startOfDayDouala(start), lte: endOfDayDouala(now) }
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

export async function listVisites(filters: VisiteFilters = {}): Promise<VisiteRow[]> {
  const dateFilter = buildDateFilter(filters.periode)

  const rows = await prisma.visite.findMany({
    where: {
      ...(dateFilter ? { dateVisite: dateFilter } : {}),
      ...(filters.medecinId ? { medecinId: BigInt(filters.medecinId) } : {}),
      ...(filters.statut ? { statut: filters.statut } : {}),
      ...(filters.patientId ? { patientId: BigInt(filters.patientId) } : {}),
    },
    include: {
      motif: true,
      user: true,
      medecin: true,
      parametrePatient: { select: { id: true } },
    },
    orderBy: { dateVisite: 'desc' },
    take: 500,
  })

  // Résolution des noms patients (IDs peuvent être legacy ou locaux)
  const uniquePatientIds = [...new Set(rows.map((r) => r.patientId))]
  const patients = await prisma.patient.findMany({
    where: { id: { in: uniquePatientIds } },
    select: { id: true, patName: true, patSurname: true, sexe: true, nomJeuneFille: true },
  })
  const patientMap = new Map(
    patients.map((p) => [
      p.id.toString(),
      formatPatientIdentityLine(
        String(p.patName),
        String(p.patSurname),
        Number(p.sexe),
        p.nomJeuneFille != null && String(p.nomJeuneFille).trim() !== '' ? String(p.nomJeuneFille) : null,
      ),
    ]),
  )

  return rows.map((v) => toRow(v, patientMap.get(v.patientId.toString()) ?? null))
}

export type VisiteStats = {
  total: number
  enAttente: number
  enCours: number
  terminees: number
  facturees: number
  aujourd_hui: number
}

export async function getVisiteStats(): Promise<VisiteStats> {
  const now = new Date()
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999)

  const [total, enAttente, enCours, terminees, facturees, aujourd_hui] = await Promise.all([
    prisma.visite.count(),
    prisma.visite.count({ where: { statut: 'EN_ATTENTE' } }),
    prisma.visite.count({ where: { statut: 'EN_COURS' } }),
    prisma.visite.count({ where: { statut: 'TERMINEE' } }),
    prisma.visite.count({ where: { statut: 'FACTUREE' } }),
    prisma.visite.count({ where: { dateVisite: { gte: startOfToday, lte: endOfToday } } }),
  ])

  return { total, enAttente, enCours, terminees, facturees, aujourd_hui }
}

/** Nombre de visites par patient (liste /patients). */
export async function getVisiteCountsByPatientIds(
  patientIds: string[],
): Promise<Record<string, number>> {
  const ids = [...new Set(patientIds.filter((id) => /^\d+$/.test(id)))]
  if (ids.length === 0) return {}

  const rows = await prisma.visite.groupBy({
    by: ['patientId'],
    where: { patientId: { in: ids.map((id) => BigInt(id)) } },
    _count: { _all: true },
  })

  const out: Record<string, number> = {}
  for (const id of ids) out[id] = 0
  for (const row of rows) {
    out[row.patientId.toString()] = row._count._all
  }
  return out
}

export type MotifOption = { id: string; libelle: string }

export async function listMotifs(): Promise<MotifOption[]> {
  const rows = await prisma.motif.findMany({ orderBy: { libelle: 'asc' } })
  return rows.map((m) => ({ id: m.id.toString(), libelle: m.libelle }))
}

export type MedecinOption = { id: string; nom: string; titre: string | null }

export async function listMedecins(): Promise<MedecinOption[]> {
  const rows = await prisma.user.findMany({
    where: { role: { in: ['medecins', 'MEDECIN'] } },
    orderBy: { name: 'asc' },
  })
  return rows.map((u) => ({ id: u.id.toString(), nom: u.name, titre: u.titre }))
}

export type PatientOption = {
  id: string
  nom: string
  prenom: string
  telephone: string
  label: string
}

export async function searchPatients(query: string): Promise<PatientOption[]> {
  const rows = await prisma.patient.findMany({
    where: query.trim()
      ? {
          OR: [
            { patName: { contains: query, mode: 'insensitive' } },
            { patSurname: { contains: query, mode: 'insensitive' } },
            { patNum1: { contains: query } },
          ],
        }
      : {},
    orderBy: { patName: 'asc' },
    take: 20,
  })
  return rows.map((p) => ({
    id: p.id.toString(),
    nom: p.patName,
    prenom: p.patSurname,
    telephone: p.patNum1,
    label: formatPatientIdentityLine(
      String(p.patName),
      String(p.patSurname),
      Number(p.sexe),
      p.nomJeuneFille != null && String(p.nomJeuneFille).trim() !== '' ? String(p.nomJeuneFille) : null,
    ),
  }))
}

export type CreateVisiteInput = {
  patientId: string
  motifId: string
  medecinId: string
  dateVisite: string
  commentaires?: string
  statut?: string
}

export async function createVisite(input: CreateVisiteInput): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  try {
    let actorUserId = 1n
    try {
      actorUserId = await requireUserId()
    } catch {
      /* fallback system */
    }

    const visite = await prisma.visite.create({
      data: {
        patientId: BigInt(input.patientId),
        motifId: BigInt(input.motifId),
        userId: actorUserId,
        medecinId: BigInt(input.medecinId),
        dateVisite: new Date(input.dateVisite),
        commentaires: input.commentaires ?? null,
        statut: input.statut ?? 'EN_ATTENTE',
      },
    })

    const patient = await prisma.patient.findUnique({
      where: { id: BigInt(input.patientId) },
      select: { patName: true, patSurname: true, sexe: true, nomJeuneFille: true },
    })
    const label = patient
      ? formatPatientIdentityLine(
          String(patient.patName),
          String(patient.patSurname),
          Number(patient.sexe),
          patient.nomJeuneFille != null && String(patient.nomJeuneFille).trim() !== ''
            ? String(patient.nomJeuneFille)
            : null,
        )
      : `Patient #${input.patientId}`

    notifyEventAsync({
      type: 'VISITE_CREEE',
      message: `Nouvelle visite enregistrée pour ${label}`,
      href: `/visites/${visite.id}`,
      entityType: 'Visite',
      entityId: visite.id,
      actorUserId,
    })

    return { ok: true, id: visite.id.toString() }
  } catch (e) {
    console.error('createVisite error', e)
    return { ok: false, error: 'Erreur lors de la création de la visite' }
  }
}

export type VisiteDetail = VisiteRow & {
  medecinSpecialite: string | null
  medecinTelephone: string | null
  userCode: string | null
  updatedAt: string | null
  /** Ligne `patients` si `patient_id` existe — champs alignés Prisma pour affichage identité */
  patient: {
    id: string
    patName: string
    patSurname: string
    nomJeuneFille: string | null
    telephone: string
    sexe: number
    dob: string
  } | null
}

export async function getVisiteById(id: string): Promise<VisiteDetail | null> {
  const v = await prisma.visite.findUnique({
    where: { id: BigInt(id) },
    include: {
      motif: true,
      user: true,
      medecin: true,
      parametrePatient: { select: { id: true } },
    },
  })
  if (!v) return null

  // Tenter de retrouver le patient dans notre DB
  const patient = await prisma.patient.findUnique({
    where: { id: v.patientId },
  }).catch(() => null)

  const base = toRow(
    v,
    patient
      ? formatPatientIdentityLine(
          String(patient.patName),
          String(patient.patSurname),
          Number(patient.sexe),
          patient.nomJeuneFille != null && String(patient.nomJeuneFille).trim() !== ''
            ? String(patient.nomJeuneFille)
            : null,
        )
      : null,
  )
  return {
    ...base,
    medecinSpecialite: v.medecin.specialite ?? null,
    medecinTelephone: v.medecin.telephone ?? null,
    userCode: v.user.code ?? null,
    updatedAt: v.updatedAt ? v.updatedAt.toISOString() : null,
    patient: patient
      ? {
          id: patient.id.toString(),
          patName: String(patient.patName),
          patSurname: String(patient.patSurname),
          nomJeuneFille:
            patient.nomJeuneFille != null && String(patient.nomJeuneFille).trim() !== ''
              ? String(patient.nomJeuneFille)
              : null,
          telephone: patient.patNum1,
          sexe: patient.sexe,
          dob: patient.patDob.toISOString(),
        }
      : null,
  }
}

export type UpdateStatutInput = {
  id: string
  statut: string
  commentaires?: string
}

export async function updateVisiteStatut(
  input: UpdateStatutInput,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await prisma.visite.update({
      where: { id: BigInt(input.id) },
      data: {
        statut: input.statut,
        ...(input.commentaires !== undefined ? { commentaires: input.commentaires } : {}),
        updatedAt: new Date(),
      },
    })
    return { ok: true }
  } catch (e) {
    console.error('updateVisiteStatut error', e)
    return { ok: false, error: 'Erreur lors de la mise à jour du statut' }
  }
}
