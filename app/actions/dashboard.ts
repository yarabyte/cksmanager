'use server'

import { prisma } from '@/lib/prisma'
import { toSerializable } from '@/lib/json-bigint'
import { formatPatientIdentityLine } from '@/lib/formatting'
import { round2 } from '@/lib/caisse/helpers'
import {
  endOfDayDouala,
  formatInAppTimezone,
  getZonedParts,
  shiftDoualaDays,
  startOfDayDouala,
} from '@/lib/timezone'
import type { Role } from '@/lib/types'
import type {
  DashboardCaisseItem,
  DashboardCategoryPoint,
  DashboardChartPoint,
  DashboardData,
  DashboardKpis,
  DashboardProfile,
  DashboardRecentFacture,
  DashboardRecentVisite,
  DashboardRevenuePoint,
  DashboardSortieItem,
  DashboardStockAlerte,
} from '@/lib/types/dashboard'

function dayKey(date: Date): string {
  const p = getZonedParts(date)
  return `${p.year}-${String(p.month).padStart(2, '0')}-${String(p.day).padStart(2, '0')}`
}

function dayLabel(date: Date): string {
  return formatInAppTimezone(date, { day: '2-digit', month: 'short' })
}

function weekdayLabel(date: Date): string {
  return formatInAppTimezone(date, { weekday: 'short' })
}

function emptyKpis(): DashboardKpis {
  return {
    visitesAujourdhui: 0,
    visitesHier: 0,
    visitesActives: 0,
    recettesJour: 0,
    recettesHier: 0,
    montantEnAttente: 0,
    nbEnAttente: 0,
    patientsTotal: 0,
    feuillesAujourdhui: 0,
    facturesConfirmees: 0,
    bacPending: 0,
    hospitalisationsEnCours: 0,
    mesVisitesAujourdhui: 0,
    mesEnAttente: 0,
    mesEnCours: 0,
    mesTerminees: 0,
    stockAlertesCount: 0,
    peremptionAlertesCount: 0,
    sortiesJour: 0,
    retoursJour: 0,
  }
}

function emptyChart30(now: Date): DashboardChartPoint[] {
  const visitsByDay = new Map<string, number>()
  for (let i = 29; i >= 0; i--) {
    const d = shiftDoualaDays(now, -i)
    visitsByDay.set(dayKey(d), 0)
  }
  return [...visitsByDay.entries()].map(([key, count]) => {
    const [y, m, d] = key.split('-').map(Number)
    const date = new Date(Date.UTC(y, m - 1, d, 12))
    return { date: dayLabel(date), visites: count }
  })
}

function emptyRevenue7(now: Date): DashboardRevenuePoint[] {
  const revenueByDay = new Map<string, number>()
  for (let i = 6; i >= 0; i--) {
    const d = shiftDoualaDays(now, -i)
    revenueByDay.set(dayKey(d), 0)
  }
  return [...revenueByDay.entries()].map(([key, revenue]) => {
    const [y, m, d] = key.split('-').map(Number)
    const date = new Date(Date.UTC(y, m - 1, d, 12))
    return { day: weekdayLabel(date), revenue: round2(revenue) }
  })
}

async function resolvePatientLabels(ids: bigint[]): Promise<Map<string, string>> {
  if (ids.length === 0) return new Map()
  const patients = await prisma.patient.findMany({
    where: { id: { in: ids } },
    select: { id: true, patName: true, patSurname: true, sexe: true, nomJeuneFille: true },
  })
  return new Map(
    patients.map((p) => [
      p.id.toString(),
      formatPatientIdentityLine(
        String(p.patName),
        String(p.patSurname),
        Number(p.sexe),
        p.nomJeuneFille != null && String(p.nomJeuneFille).trim() !== ''
          ? String(p.nomJeuneFille)
          : null,
      ),
    ]),
  )
}

function mapVisites(
  rows: Array<{
    id: bigint
    patientId: bigint
    dateVisite: Date
    statut: string
    medecin: { name: string; titre: string | null }
  }>,
  labels: Map<string, string>,
): DashboardRecentVisite[] {
  return rows.map((v) => ({
    id: v.id.toString(),
    patientId: v.patientId.toString(),
    patientLabel: labels.get(v.patientId.toString()) ?? null,
    medecinNom: v.medecin.name,
    medecinTitre: v.medecin.titre,
    dateVisite: v.dateVisite.toISOString(),
    statut: v.statut,
  }))
}

function mapFactures(
  rows: Array<{
    id: bigint
    numero: string
    patientId: bigint
    montantPatient: unknown
    montantAssurance: unknown
    statut: string
    createdAt: Date | null
    bordereauFacture: { bordereau: { statut: string } } | null
  }>,
  labels: Map<string, string>,
): DashboardRecentFacture[] {
  return rows.map((f) => ({
    id: f.id.toString(),
    numero: f.numero,
    patientLabel: labels.get(f.patientId.toString()) ?? null,
    montantPatient: round2(Number(f.montantPatient)),
    montantAssurance: round2(Number(f.montantAssurance)),
    statut: f.statut,
    createdAt: f.createdAt ? f.createdAt.toISOString() : null,
    assureurPaye: f.bordereauFacture?.bordereau.statut === 'PAYE',
  }))
}

function bucketVisites30(
  now: Date,
  rows: Array<{ dateVisite: Date }>,
): DashboardChartPoint[] {
  const visitsByDay = new Map<string, number>()
  for (let i = 29; i >= 0; i--) {
    visitsByDay.set(dayKey(shiftDoualaDays(now, -i)), 0)
  }
  for (const v of rows) {
    const key = dayKey(v.dateVisite)
    if (visitsByDay.has(key)) {
      visitsByDay.set(key, (visitsByDay.get(key) ?? 0) + 1)
    }
  }
  return [...visitsByDay.entries()].map(([key, count]) => {
    const [y, m, d] = key.split('-').map(Number)
    return { date: dayLabel(new Date(Date.UTC(y, m - 1, d, 12))), visites: count }
  })
}

function bucketRecettes7(
  now: Date,
  rows: Array<{ createdAt: Date | null; montant: unknown }>,
): DashboardRevenuePoint[] {
  const revenueByDay = new Map<string, number>()
  for (let i = 6; i >= 0; i--) {
    revenueByDay.set(dayKey(shiftDoualaDays(now, -i)), 0)
  }
  for (const e of rows) {
    if (!e.createdAt) continue
    const key = dayKey(e.createdAt)
    if (revenueByDay.has(key)) {
      revenueByDay.set(key, (revenueByDay.get(key) ?? 0) + Number(e.montant))
    }
  }
  return [...revenueByDay.entries()].map(([key, revenue]) => {
    const [y, m, d] = key.split('-').map(Number)
    return {
      day: weekdayLabel(new Date(Date.UTC(y, m - 1, d, 12))),
      revenue: round2(revenue),
    }
  })
}

async function loadCategoriesActes30(
  start30: Date,
  endToday: Date,
): Promise<DashboardCategoryPoint[]> {
  const lignesCategories = await prisma.feuilleCirculationLigne.groupBy({
    by: ['categorieId'],
    where: {
      feuille: { createdAt: { gte: start30, lte: endToday } },
    },
    _count: { _all: true },
  })
  const categorieIds = lignesCategories.map((r) => r.categorieId)
  const categories = categorieIds.length
    ? await prisma.categorieActe.findMany({
        where: { id: { in: categorieIds } },
        select: { id: true, nom: true },
      })
    : []
  const catMap = new Map(categories.map((c) => [c.id.toString(), c.nom]))
  return lignesCategories
    .map((r) => ({
      name: catMap.get(r.categorieId.toString()) ?? `Catégorie #${r.categorieId}`,
      value: r._count._all,
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6)
}

async function loadMontantEnAttente(): Promise<{
  montantEnAttente: number
  nbEnAttente: number
}> {
  const [feuillesEnAttente, facturesEnAttente, lockedFeuilleIds] = await Promise.all([
    prisma.feuilleCirculation.findMany({
      where: { statut: 'CONFIRMEE', statutPaiement: 'IMPAYEE' },
      select: { id: true },
    }),
    prisma.facture.findMany({
      where: { statut: 'CONFIRMEE', montantPatient: { gt: 0 } },
      select: { montantPatient: true },
    }),
    prisma.factureFeuille.findMany({
      where: { facture: { statut: { in: ['CONFIRMEE', 'PAYEE'] } } },
      select: { feuilleCirculationId: true },
    }),
  ])

  const lockedSet = new Set(lockedFeuilleIds.map((l) => l.feuilleCirculationId.toString()))
  const feuillesLibresIds = feuillesEnAttente
    .filter((f) => !lockedSet.has(f.id.toString()))
    .map((f) => f.id)

  let montantFeuilles = 0
  if (feuillesLibresIds.length > 0) {
    const agg = await prisma.feuilleCirculationLigne.aggregate({
      where: { feuilleId: { in: feuillesLibresIds } },
      _sum: { montantPatient: true },
    })
    montantFeuilles = Number(agg._sum?.montantPatient ?? 0)
  }
  const montantFactures = facturesEnAttente.reduce((s, f) => s + Number(f.montantPatient), 0)
  return {
    montantEnAttente: round2(montantFeuilles + montantFactures),
    nbEnAttente: feuillesLibresIds.length + facturesEnAttente.length,
  }
}

async function loadCaisseEnAttente(): Promise<DashboardCaisseItem[]> {
  const lockedIds = await prisma.factureFeuille.findMany({
    where: { facture: { statut: { in: ['CONFIRMEE', 'PAYEE'] } } },
    select: { feuilleCirculationId: true },
  })
  const lockedSet = new Set(lockedIds.map((l) => l.feuilleCirculationId.toString()))

  const [feuilles, factures] = await Promise.all([
    prisma.feuilleCirculation.findMany({
      where: { statut: 'CONFIRMEE', statutPaiement: 'IMPAYEE' },
      orderBy: [{ confirmedAt: 'desc' }, { id: 'desc' }],
      take: 12,
      select: {
        id: true,
        numero: true,
        visite: { select: { patientId: true } },
      },
    }),
    prisma.facture.findMany({
      where: { statut: 'CONFIRMEE', montantPatient: { gt: 0 } },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: 8,
      select: {
        id: true,
        numero: true,
        patientId: true,
        montantPatient: true,
      },
    }),
  ])

  const feuillesLibres = feuilles.filter((f) => !lockedSet.has(f.id.toString())).slice(0, 8)
  const patientIds = [
    ...feuillesLibres.map((f) => f.visite.patientId),
    ...factures.map((f) => f.patientId),
  ]
  const labels = await resolvePatientLabels([...new Set(patientIds)])

  const items: DashboardCaisseItem[] = []
  for (const f of feuillesLibres) {
    const agg = await prisma.feuilleCirculationLigne.aggregate({
      where: { feuilleId: f.id },
      _sum: { montantPatient: true },
    })
    items.push({
      type: 'FEUILLE',
      id: f.id.toString(),
      numero: f.numero,
      patientLabel: labels.get(f.visite.patientId.toString()) ?? null,
      montantPatient: round2(Number(agg._sum?.montantPatient ?? 0)),
    })
  }
  for (const f of factures) {
    items.push({
      type: 'FACTURE',
      id: f.id.toString(),
      numero: f.numero,
      patientLabel: labels.get(f.patientId.toString()) ?? null,
      montantPatient: round2(Number(f.montantPatient)),
    })
  }
  return items.slice(0, 10)
}

async function loadStockAlertes(): Promise<{
  alertes: DashboardStockAlerte[]
  stockCount: number
  peremptionCount: number
}> {
  const now = new Date()
  const in30 = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
  const lots = await prisma.stockLot.findMany({
    where: { quantite: { gt: 0 } },
    orderBy: [{ datePeremption: 'asc' }],
    include: {
      produit: { select: { nom: true, qteAlerte: true } },
      magasin: { select: { nom: true } },
    },
    take: 500,
  })

  const stockLots = lots.filter((l) => l.quantite <= l.produit.qteAlerte)
  const peremptionLots = lots.filter((l) => l.datePeremption <= in30)

  const seen = new Set<string>()
  const alertes: DashboardStockAlerte[] = []
  for (const l of [...stockLots, ...peremptionLots]) {
    const id = l.id.toString()
    if (seen.has(id)) continue
    seen.add(id)
    const isStock = l.quantite <= l.produit.qteAlerte
    alertes.push({
      id,
      produitNom: l.produit.nom,
      magasinNom: l.magasin.nom,
      numeroLot: l.numeroLot,
      quantite: l.quantite,
      datePeremption: l.datePeremption.toISOString(),
      kind: isStock ? 'STOCK' : 'PEREMPTION',
    })
    if (alertes.length >= 8) break
  }

  return {
    alertes,
    stockCount: stockLots.length,
    peremptionCount: peremptionLots.length,
  }
}

async function loadRecentSorties(
  startToday: Date,
  endToday: Date,
): Promise<DashboardSortieItem[]> {
  const rows = await prisma.sortiePharmacie.findMany({
    where: { createdAt: { gte: startToday, lte: endToday } },
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    take: 8,
    select: {
      id: true,
      numero: true,
      patientId: true,
      createdAt: true,
      statut: true,
    },
  })
  const labels = await resolvePatientLabels(rows.map((r) => r.patientId))
  return rows.map((r) => ({
    id: r.id.toString(),
    numero: r.numero,
    patientLabel: labels.get(r.patientId.toString()) ?? null,
    createdAt: r.createdAt ? r.createdAt.toISOString() : null,
    statut: r.statut,
  }))
}

function needsClinicOps(profile: DashboardProfile) {
  return (
    profile === 'Admin' ||
    profile === 'Manager' ||
    profile === 'Médecin' ||
    profile === 'Sage femme' ||
    profile === 'Front Office'
  )
}

function needsFinance(profile: DashboardProfile) {
  return profile === 'Admin' || profile === 'Manager' || profile === 'Caisse'
}

function needsPharmacie(profile: DashboardProfile) {
  return profile === 'Pharmacie' || profile === 'Commis Pharmacie'
}

export async function getDashboardData(
  profile: Role,
  userId: bigint,
): Promise<DashboardData> {
  const now = new Date()
  const startToday = startOfDayDouala(now)
  const endToday = endOfDayDouala(now)
  const startYesterday = startOfDayDouala(shiftDoualaDays(now, -1))
  const endYesterday = endOfDayDouala(shiftDoualaDays(now, -1))
  const start30 = startOfDayDouala(shiftDoualaDays(now, -29))
  const start7 = startOfDayDouala(shiftDoualaDays(now, -6))

  const kpis = emptyKpis()
  let visites30j = emptyChart30(now)
  let recettes7j = emptyRevenue7(now)
  let categoriesActes: DashboardCategoryPoint[] = []
  let recentVisites: DashboardRecentVisite[] = []
  let recentFactures: DashboardRecentFacture[] = []
  let stockAlertes: DashboardStockAlerte[] = []
  let caisseEnAttente: DashboardCaisseItem[] = []
  let recentSorties: DashboardSortieItem[] = []

  const dayVisiteFilter = { gte: startToday, lte: endToday }

  if (needsClinicOps(profile) || needsFinance(profile)) {
    const [
      visitesAujourdhui,
      visitesHier,
      enAttente,
      enCours,
      feuillesAujourdhui,
      bacPending,
    ] = await Promise.all([
      prisma.visite.count({ where: { dateVisite: dayVisiteFilter } }),
      prisma.visite.count({
        where: { dateVisite: { gte: startYesterday, lte: endYesterday } },
      }),
      prisma.visite.count({
        where: { statut: 'EN_ATTENTE', dateVisite: dayVisiteFilter },
      }),
      prisma.visite.count({
        where: { statut: 'EN_COURS', dateVisite: dayVisiteFilter },
      }),
      prisma.feuilleCirculation.count({
        where: { createdAt: dayVisiteFilter },
      }),
      prisma.bacFacture.count({ where: { statut: 'PENDING' } }),
    ])

    kpis.visitesAujourdhui = visitesAujourdhui
    kpis.visitesHier = visitesHier
    kpis.visitesActives = enAttente + enCours
    kpis.feuillesAujourdhui = feuillesAujourdhui
    kpis.bacPending = bacPending
  }

  if (profile === 'Admin' || profile === 'Manager') {
    const [
      patientsTotal,
      facturesConfirmees,
      recettesJourAgg,
      recettesHierAgg,
      visites30,
      encaissements7,
      categories,
      enAttenteData,
      recentVisitesRaw,
      recentFacturesRaw,
    ] = await Promise.all([
      prisma.patient.count(),
      prisma.facture.count({
        where: { statut: 'CONFIRMEE', montantPatient: { gt: 0 } },
      }),
      prisma.encaissement.aggregate({
        where: { createdAt: dayVisiteFilter },
        _sum: { montant: true },
      }),
      prisma.encaissement.aggregate({
        where: { createdAt: { gte: startYesterday, lte: endYesterday } },
        _sum: { montant: true },
      }),
      prisma.visite.findMany({
        where: { dateVisite: { gte: start30, lte: endToday } },
        select: { dateVisite: true },
      }),
      prisma.encaissement.findMany({
        where: { createdAt: { gte: start7, lte: endToday } },
        select: { createdAt: true, montant: true },
      }),
      loadCategoriesActes30(start30, endToday),
      loadMontantEnAttente(),
      prisma.visite.findMany({
        orderBy: { dateVisite: 'desc' },
        take: 8,
        include: { medecin: { select: { name: true, titre: true } } },
      }),
      prisma.facture.findMany({
        orderBy: { createdAt: 'desc' },
        take: 6,
        select: {
          id: true,
          numero: true,
          patientId: true,
          montantPatient: true,
          montantAssurance: true,
          statut: true,
          createdAt: true,
          bordereauFacture: {
            include: { bordereau: { select: { statut: true } } },
          },
        },
      }),
    ])

    kpis.patientsTotal = patientsTotal
    kpis.facturesConfirmees = facturesConfirmees
    kpis.recettesJour = round2(Number(recettesJourAgg._sum.montant ?? 0))
    kpis.recettesHier = round2(Number(recettesHierAgg._sum.montant ?? 0))
    kpis.montantEnAttente = enAttenteData.montantEnAttente
    kpis.nbEnAttente = enAttenteData.nbEnAttente
    visites30j = bucketVisites30(now, visites30)
    recettes7j = bucketRecettes7(now, encaissements7)
    categoriesActes = categories

    const labels = await resolvePatientLabels([
      ...new Set([
        ...recentVisitesRaw.map((v) => v.patientId),
        ...recentFacturesRaw.map((f) => f.patientId),
      ]),
    ])
    recentVisites = mapVisites(recentVisitesRaw, labels)
    recentFactures = mapFactures(recentFacturesRaw, labels)
  }

  if (profile === 'Médecin') {
    const medFilter = { medecinId: userId }
    const [
      mesVisitesAujourdhui,
      mesEnAttente,
      mesEnCours,
      mesTerminees,
      visites30,
      fileJour,
    ] = await Promise.all([
      prisma.visite.count({
        where: { ...medFilter, dateVisite: dayVisiteFilter },
      }),
      prisma.visite.count({
        where: { ...medFilter, statut: 'EN_ATTENTE', dateVisite: dayVisiteFilter },
      }),
      prisma.visite.count({
        where: { ...medFilter, statut: 'EN_COURS', dateVisite: dayVisiteFilter },
      }),
      prisma.visite.count({
        where: {
          ...medFilter,
          statut: { in: ['TERMINEE', 'FACTUREE'] },
          dateVisite: dayVisiteFilter,
        },
      }),
      prisma.visite.findMany({
        where: { ...medFilter, dateVisite: { gte: start30, lte: endToday } },
        select: { dateVisite: true },
      }),
      prisma.visite.findMany({
        where: {
          ...medFilter,
          dateVisite: dayVisiteFilter,
          statut: { in: ['EN_ATTENTE', 'EN_COURS', 'TERMINEE', 'FACTUREE'] },
        },
        orderBy: [{ dateVisite: 'asc' }, { id: 'asc' }],
        take: 12,
        include: { medecin: { select: { name: true, titre: true } } },
      }),
    ])

    kpis.mesVisitesAujourdhui = mesVisitesAujourdhui
    kpis.mesEnAttente = mesEnAttente
    kpis.mesEnCours = mesEnCours
    kpis.mesTerminees = mesTerminees
    kpis.visitesAujourdhui = mesVisitesAujourdhui
    kpis.visitesActives = mesEnAttente + mesEnCours
    visites30j = bucketVisites30(now, visites30)

    const labels = await resolvePatientLabels(fileJour.map((v) => v.patientId))
    recentVisites = mapVisites(fileJour, labels)
  }

  if (profile === 'Sage femme') {
    const [hospitalisationsEnCours, visites30, fileJour] = await Promise.all([
      prisma.hospitalisation.count({ where: { statut: 'EN_COURS' } }),
      prisma.visite.findMany({
        where: { dateVisite: { gte: start30, lte: endToday } },
        select: { dateVisite: true },
      }),
      prisma.visite.findMany({
        where: {
          dateVisite: dayVisiteFilter,
          statut: { in: ['EN_ATTENTE', 'EN_COURS', 'TERMINEE', 'FACTUREE'] },
        },
        orderBy: [{ dateVisite: 'asc' }, { id: 'asc' }],
        take: 12,
        include: { medecin: { select: { name: true, titre: true } } },
      }),
    ])
    kpis.hospitalisationsEnCours = hospitalisationsEnCours
    visites30j = bucketVisites30(now, visites30)
    const labels = await resolvePatientLabels(fileJour.map((v) => v.patientId))
    recentVisites = mapVisites(fileJour, labels)
  }

  if (profile === 'Front Office') {
    const [visites30, fileJour] = await Promise.all([
      prisma.visite.findMany({
        where: { dateVisite: { gte: start30, lte: endToday } },
        select: { dateVisite: true },
      }),
      prisma.visite.findMany({
        where: {
          dateVisite: dayVisiteFilter,
          statut: { in: ['EN_ATTENTE', 'EN_COURS', 'TERMINEE', 'FACTUREE'] },
        },
        orderBy: [{ dateVisite: 'asc' }, { id: 'asc' }],
        take: 12,
        include: { medecin: { select: { name: true, titre: true } } },
      }),
    ])
    visites30j = bucketVisites30(now, visites30)
    const labels = await resolvePatientLabels(fileJour.map((v) => v.patientId))
    recentVisites = mapVisites(fileJour, labels)
  }

  if (profile === 'Caisse') {
    const [
      recettesJourAgg,
      recettesHierAgg,
      enAttenteData,
      encaissements7,
      facturesConfirmees,
      recentFacturesRaw,
      enAttenteItems,
    ] = await Promise.all([
      prisma.encaissement.aggregate({
        where: { createdAt: dayVisiteFilter },
        _sum: { montant: true },
      }),
      prisma.encaissement.aggregate({
        where: { createdAt: { gte: startYesterday, lte: endYesterday } },
        _sum: { montant: true },
      }),
      loadMontantEnAttente(),
      prisma.encaissement.findMany({
        where: { createdAt: { gte: start7, lte: endToday } },
        select: { createdAt: true, montant: true },
      }),
      prisma.facture.count({
        where: { statut: 'CONFIRMEE', montantPatient: { gt: 0 } },
      }),
      prisma.facture.findMany({
        orderBy: { createdAt: 'desc' },
        take: 6,
        select: {
          id: true,
          numero: true,
          patientId: true,
          montantPatient: true,
          montantAssurance: true,
          statut: true,
          createdAt: true,
          bordereauFacture: {
            include: { bordereau: { select: { statut: true } } },
          },
        },
      }),
      loadCaisseEnAttente(),
    ])

    kpis.recettesJour = round2(Number(recettesJourAgg._sum.montant ?? 0))
    kpis.recettesHier = round2(Number(recettesHierAgg._sum.montant ?? 0))
    kpis.montantEnAttente = enAttenteData.montantEnAttente
    kpis.nbEnAttente = enAttenteData.nbEnAttente
    kpis.facturesConfirmees = facturesConfirmees
    recettes7j = bucketRecettes7(now, encaissements7)
    caisseEnAttente = enAttenteItems

    const labels = await resolvePatientLabels(recentFacturesRaw.map((f) => f.patientId))
    recentFactures = mapFactures(recentFacturesRaw, labels)
  }

  if (needsPharmacie(profile)) {
    const [sortiesJour, retoursJour, sorties] = await Promise.all([
      prisma.sortiePharmacie.count({
        where: { createdAt: dayVisiteFilter },
      }),
      prisma.retourPharmacie.count({
        where: { createdAt: dayVisiteFilter },
      }),
      loadRecentSorties(startToday, endToday),
    ])
    kpis.sortiesJour = sortiesJour
    kpis.retoursJour = retoursJour
    recentSorties = sorties

    if (profile === 'Pharmacie') {
      const stock = await loadStockAlertes()
      stockAlertes = stock.alertes
      kpis.stockAlertesCount = stock.stockCount
      kpis.peremptionAlertesCount = stock.peremptionCount
    }
  }

  return toSerializable({
    profile,
    kpis,
    visites30j,
    recettes7j,
    categoriesActes,
    recentVisites,
    recentFactures,
    stockAlertes,
    caisseEnAttente,
    recentSorties,
  }) as DashboardData
}
