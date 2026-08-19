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
import type { DashboardData } from '@/lib/types/dashboard'

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

export async function getDashboardData(): Promise<DashboardData> {
  const now = new Date()
  const startToday = startOfDayDouala(now)
  const endToday = endOfDayDouala(now)
  const startYesterday = startOfDayDouala(shiftDoualaDays(now, -1))
  const endYesterday = endOfDayDouala(shiftDoualaDays(now, -1))
  const start30 = startOfDayDouala(shiftDoualaDays(now, -29))
  const start7 = startOfDayDouala(shiftDoualaDays(now, -6))

  const [
    visitesAujourdhui,
    visitesHier,
    enAttente,
    enCours,
    recettesJourAgg,
    recettesHierAgg,
    patientsTotal,
    feuillesAujourdhui,
    facturesConfirmees,
    visites30,
    encaissements7,
    lignesCategories,
    recentVisitesRaw,
    recentFacturesRaw,
    feuillesEnAttente,
    facturesEnAttente,
  ] = await Promise.all([
    prisma.visite.count({ where: { dateVisite: { gte: startToday, lte: endToday } } }),
    prisma.visite.count({
      where: { dateVisite: { gte: startYesterday, lte: endYesterday } },
    }),
    prisma.visite.count({ where: { statut: 'EN_ATTENTE' } }),
    prisma.visite.count({ where: { statut: 'EN_COURS' } }),
    prisma.encaissement.aggregate({
      where: { createdAt: { gte: startToday, lte: endToday } },
      _sum: { montant: true },
    }),
    prisma.encaissement.aggregate({
      where: { createdAt: { gte: startYesterday, lte: endYesterday } },
      _sum: { montant: true },
    }),
    prisma.patient.count(),
    prisma.feuilleCirculation.count({
      where: { createdAt: { gte: startToday, lte: endToday } },
    }),
    prisma.facture.count({ where: { statut: 'CONFIRMEE' } }),
    prisma.visite.findMany({
      where: { dateVisite: { gte: start30, lte: endToday } },
      select: { dateVisite: true },
    }),
    prisma.encaissement.findMany({
      where: { createdAt: { gte: start7, lte: endToday } },
      select: { createdAt: true, montant: true },
    }),
    prisma.feuilleCirculationLigne.groupBy({
      by: ['categorieId'],
      _count: { _all: true },
    }),
    prisma.visite.findMany({
      orderBy: { dateVisite: 'desc' },
      take: 8,
      include: {
        medecin: { select: { name: true, titre: true } },
      },
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
        assurance: { select: { id: true, nom: true } },
        bordereauFacture: {
          include: {
            bordereau: { select: { id: true, numero: true, statut: true } },
          },
        },
      },
    }),
    prisma.feuilleCirculation.findMany({
      where: { statut: 'CONFIRMEE', statutPaiement: 'IMPAYEE' },
      select: { id: true },
    }),
    prisma.facture.findMany({
      where: { statut: 'CONFIRMEE' },
      select: { montantPatient: true },
    }),
  ])

  // Visites 30 jours
  const visitsByDay = new Map<string, number>()
  for (let i = 29; i >= 0; i--) {
    const d = shiftDoualaDays(now, -i)
    visitsByDay.set(dayKey(d), 0)
  }
  for (const v of visites30) {
    const key = dayKey(v.dateVisite)
    if (visitsByDay.has(key)) {
      visitsByDay.set(key, (visitsByDay.get(key) ?? 0) + 1)
    }
  }
  const visites30j = [...visitsByDay.entries()].map(([key, count]) => {
    const [y, m, d] = key.split('-').map(Number)
    const date = new Date(Date.UTC(y, m - 1, d, 12))
    return { date: dayLabel(date), visites: count }
  })

  // Recettes 7 jours
  const revenueByDay = new Map<string, number>()
  for (let i = 6; i >= 0; i--) {
    const d = shiftDoualaDays(now, -i)
    revenueByDay.set(dayKey(d), 0)
  }
  for (const e of encaissements7) {
    if (!e.createdAt) continue
    const key = dayKey(e.createdAt)
    if (revenueByDay.has(key)) {
      revenueByDay.set(key, (revenueByDay.get(key) ?? 0) + Number(e.montant))
    }
  }
  const recettes7j = [...revenueByDay.entries()].map(([key, revenue]) => {
    const [y, m, d] = key.split('-').map(Number)
    const date = new Date(Date.UTC(y, m - 1, d, 12))
    return { day: weekdayLabel(date), revenue: round2(revenue) }
  })

  // Catégories d'actes (lignes de feuilles)
  const categorieIds = lignesCategories.map((r) => r.categorieId)
  const categories = categorieIds.length
    ? await prisma.categorieActe.findMany({
        where: { id: { in: categorieIds } },
        select: { id: true, nom: true },
      })
    : []
  const catMap = new Map(categories.map((c) => [c.id.toString(), c.nom]))
  const categoriesActes = lignesCategories
    .map((r) => ({
      name: catMap.get(r.categorieId.toString()) ?? `Catégorie #${r.categorieId}`,
      value: r._count._all,
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6)

  // Labels patients
  const patientIds = [
    ...recentVisitesRaw.map((v) => v.patientId),
    ...recentFacturesRaw.map((f) => f.patientId),
  ]
  const labels = await resolvePatientLabels([...new Set(patientIds)])

  // Montant en attente (feuilles confirmées impayées hors facture confirmée + factures confirmées)
  const lockedFeuilleIds = await prisma.factureFeuille.findMany({
    where: { facture: { statut: { in: ['CONFIRMEE', 'PAYEE'] } } },
    select: { feuilleCirculationId: true },
  })
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
  const montantEnAttente = round2(montantFeuilles + montantFactures)
  const nbEnAttente = feuillesLibresIds.length + facturesEnAttente.length

  const recettesJour = round2(Number(recettesJourAgg._sum.montant ?? 0))
  const recettesHier = round2(Number(recettesHierAgg._sum.montant ?? 0))

  return toSerializable({
    kpis: {
      visitesAujourdhui,
      visitesHier,
      visitesActives: enAttente + enCours,
      recettesJour,
      recettesHier,
      montantEnAttente,
      nbEnAttente,
      patientsTotal,
      feuillesAujourdhui,
      facturesConfirmees,
    },
    visites30j,
    recettes7j,
    categoriesActes,
    recentVisites: recentVisitesRaw.map((v) => ({
      id: v.id.toString(),
      patientId: v.patientId.toString(),
      patientLabel: labels.get(v.patientId.toString()) ?? null,
      medecinNom: v.medecin.name,
      medecinTitre: v.medecin.titre,
      dateVisite: v.dateVisite.toISOString(),
      statut: v.statut,
    })),
    recentFactures: recentFacturesRaw.map((f) => ({
      id: f.id.toString(),
      numero: f.numero,
      patientLabel: labels.get(f.patientId.toString()) ?? null,
      montantPatient: round2(Number(f.montantPatient)),
      montantAssurance: round2(Number(f.montantAssurance)),
      statut: f.statut,
      createdAt: f.createdAt ? f.createdAt.toISOString() : null,
      assureurPaye: f.bordereauFacture?.bordereau.statut === 'PAYE',
    })),
  }) as DashboardData
}
