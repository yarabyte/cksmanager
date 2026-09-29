'use server'

import { Prisma } from '@prisma/client'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { formatPatientIdentityLine } from '@/lib/formatting'
import {
  endOfDayDouala,
  parseDoualaIsoDate,
  shiftDoualaDays,
  startOfDayDouala,
  startOfWeekDouala,
  zonedDateTimeToUtc,
} from '@/lib/timezone'
import {
  feuilleCreateSchema,
  feuilleUpdateSchema,
  type FeuilleLigneInput,
} from '@/lib/validations/feuille-circulation'
import {
  computeLigne,
  normalizeDecimal,
  resolveValeurUnitairePoint,
} from '@/lib/feuille-circulation/calcul'
import {
  ensurePatientNonAssureLink,
  findNonAssureAssurance,
  isNonAssureAssuranceName,
} from '@/lib/assurance/non-assure'
import type {
  ActeOption,
  CategorieOption,
  FeuilleDetail,
  FeuilleLigneRow,
  FeuilleListRow,
  FeuilleStats,
  FeuilleStatut,
  FeuilleTotaux,
  KitOption,
  ProduitOption,
  VisiteFeuilleContext,
  VisiteRecenteOption,
} from '@/lib/types/feuille-circulation'
import { requireUserId } from '@/lib/auth/session'

function num(v: Prisma.Decimal | number | null | undefined): number {
  if (v === null || v === undefined) return 0
  return Number(v)
}

function numOrNull(v: Prisma.Decimal | number | null | undefined): number | null {
  if (v === null || v === undefined) return null
  return Number(v)
}

function isPharmacieCategory(nom: string | null | undefined): boolean {
  if (!nom) return false
  const n = nom.toLowerCase()
  return n === 'pharmacie' || n.includes('pharm')
}

// ─────────────────────────────────────────────────────────────────────────────
//  Résolution des libellés patients (IDs legacy possibles, comme dans visites)
// ─────────────────────────────────────────────────────────────────────────────

type ResolvedPatient = { label: string; dob: string | null }

async function resolvePatientLabels(
  patientIds: bigint[],
): Promise<Map<string, ResolvedPatient>> {
  const unique = [...new Set(patientIds.map((id) => id.toString()))]
  if (unique.length === 0) return new Map()
  const patients = await prisma.patient.findMany({
    where: { id: { in: unique.map((id) => BigInt(id)) } },
    select: {
      id: true,
      patName: true,
      patSurname: true,
      sexe: true,
      nomJeuneFille: true,
      patDob: true,
    },
  })
  return new Map(
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
        dob: p.patDob ? p.patDob.toISOString() : null,
      },
    ]),
  )
}

// ─────────────────────────────────────────────────────────────────────────────
//  Contexte assurance d'une visite
// ─────────────────────────────────────────────────────────────────────────────

type Affiliation = {
  id: string
  assuranceId: string
  assuranceNom: string
  tauxCouverture: number
  dateDebut: Date | null
  dateFin: Date | null
  expiree: boolean
  /** categorieId -> taux */
  couvertures: Map<string, number>
  /** code_base -> valeur_unitaire */
  valeurs: Map<string, number>
}

async function loadAffiliation(patientId: bigint): Promise<Affiliation | null> {
  const ap = await prisma.assurancePatient.findFirst({
    where: { patientId },
    include: {
      assurance: { include: { assuranceValeurs: true } },
      couvertures: true,
    },
  })
  if (!ap) return null

  const now = new Date()
  const expiree =
    (ap.dateDebut != null && ap.dateDebut > now) ||
    (ap.dateFin != null && ap.dateFin < now)

  const valeurs = new Map<string, number>()
  for (const v of ap.assurance.assuranceValeurs) {
    if (!valeurs.has(v.codeBase)) valeurs.set(v.codeBase, Number(v.valeurUnitaire))
  }

  const couvertures = new Map<string, number>()
  for (const c of ap.couvertures) {
    couvertures.set(c.categorieId.toString(), Number(c.tauxCouverture))
  }

  return {
    id: ap.id.toString(),
    assuranceId: ap.assuranceId.toString(),
    assuranceNom: ap.assurance.nom,
    tauxCouverture: Number(ap.tauxCouverture),
    dateDebut: ap.dateDebut,
    dateFin: ap.dateFin,
    expiree,
    couvertures,
    valeurs,
  }
}

/** Affiliation à partir de l'assurance « Non assuré » (sans ligne patient encore créée). */
function affiliationFromNonAssureAssurance(assurance: {
  id: bigint
  nom: string
  assuranceValeurs: { codeBase: string; valeurUnitaire: unknown }[]
}): Affiliation {
  const valeurs = new Map<string, number>()
  for (const v of assurance.assuranceValeurs) {
    if (!valeurs.has(v.codeBase)) valeurs.set(v.codeBase, Number(v.valeurUnitaire))
  }
  return {
    id: '0',
    assuranceId: assurance.id.toString(),
    assuranceNom: assurance.nom,
    tauxCouverture: 0,
    dateDebut: null,
    dateFin: null,
    expiree: false,
    couvertures: new Map(),
    valeurs,
  }
}

async function resolveAffiliationForFeuille(patientId: bigint): Promise<{
  affiliation: Affiliation
  priseEnChargePatient: boolean
  affiliationExpiree: boolean
}> {
  let real = await loadAffiliation(patientId)

  if (!real) {
    await ensurePatientNonAssureLink(patientId)
    real = await loadAffiliation(patientId)
  }

  if (real?.expiree) {
    return {
      affiliation: real,
      priseEnChargePatient: false,
      affiliationExpiree: true,
    }
  }

  if (real) {
    return {
      affiliation: real,
      priseEnChargePatient: isNonAssureAssuranceName(real.assuranceNom),
      affiliationExpiree: false,
    }
  }

  const nonAssure = await findNonAssureAssurance()
  if (nonAssure) {
    return {
      affiliation: affiliationFromNonAssureAssurance(nonAssure),
      priseEnChargePatient: true,
      affiliationExpiree: false,
    }
  }

  throw new Error(
    'Assurance « Non assuré » introuvable dans le référentiel. Configurez-la avant de créer une feuille de circulation.',
  )
}

function affiliationToContext(a: Affiliation) {
  return {
    id: a.id,
    assuranceId: a.assuranceId,
    assuranceNom: a.assuranceNom,
    tauxCouverture: a.tauxCouverture,
    dateDebut: a.dateDebut ? a.dateDebut.toISOString() : null,
    dateFin: a.dateFin ? a.dateFin.toISOString() : null,
    expiree: a.expiree,
    couvertures: Object.fromEntries(a.couvertures),
    valeurs: Object.fromEntries(a.valeurs),
  }
}

// ─────────────────────────────────────────────────────────────────────────────
//  Lectures (liste, stats, détail)
// ─────────────────────────────────────────────────────────────────────────────

export type FeuilleFilters = {
  periode?: string
  dateFrom?: string
  dateTo?: string
  patientId?: string
  visiteId?: string
  statut?: string
}

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
  if (periode === 'today') return { gte: startOfDayDouala(now), lte: endOfDayDouala(now) }
  if (periode === 'yesterday') {
    const y = shiftDoualaDays(now, -1)
    return { gte: startOfDayDouala(y), lte: endOfDayDouala(y) }
  }
  if (periode === 'week') return { gte: startOfWeekDouala(now), lte: endOfDayDouala(now) }
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

export async function listFeuilles(
  filters: FeuilleFilters = {},
): Promise<FeuilleListRow[]> {
  const dateFilter = buildDateFilter(filters.periode, filters.dateFrom, filters.dateTo)

  const rows = await prisma.feuilleCirculation.findMany({
    where: {
      ...(filters.statut ? { statut: filters.statut } : {}),
      ...(filters.visiteId ? { visiteId: BigInt(filters.visiteId) } : {}),
      ...(dateFilter ? { createdAt: dateFilter } : {}),
      ...(filters.patientId
        ? { visite: { patientId: BigInt(filters.patientId) } }
        : {}),
    },
    include: {
      visite: { select: { id: true, patientId: true, dateVisite: true } },
      lignes: {
        select: { montantAssurance: true, montantPatient: true, montantTotal: true },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 500,
  })

  const labels = await resolvePatientLabels(rows.map((r) => r.visite.patientId))

  return rows.map((r) => {
    let totalAssurance = 0
    let totalPatient = 0
    let total = 0
    for (const l of r.lignes) {
      totalAssurance += num(l.montantAssurance)
      totalPatient += num(l.montantPatient)
      total += num(l.montantTotal)
    }
    return {
      id: r.id.toString(),
      numero: r.numero,
      libelle: r.libelle,
      statut: r.statut as FeuilleStatut,
      visiteId: r.visite.id.toString(),
      patientId: r.visite.patientId.toString(),
      patientLabel: labels.get(r.visite.patientId.toString())?.label ?? null,
      patientDob: labels.get(r.visite.patientId.toString())?.dob ?? null,
      dateVisite: r.visite.dateVisite.toISOString(),
      createdAt: r.createdAt ? r.createdAt.toISOString() : null,
      nbLignes: r.lignes.length,
      totalAssurance,
      totalPatient,
      total,
    }
  })
}

export async function getFeuilleStats(): Promise<FeuilleStats> {
  const now = new Date()
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999)

  const [total, brouillon, confirmees, today, patientAgg] = await Promise.all([
    prisma.feuilleCirculation.count(),
    prisma.feuilleCirculation.count({ where: { statut: 'BROUILLON' } }),
    prisma.feuilleCirculation.count({ where: { statut: 'CONFIRMEE' } }),
    prisma.feuilleCirculation.count({
      where: { createdAt: { gte: startOfToday, lte: endOfToday } },
    }),
    prisma.feuilleCirculationLigne.aggregate({
      where: { feuille: { statut: 'BROUILLON' } },
      _sum: { montantPatient: true },
    }),
  ])

  return {
    total,
    brouillon,
    confirmees,
    today,
    totalPatientEnCours: num(patientAgg._sum.montantPatient),
  }
}

function ligneToRow(l: {
  id: bigint
  typeLigne: string
  categorieId: bigint
  categorie: { nom: string } | null
  acteId: bigint | null
  acte: { nom: string } | null
  produitId: bigint | null
  produit: { nom: string; dosage: string } | null
  quantite: number
  taux: number
  valeur: Prisma.Decimal
  hnc: Prisma.Decimal
  puSnapshot: Prisma.Decimal | null
  remiseUnitaire: Prisma.Decimal | null
  montantTotal: Prisma.Decimal
  montantAssurance: Prisma.Decimal
  montantPatient: Prisma.Decimal
  imputeAssurance: number | null
  position: number
}): FeuilleLigneRow {
  return {
    id: l.id.toString(),
    typeLigne: l.typeLigne as 'ACTE' | 'PHARMA',
    categorieId: l.categorieId.toString(),
    categorieNom: l.categorie?.nom ?? null,
    acteId: l.acteId ? l.acteId.toString() : null,
    acteNom: l.acte?.nom ?? null,
    produitId: l.produitId ? l.produitId.toString() : null,
    produitNom: l.produit?.nom ?? null,
    produitDosage: l.produit?.dosage ?? null,
    quantite: l.quantite,
    taux: l.taux,
    valeur: num(l.valeur),
    hnc: num(l.hnc),
    puSnapshot: numOrNull(l.puSnapshot),
    remiseUnitaire: numOrNull(l.remiseUnitaire),
    montantTotal: num(l.montantTotal),
    montantAssurance: num(l.montantAssurance),
    montantPatient: num(l.montantPatient),
    imputeAssurance: l.imputeAssurance,
    position: l.position,
  }
}

function computeTotaux(lignes: FeuilleLigneRow[]): FeuilleTotaux {
  let totalAssurance = 0
  let totalPatient = 0
  let totalHnc = 0
  let total = 0
  for (const l of lignes) {
    totalAssurance += l.montantAssurance
    totalPatient += l.montantPatient
    totalHnc += l.hnc * l.quantite
    total += l.montantTotal
  }
  return {
    totalAssurance: Math.round(totalAssurance * 100) / 100,
    totalPatient: Math.round(totalPatient * 100) / 100,
    totalHnc: Math.round(totalHnc * 100) / 100,
    total: Math.round(total * 100) / 100,
  }
}

export async function getFeuilleById(id: string): Promise<FeuilleDetail | null> {
  const f = await prisma.feuilleCirculation.findUnique({
    where: { id: BigInt(id) },
    include: {
      visite: {
        select: {
          id: true,
          patientId: true,
          dateVisite: true,
          medecin: { select: { name: true, titre: true, numeroOrdre: true } },
          hospitalisation: {
            select: {
              id: true,
              dateEntree: true,
              dateSortie: true,
              statut: true,
            },
          },
        },
      },
      lignes: {
        orderBy: [{ position: 'asc' }, { id: 'asc' }],
        include: {
          categorie: { select: { nom: true } },
          acte: { select: { nom: true } },
          produit: { select: { nom: true, dosage: true } },
        },
      },
      avoir: {
        include: {
          user: { select: { name: true } },
        },
      },
    },
  })
  if (!f) return null

  const labels = await resolvePatientLabels([f.visite.patientId])
  const lignes = f.lignes.map(ligneToRow)
  const medecin = f.visite.medecin
  const medecinNom = medecin
    ? `${medecin.titre ? medecin.titre + ' ' : ''}${medecin.name}`
    : null

  const avoir =
    f.avoir && f.avoir.statut === 'ACTIF'
      ? {
          id: f.avoir.id.toString(),
          numero: f.avoir.numero,
          montant: Number(f.avoir.montant),
          motif: f.avoir.motif,
          statut: 'ACTIF' as const,
          createdAt: f.avoir.createdAt ? f.avoir.createdAt.toISOString() : null,
          userName: f.avoir.user?.name ?? null,
        }
      : null

  const hosp = f.visite.hospitalisation

  return {
    id: f.id.toString(),
    numero: f.numero,
    libelle: f.libelle,
    statut: f.statut as FeuilleStatut,
    statutPaiement: (f.statutPaiement ?? 'IMPAYEE') as import('@/lib/types/feuille-circulation').FeuilleStatutPaiement,
    paidAt: f.paidAt ? f.paidAt.toISOString() : null,
    createdAt: f.createdAt ? f.createdAt.toISOString() : null,
    updatedAt: f.updatedAt ? f.updatedAt.toISOString() : null,
    confirmedAt: f.confirmedAt ? f.confirmedAt.toISOString() : null,
    visite: {
      id: f.visite.id.toString(),
      dateVisite: f.visite.dateVisite.toISOString(),
      patientId: f.visite.patientId.toString(),
      patientLabel: labels.get(f.visite.patientId.toString())?.label ?? null,
      patientDob: labels.get(f.visite.patientId.toString())?.dob ?? null,
      medecinNom,
      medecinNumeroOrdre: medecin?.numeroOrdre ?? null,
    },
    hospitalisation: hosp
      ? {
          id: hosp.id.toString(),
          dateEntree: hosp.dateEntree.toISOString(),
          dateSortie: hosp.dateSortie ? hosp.dateSortie.toISOString() : null,
          statut: hosp.statut as 'EN_COURS' | 'SORTI',
        }
      : null,
    lignes,
    totaux: computeTotaux(lignes),
    avoir,
    hasAvoirAnnule: f.avoir?.statut === 'ANNULE',
  }
}

// ─────────────────────────────────────────────────────────────────────────────
//  Loaders formulaire
// ─────────────────────────────────────────────────────────────────────────────

export async function getVisitesRecentes(): Promise<VisiteRecenteOption[]> {
  const since = new Date()
  since.setDate(since.getDate() - 30)

  const visites = await prisma.visite.findMany({
    where: { dateVisite: { gte: since } },
    orderBy: { dateVisite: 'desc' },
    take: 200,
    include: { medecin: { select: { name: true, titre: true } } },
  })

  const patientIds = visites.map((v) => v.patientId)
  const labels = await resolvePatientLabels(patientIds)

  const affiliated = await prisma.assurancePatient.findMany({
    where: { patientId: { in: [...new Set(patientIds)] } },
    select: { patientId: true },
  })
  const affiliatedSet = new Set(affiliated.map((a) => a.patientId.toString()))

  return visites.map((v) => ({
    id: v.id.toString(),
    dateVisite: v.dateVisite.toISOString(),
    patientId: v.patientId.toString(),
    patientLabel: labels.get(v.patientId.toString())?.label ?? null,
    patientDob: labels.get(v.patientId.toString())?.dob ?? null,
    medecinNom: `${v.medecin.titre ? v.medecin.titre + ' ' : ''}${v.medecin.name}`,
    hasAffiliation: affiliatedSet.has(v.patientId.toString()),
  }))
}

export async function getVisiteFeuilleContext(
  visiteId: string,
): Promise<VisiteFeuilleContext | null> {
  const v = await prisma.visite.findUnique({
    where: { id: BigInt(visiteId) },
    include: { medecin: { select: { name: true, titre: true } } },
  })
  if (!v) return null

  const labels = await resolvePatientLabels([v.patientId])
  const resolved = await resolveAffiliationForFeuille(v.patientId)

  return {
    visiteId: v.id.toString(),
    dateVisite: v.dateVisite.toISOString(),
    patientId: v.patientId.toString(),
    patientLabel: labels.get(v.patientId.toString())?.label ?? null,
    patientDob: labels.get(v.patientId.toString())?.dob ?? null,
    medecinNom: `${v.medecin.titre ? v.medecin.titre + ' ' : ''}${v.medecin.name}`,
    affiliation: resolved.affiliationExpiree
      ? null
      : affiliationToContext(resolved.affiliation),
    priseEnChargePatient: resolved.priseEnChargePatient,
    affiliationExpiree: resolved.affiliationExpiree,
  }
}

export async function listCategoriesForFeuille(): Promise<CategorieOption[]> {
  const rows = await prisma.categorieActe.findMany({ orderBy: { nom: 'asc' } })
  return rows
    .filter((c) => !isPharmacieCategory(c.nom))
    .map((c) => ({
      id: c.id.toString(),
      nom: c.nom,
      isPharmacie: false,
    }))
}

export async function listActesForFeuille(): Promise<ActeOption[]> {
  const rows = await prisma.acte.findMany({
    orderBy: { nom: 'asc' },
    include: { assureur: { include: { assuranceValeurs: true } } },
  })
  return rows.map((a) => ({
    id: a.id.toString(),
    nom: a.nom,
    categorieId: a.categorieId.toString(),
    prixHnc: numOrNull(a.prixHnc),
    valeurFixe: a.valeurFixe ?? null,
    coefficient: Number(a.coefficient),
    codeBase: a.codeBase ?? null,
    imputeAssurance: a.imputeAssurance ?? null,
    assureurNom: a.assureur?.nom ?? null,
    valeurPointTarif: valeurPointTarifFromActe(a),
  }))
}

export async function listProduitsForFeuille(q?: string): Promise<ProduitOption[]> {
  const term = q?.trim()
  const rows = await prisma.produit.findMany({
    where: {
      actif: true,
      ...(term ? { nom: { contains: term, mode: 'insensitive' } } : {}),
    },
    orderBy: { nom: 'asc' },
    take: 100,
    select: { id: true, nom: true, dosage: true, prixVenteRef: true, hnc: true },
  })
  return rows.map((p) => ({
    id: p.id.toString(),
    nom: p.nom,
    dosage: p.dosage,
    prixVenteRef: num(p.prixVenteRef),
    hnc: numOrNull(p.hnc),
  }))
}

export async function listKitsForFeuille(): Promise<KitOption[]> {
  const rows = await prisma.kitActe.findMany({
    where: { actif: true },
    orderBy: { nom: 'asc' },
    include: {
      lignes: {
        orderBy: [{ position: 'asc' }, { id: 'asc' }],
        select: {
          typeLigne: true,
          acteId: true,
          produitId: true,
          quantite: true,
          remiseUnitaire: true,
          position: true,
        },
      },
    },
  })
  return rows.map((k) => ({
    id: k.id.toString(),
    nom: k.nom,
    lignes: k.lignes.map((l) => ({
      typeLigne: l.typeLigne as 'ACTE' | 'PHARMA',
      acteId: l.acteId ? l.acteId.toString() : null,
      produitId: l.produitId ? l.produitId.toString() : null,
      quantite: l.quantite,
      remiseUnitaire: num(l.remiseUnitaire),
      position: l.position,
    })),
  }))
}

// ─────────────────────────────────────────────────────────────────────────────
//  Construction des lignes (recalcul serveur — source de vérité)
// ─────────────────────────────────────────────────────────────────────────────

type LigneCreateData = {
  typeLigne: 'ACTE' | 'PHARMA'
  categorieId: bigint
  acteId: bigint | null
  produitId: bigint | null
  quantite: number
  taux: number
  valeur: number
  hnc: number
  puSnapshot: number | null
  remiseUnitaire: number | null
  montantTotal: number
  montantAssurance: number
  montantPatient: number
  imputeAssurance: number | null
  position: number
  userId: bigint
}

function resolveHncSaisi(
  raw: unknown,
  defaultHnc: number | null | undefined,
): number | null {
  const parsed = normalizeDecimal(raw)
  const fallback = defaultHnc != null && Number(defaultHnc) > 0 ? Number(defaultHnc) : null
  if (parsed === null || parsed === 0) return fallback
  return parsed
}

function buildTarifValeursMap(
  rows: { codeBase: string; valeurUnitaire: unknown }[],
): Map<string, number> {
  const valeurs = new Map<string, number>()
  for (const v of rows) {
    if (!valeurs.has(v.codeBase)) valeurs.set(v.codeBase, Number(v.valeurUnitaire))
  }
  return valeurs
}

function valeurPointTarifFromActe(acte: {
  codeBase: string | null
  assureur?: { assuranceValeurs: { codeBase: string; valeurUnitaire: unknown }[] } | null
}): number | null {
  if (!acte.codeBase || !acte.assureur) return null
  const row = acte.assureur.assuranceValeurs.find((v) => v.codeBase === acte.codeBase)
  return row ? Number(row.valeurUnitaire) : null
}

async function buildLignesData(
  lignes: FeuilleLigneInput[],
  affiliation: Affiliation,
  userId: bigint,
): Promise<LigneCreateData[]> {
  // Pré-chargement des référentiels utilisés
  const categorieIds = [...new Set(lignes.map((l) => BigInt(l.categorieId)))]
  const acteIds = [
    ...new Set(lignes.filter((l) => l.acteId).map((l) => BigInt(l.acteId as string))),
  ]

  const [categories, actes] = await Promise.all([
    prisma.categorieActe.findMany({ where: { id: { in: categorieIds } } }),
    acteIds.length
      ? prisma.acte.findMany({
          where: { id: { in: acteIds } },
          include: { assureur: { include: { assuranceValeurs: true } } },
        })
      : Promise.resolve([]),
  ])

  const categorieMap = new Map(categories.map((c) => [c.id.toString(), c]))
  const acteMap = new Map(actes.map((a) => [a.id.toString(), a]))

  const out: LigneCreateData[] = []

  lignes.forEach((ligne, idx) => {
    const numLigne = idx + 1
    const categorie = categorieMap.get(ligne.categorieId)
    if (!categorie) {
      throw new Error(`Ligne #${numLigne} : catégorie introuvable.`)
    }
    const categorieId = categorie.id
    if (isPharmacieCategory(categorie.nom)) {
      throw new Error(
        `Ligne #${numLigne} : la catégorie Pharmacie n'est pas autorisée sur une feuille de circulation.`,
      )
    }
    const taux =
      affiliation.couvertures.get(categorieId.toString()) ??
      affiliation.tauxCouverture ??
      0

    if (!ligne.acteId) {
      throw new Error(`Ligne #${numLigne} : sélectionnez un acte.`)
    }
    const acte = acteMap.get(ligne.acteId)
    if (!acte) {
      throw new Error(`Ligne #${numLigne} : acte introuvable.`)
    }
    const acteTarifs = acte.assureur
      ? buildTarifValeursMap(acte.assureur.assuranceValeurs)
      : null
    const valeurPoint = resolveValeurUnitairePoint(
      acte.codeBase,
      affiliation.valeurs,
      acteTarifs,
    )
    const acteHnc = acte.prixHnc != null ? Number(acte.prixHnc) : null
    const hncSaisi = resolveHncSaisi(ligne.hnc, acteHnc)

    const r = computeLigne({
      typeLigne: 'ACTE',
      quantite: ligne.quantite,
      taux,
      hncSaisi,
      valeurFixe: acte.valeurFixe ?? null,
      coefficient: Number(acte.coefficient),
      valeurUnitairePoint: valeurPoint,
      acteHnc,
      imputeAssurance: acte.imputeAssurance ?? null,
    })

    out.push({
      typeLigne: 'ACTE',
      categorieId,
      acteId: acte.id,
      produitId: null,
      quantite: Math.max(1, Math.trunc(ligne.quantite || 1)),
      taux,
      valeur: r.valeur,
      hnc: r.hnc,
      puSnapshot: null,
      remiseUnitaire: null,
      montantTotal: r.montantTotal,
      montantAssurance: r.montantAssurance,
      montantPatient: r.montantPatient,
      imputeAssurance: r.imputeAssurance,
      position: ligne.position ?? idx,
      userId,
    })
  })

  return out
}

// ─────────────────────────────────────────────────────────────────────────────
//  Génération du numéro
// ─────────────────────────────────────────────────────────────────────────────

function slugPrefix(code: string | null | undefined): string {
  const base = (code ?? 'GENE').trim() || 'GENE'
  const slug = base
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]/g, '')
    .slice(0, 4)
    .toUpperCase()
  return slug || 'GENE'
}

async function buildNumero(medecinCode: string | null, offset: number): Promise<string> {
  const now = new Date()
  const year = now.getFullYear()
  const startOfYear = new Date(year, 0, 1)
  const endOfYear = new Date(year, 11, 31, 23, 59, 59, 999)

  const depart =
    Number((await prisma.parametre.findFirst({ select: { numeroFactureDepart: true } }))?.numeroFactureDepart ?? 1)
  const countThisYear = await prisma.feuilleCirculation.count({
    where: { createdAt: { gte: startOfYear, lte: endOfYear } },
  })

  const seq = String(depart + countThisYear + offset).padStart(4, '0')
  const mois = String(now.getMonth() + 1).padStart(2, '0')
  const annee = String(year).slice(-2)
  return `${seq}/${mois}/${slugPrefix(medecinCode)}/${annee}`
}

// ─────────────────────────────────────────────────────────────────────────────
//  Mutations
// ─────────────────────────────────────────────────────────────────────────────

type ActionResult<T = { id: string }> =
  | ({ ok: true } & T)
  | { ok: false; error: string }

export async function createFeuille(data: unknown): Promise<ActionResult> {
  let parsed
  try {
    parsed = feuilleCreateSchema.parse(data)
  } catch {
    return { ok: false, error: 'Données invalides.' }
  }

  try {
    const userId = await requireUserId()
    const visite = await prisma.visite.findUnique({
      where: { id: BigInt(parsed.visiteId) },
      include: { medecin: { select: { code: true } } },
    })
    if (!visite) return { ok: false, error: 'Visite introuvable.' }

    const resolved = await resolveAffiliationForFeuille(visite.patientId)
    if (resolved.affiliationExpiree) {
      return {
        ok: false,
        error: "Création impossible : l'affiliation assurance est expirée ou pas encore active.",
      }
    }

    const lignesData = await buildLignesData(parsed.lignes, resolved.affiliation, userId)

    const created = await prisma.$transaction(async (tx) => {
      // Retry sur collision de numéro (contrainte unique)
      let lastErr: unknown = null
      for (let attempt = 0; attempt < 5; attempt++) {
        const numero = await buildNumero(visite.medecin.code, attempt)
        try {
          const feuille = await tx.feuilleCirculation.create({
            data: {
              visiteId: visite.id,
              numero,
              libelle: parsed.libelle ?? null,
              statut: 'BROUILLON',
              userId,
              createdAt: new Date(),
              lignes: {
                create: lignesData.map((l) => ({
                  typeLigne: l.typeLigne,
                  categorieId: l.categorieId,
                  acteId: l.acteId,
                  produitId: l.produitId,
                  quantite: l.quantite,
                  taux: l.taux,
                  valeur: l.valeur,
                  hnc: l.hnc,
                  puSnapshot: l.puSnapshot,
                  remiseUnitaire: l.remiseUnitaire,
                  montantTotal: l.montantTotal,
                  montantAssurance: l.montantAssurance,
                  montantPatient: l.montantPatient,
                  imputeAssurance: l.imputeAssurance,
                  position: l.position,
                  userId: l.userId,
                })),
              },
            },
          })

          if (visite.statut !== 'FACTUREE' && visite.statut !== 'EN_COURS') {
            await tx.visite.update({
              where: { id: visite.id },
              data: { statut: 'EN_COURS', updatedAt: new Date() },
            })
          }

          return feuille
        } catch (e) {
          if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
            lastErr = e
            continue
          }
          throw e
        }
      }
      throw lastErr ?? new Error('Impossible de générer un numéro unique.')
    })

    revalidatePath('/feuilles-circulation')
    revalidatePath(`/visites/${parsed.visiteId}`)
    revalidatePath(`/patients/${visite.patientId.toString()}`)
    return { ok: true, id: created.id.toString() }
  } catch (e) {
    console.error('createFeuille error', e)
    const message = e instanceof Error ? e.message : 'Erreur lors de la création.'
    return { ok: false, error: message }
  }
}

export async function updateFeuille(data: unknown): Promise<ActionResult> {
  let parsed
  try {
    parsed = feuilleUpdateSchema.parse(data)
  } catch {
    return { ok: false, error: 'Données invalides.' }
  }

  try {
    const userId = await requireUserId()
    const feuille = await prisma.feuilleCirculation.findUnique({
      where: { id: BigInt(parsed.id) },
      include: { visite: { select: { patientId: true } } },
    })
    if (!feuille) return { ok: false, error: 'Feuille de circulation introuvable.' }
    if (feuille.statut !== 'BROUILLON') {
      return { ok: false, error: 'Modification impossible : la feuille de circulation est confirmée.' }
    }

    const resolved = await resolveAffiliationForFeuille(feuille.visite.patientId)
    if (resolved.affiliationExpiree) {
      return {
        ok: false,
        error: "Mise à jour impossible : l'affiliation assurance est expirée ou pas encore active.",
      }
    }

    const lignesData = await buildLignesData(parsed.lignes, resolved.affiliation, userId)

    await prisma.$transaction(async (tx) => {
      await tx.feuilleCirculationLigne.deleteMany({ where: { feuilleId: feuille.id } })
      await tx.feuilleCirculation.update({
        where: { id: feuille.id },
        data: {
          libelle: parsed.libelle ?? null,
          lignes: {
            create: lignesData.map((l) => ({
              typeLigne: l.typeLigne,
              categorieId: l.categorieId,
              acteId: l.acteId,
              produitId: l.produitId,
              quantite: l.quantite,
              taux: l.taux,
              valeur: l.valeur,
              hnc: l.hnc,
              puSnapshot: l.puSnapshot,
              remiseUnitaire: l.remiseUnitaire,
              montantTotal: l.montantTotal,
              montantAssurance: l.montantAssurance,
              montantPatient: l.montantPatient,
              imputeAssurance: l.imputeAssurance,
              position: l.position,
              userId: l.userId,
            })),
          },
        },
      })
    })

    revalidatePath('/feuilles-circulation')
    revalidatePath(`/feuilles-circulation/${parsed.id}`)
    return { ok: true, id: parsed.id }
  } catch (e) {
    console.error('updateFeuille error', e)
    const message = e instanceof Error ? e.message : 'Erreur lors de la mise à jour.'
    return { ok: false, error: message }
  }
}

export async function confirmFeuille(id: string): Promise<ActionResult> {
  try {
    const feuille = await prisma.feuilleCirculation.findUnique({
      where: { id: BigInt(id) },
      include: { _count: { select: { lignes: true } } },
    })
    if (!feuille) return { ok: false, error: 'Feuille de circulation introuvable.' }
    if (feuille.statut === 'CONFIRMEE') {
      return { ok: false, error: 'La feuille de circulation est déjà confirmée.' }
    }
    if (feuille._count.lignes === 0) {
      return { ok: false, error: 'Impossible de confirmer une feuille de circulation sans ligne.' }
    }

    await prisma.feuilleCirculation.update({
      where: { id: BigInt(id) },
      data: { statut: 'CONFIRMEE', confirmedAt: new Date() },
    })

    revalidatePath('/feuilles-circulation')
    revalidatePath(`/feuilles-circulation/${id}`)
    return { ok: true, id }
  } catch (e) {
    console.error('confirmFeuille error', e)
    return { ok: false, error: 'Erreur lors de la confirmation.' }
  }
}

export async function deleteFeuille(id: string): Promise<ActionResult> {
  try {
    const feuille = await prisma.feuilleCirculation.findUnique({
      where: { id: BigInt(id) },
    })
    if (!feuille) return { ok: false, error: 'Feuille de circulation introuvable.' }
    if (feuille.statut !== 'BROUILLON') {
      return { ok: false, error: 'Suppression interdite : la feuille de circulation est confirmée.' }
    }

    await prisma.feuilleCirculation.delete({ where: { id: BigInt(id) } })

    revalidatePath('/feuilles-circulation')
    return { ok: true, id }
  } catch (e) {
    console.error('deleteFeuille error', e)
    return { ok: false, error: 'Erreur lors de la suppression.' }
  }
}
