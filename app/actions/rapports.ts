'use server'

import { prisma } from '@/lib/prisma'
import { toSerializable } from '@/lib/json-bigint'
import { resolvePatientLabels, round2 } from '@/lib/caisse/helpers'
import { requireRapportsManager } from '@/lib/rapports/access'
import {
  endOfDayDouala,
  formatInAppTimezone,
  getZonedParts,
  shiftDoualaDays,
  startOfDayDouala,
  zonedDateTimeToUtc,
} from '@/lib/timezone'
import {
  rapportCaDetailSchema,
  rapportCaFiltersSchema,
} from '@/lib/validations/rapport'
import type {
  RapportCaDetail,
  RapportCaDetailFacture,
  RapportCaDetailLigne,
  RapportCaLigne,
  RapportCaResult,
  RapportPeriode,
  RapportSite,
  RapportVue,
} from '@/lib/types/rapport'

type DateRange = { start: Date; end: Date; label: string; debutIso: string; finIso: string }

function dayKey(date: Date): string {
  const p = getZonedParts(date)
  return `${p.year}-${String(p.month).padStart(2, '0')}-${String(p.day).padStart(2, '0')}`
}

function parseIsoDate(value: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim())
  if (!m) return null
  return zonedDateTimeToUtc(Number(m[1]), Number(m[2]), Number(m[3]), 12, 0)
}

function resolveDateRange(
  periode: RapportPeriode = 'month',
  dateDebut?: string | null,
  dateFin?: string | null,
): DateRange {
  const now = new Date()

  if (periode === 'custom' && dateDebut && dateFin) {
    const d0 = parseIsoDate(dateDebut)
    const d1 = parseIsoDate(dateFin)
    if (d0 && d1) {
      const start = startOfDayDouala(d0)
      const end = endOfDayDouala(d1)
      return {
        start,
        end,
        debutIso: dateDebut,
        finIso: dateFin,
        label: `Du ${formatInAppTimezone(start, { day: '2-digit', month: 'short', year: 'numeric' })} au ${formatInAppTimezone(end, { day: '2-digit', month: 'short', year: 'numeric' })}`,
      }
    }
  }

  if (periode === 'today') {
    const start = startOfDayDouala(now)
    const end = endOfDayDouala(now)
    return {
      start,
      end,
      debutIso: dayKey(start),
      finIso: dayKey(end),
      label: "Aujourd'hui",
    }
  }

  if (periode === 'yesterday') {
    const y = shiftDoualaDays(now, -1)
    const start = startOfDayDouala(y)
    const end = endOfDayDouala(y)
    return {
      start,
      end,
      debutIso: dayKey(start),
      finIso: dayKey(end),
      label: 'Hier',
    }
  }

  if (periode === 'week') {
    const start = startOfDayDouala(shiftDoualaDays(now, -6))
    const end = endOfDayDouala(now)
    return {
      start,
      end,
      debutIso: dayKey(start),
      finIso: dayKey(end),
      label: '7 derniers jours',
    }
  }

  if (periode === 'year') {
    const p = getZonedParts(now)
    const start = zonedDateTimeToUtc(p.year, 1, 1, 0, 0, 0, 0)
    const end = endOfDayDouala(now)
    return {
      start,
      end,
      debutIso: dayKey(start),
      finIso: dayKey(end),
      label: `Année ${p.year}`,
    }
  }

  // month (default)
  const p = getZonedParts(now)
  const start = zonedDateTimeToUtc(p.year, p.month, 1, 0, 0, 0, 0)
  const end = endOfDayDouala(now)
  const monthLabel = formatInAppTimezone(start, { month: 'long', year: 'numeric' })
  return {
    start,
    end,
    debutIso: dayKey(start),
    finIso: dayKey(end),
    label: monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1),
  }
}

function factureDate(f: { confirmedAt: Date | null; createdAt: Date | null }): Date | null {
  return f.confirmedAt ?? f.createdAt
}

function inRange(date: Date | null, start: Date, end: Date): boolean {
  if (!date) return false
  return date >= start && date <= end
}

type FactureRow = {
  id: bigint
  numero: string
  patientId: bigint
  assuranceId: bigint | null
  statut: string
  montantPatient: number
  montantAssurance: number
  confirmedAt: Date | null
  createdAt: Date | null
  assurance: { id: bigint; nom: string } | null
  visite: {
    medecinId: bigint
    medecin: { name: string; titre: string | null }
  }
}

type LigneSiteRow = {
  id: bigint
  feuilleId: bigint
  factureId: string
  typeLigne: string
  categorieId: bigint
  categorieNom: string | null
  quantite: number
  montantPatient: number
  montantAssurance: number
  montantTotal: number
  acteNom: string | null
  produitNom: string | null
  produitDosage: string | null
  sitePharma: string | null
  typeActe: string | null
}

/** Normalise type_acte / site_pharma vers CKS | PLENITUDE. */
function normalizeSite(value: string | null | undefined): 'CKS' | 'PLENITUDE' {
  const v = (value ?? 'CKS').trim().toUpperCase()
  if (v === 'PLENITUDE' || v === 'PLÉNITUDE') return 'PLENITUDE'
  return 'CKS'
}

/**
 * Pharmacie : sitePharma du produit.
 * Actes : typeActe (cks / plenitude).
 */
function lineMatchesSite(
  line: { typeLigne: string; sitePharma: string | null; typeActe: string | null },
  site: RapportSite,
): boolean {
  if (site === 'all') return true
  if (line.typeLigne === 'PHARMA') {
    return normalizeSite(line.sitePharma) === site
  }
  return normalizeSite(line.typeActe) === site
}

async function loadFacturesInRange(range: DateRange): Promise<FactureRow[]> {
  const rows = await prisma.facture.findMany({
    where: {
      statut: { in: ['CONFIRMEE', 'PAYEE'] },
      OR: [
        { confirmedAt: { gte: range.start, lte: range.end } },
        {
          AND: [
            { confirmedAt: null },
            { createdAt: { gte: range.start, lte: range.end } },
          ],
        },
      ],
    },
    include: {
      assurance: { select: { id: true, nom: true } },
      visite: {
        select: {
          medecinId: true,
          medecin: { select: { name: true, titre: true } },
        },
      },
    },
    orderBy: [{ confirmedAt: 'desc' }, { createdAt: 'desc' }],
  })

  return rows
    .filter((f) => inRange(factureDate(f), range.start, range.end))
    .map((f) => ({
      id: f.id,
      numero: f.numero,
      patientId: f.patientId,
      assuranceId: f.assuranceId,
      statut: f.statut,
      montantPatient: Number(f.montantPatient),
      montantAssurance: Number(f.montantAssurance),
      confirmedAt: f.confirmedAt,
      createdAt: f.createdAt,
      assurance: f.assurance,
      visite: f.visite,
    }))
}

async function loadLignesForFactures(
  factures: FactureRow[],
  site: RapportSite,
): Promise<{ lignes: LigneSiteRow[]; factureAmounts: Map<string, { montantPatient: number; montantAssurance: number }> }> {
  if (factures.length === 0) {
    return { lignes: [], factureAmounts: new Map() }
  }

  const links = await prisma.factureFeuille.findMany({
    where: { factureId: { in: factures.map((f) => f.id) } },
    select: { factureId: true, feuilleCirculationId: true },
  })
  const feuilleToFacture = new Map(
    links.map((l) => [l.feuilleCirculationId.toString(), l.factureId.toString()]),
  )
  const feuilleIds = links.map((l) => l.feuilleCirculationId)
  if (feuilleIds.length === 0) {
    return { lignes: [], factureAmounts: new Map() }
  }

  const raw = await prisma.feuilleCirculationLigne.findMany({
    where: { feuilleId: { in: feuilleIds } },
    select: {
      id: true,
      feuilleId: true,
      typeLigne: true,
      categorieId: true,
      quantite: true,
      montantPatient: true,
      montantAssurance: true,
      montantTotal: true,
      categorie: { select: { nom: true } },
      acte: { select: { nom: true, typeActe: true } },
      produit: { select: { nom: true, dosage: true, sitePharma: true } },
    },
  })

  const lignes: LigneSiteRow[] = []
  const factureAmounts = new Map<string, { montantPatient: number; montantAssurance: number }>()

  for (const l of raw) {
    const sitePharma = l.produit?.sitePharma ?? null
    const typeActe = l.acte?.typeActe ?? null
    if (!lineMatchesSite({ typeLigne: l.typeLigne, sitePharma, typeActe }, site)) continue

    const factureId = feuilleToFacture.get(l.feuilleId.toString())
    if (!factureId) continue

    const mp = Number(l.montantPatient)
    const ma = Number(l.montantAssurance)
    lignes.push({
      id: l.id,
      feuilleId: l.feuilleId,
      factureId,
      typeLigne: l.typeLigne,
      categorieId: l.categorieId,
      categorieNom: l.categorie?.nom ?? null,
      quantite: l.quantite,
      montantPatient: mp,
      montantAssurance: ma,
      montantTotal: Number(l.montantTotal),
      acteNom: l.acte?.nom ?? null,
      produitNom: l.produit?.nom ?? null,
      produitDosage: l.produit?.dosage ?? null,
      sitePharma,
      typeActe,
    })

    const prev = factureAmounts.get(factureId) ?? { montantPatient: 0, montantAssurance: 0 }
    prev.montantPatient += mp
    prev.montantAssurance += ma
    factureAmounts.set(factureId, prev)
  }

  return { lignes, factureAmounts }
}

function applySiteAmounts(
  factures: FactureRow[],
  factureAmounts: Map<string, { montantPatient: number; montantAssurance: number }>,
  site: RapportSite,
): FactureRow[] {
  if (site === 'all') return factures
  return factures
    .map((f) => {
      const amounts = factureAmounts.get(f.id.toString())
      if (!amounts) return null
      return {
        ...f,
        montantPatient: amounts.montantPatient,
        montantAssurance: amounts.montantAssurance,
      }
    })
    .filter((f): f is FactureRow => f != null)
}

function medecinLabel(titre: string | null, name: string): string {
  return titre ? `${titre} ${name}` : name
}

function buildLignes(
  buckets: Map<
    string,
    { label: string; count: number; montantPatient: number; montantAssurance: number }
  >,
): RapportCaLigne[] {
  const grandTotal = [...buckets.values()].reduce(
    (s, b) => s + b.montantPatient + b.montantAssurance,
    0,
  )

  return [...buckets.entries()]
    .map(([id, b]) => {
      const total = round2(b.montantPatient + b.montantAssurance)
      return {
        id,
        label: b.label,
        count: b.count,
        montantPatient: round2(b.montantPatient),
        montantAssurance: round2(b.montantAssurance),
        total,
        partPct: grandTotal > 0 ? round2((total / grandTotal) * 100) : 0,
      }
    })
    .sort((a, b) => b.total - a.total)
}

function addBucket(
  buckets: Map<
    string,
    { label: string; count: number; montantPatient: number; montantAssurance: number }
  >,
  id: string,
  label: string,
  montantPatient: number,
  montantAssurance: number,
  countInc = 1,
) {
  const existing = buckets.get(id)
  if (existing) {
    existing.count += countInc
    existing.montantPatient += montantPatient
    existing.montantAssurance += montantAssurance
  } else {
    buckets.set(id, {
      label,
      count: countInc,
      montantPatient,
      montantAssurance,
    })
  }
}

async function aggregateByVue(
  vue: RapportVue,
  factures: FactureRow[],
  lignesSite: LigneSiteRow[],
): Promise<RapportCaLigne[]> {
  const buckets = new Map<
    string,
    { label: string; count: number; montantPatient: number; montantAssurance: number }
  >()

  if (vue === 'categorie') {
    for (const l of lignesSite) {
      const id = l.categorieId.toString()
      addBucket(
        buckets,
        id,
        l.categorieNom ?? `Catégorie #${id}`,
        l.montantPatient,
        l.montantAssurance,
        1,
      )
    }
    return buildLignes(buckets)
  }

  if (vue === 'patient') {
    const labels = await resolvePatientLabels(factures.map((f) => f.patientId))
    for (const f of factures) {
      const id = f.patientId.toString()
      addBucket(
        buckets,
        id,
        labels.get(id)?.label ?? `Patient #${id}`,
        f.montantPatient,
        f.montantAssurance,
      )
    }
    return buildLignes(buckets)
  }

  if (vue === 'medecin') {
    for (const f of factures) {
      const id = f.visite.medecinId.toString()
      addBucket(
        buckets,
        id,
        medecinLabel(f.visite.medecin.titre, f.visite.medecin.name),
        f.montantPatient,
        f.montantAssurance,
      )
    }
    return buildLignes(buckets)
  }

  if (vue === 'assureur') {
    for (const f of factures) {
      const id = f.assuranceId?.toString() ?? 'none'
      const label = f.assurance?.nom ?? 'Sans assureur'
      addBucket(buckets, id, label, f.montantPatient, f.montantAssurance)
    }
    return buildLignes(buckets)
  }

  // jour
  for (const f of factures) {
    const d = factureDate(f)
    if (!d) continue
    const id = dayKey(d)
    const label = formatInAppTimezone(d, {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
    addBucket(buckets, id, label, f.montantPatient, f.montantAssurance)
  }
  return buildLignes(buckets).sort((a, b) => a.id.localeCompare(b.id))
}

export async function getRapportCa(input: unknown): Promise<RapportCaResult> {
  await requireRapportsManager()
  const filters = rapportCaFiltersSchema.parse(input)
  const range = resolveDateRange(filters.periode, filters.dateDebut, filters.dateFin)
  const site = filters.site ?? 'all'
  const allFactures = await loadFacturesInRange(range)
  const { lignes: lignesSite, factureAmounts } = await loadLignesForFactures(allFactures, site)
  const factures = applySiteAmounts(allFactures, factureAmounts, site)
  const lignes = await aggregateByVue(filters.vue, factures, lignesSite)

  const totaux = {
    nbFactures: factures.length,
    montantPatient: round2(factures.reduce((s, f) => s + f.montantPatient, 0)),
    montantAssurance: round2(factures.reduce((s, f) => s + f.montantAssurance, 0)),
    total: 0,
  }
  totaux.total = round2(totaux.montantPatient + totaux.montantAssurance)

  return toSerializable({
    vue: filters.vue,
    site,
    dateDebut: range.debutIso,
    dateFin: range.finIso,
    periodeLabel: range.label,
    totaux,
    lignes,
  }) as RapportCaResult
}

function mapDetailFactures(
  selected: FactureRow[],
  patientLabels: Map<string, { label: string; dob: string | null }>,
): RapportCaDetailFacture[] {
  return selected.map((f) => {
    const d = factureDate(f)
    return {
      id: f.id.toString(),
      numero: f.numero,
      patientLabel: patientLabels.get(f.patientId.toString())?.label ?? null,
      medecinNom: medecinLabel(f.visite.medecin.titre, f.visite.medecin.name),
      assuranceNom: f.assurance?.nom ?? null,
      dateFacture: d ? d.toISOString() : null,
      montantPatient: round2(f.montantPatient),
      montantAssurance: round2(f.montantAssurance),
      total: round2(f.montantPatient + f.montantAssurance),
      statut: f.statut,
    }
  })
}

export async function getRapportCaDetail(input: unknown): Promise<RapportCaDetail> {
  await requireRapportsManager()
  const filters = rapportCaDetailSchema.parse(input)
  const range = resolveDateRange(filters.periode, filters.dateDebut, filters.dateFin)
  const site = filters.site ?? 'all'
  const allFactures = await loadFacturesInRange(range)
  const { lignes: lignesSite, factureAmounts } = await loadLignesForFactures(allFactures, site)
  const factures = applySiteAmounts(allFactures, factureAmounts, site)
  const cle = filters.cle

  let selected: FactureRow[] = []
  let label = cle
  let detailLignes: RapportCaDetailLigne[] = []

  if (filters.vue === 'patient') {
    selected = factures.filter((f) => f.patientId.toString() === cle)
    const labels = await resolvePatientLabels(selected.map((f) => f.patientId))
    label = labels.get(cle)?.label ?? `Patient #${cle}`
  } else if (filters.vue === 'medecin') {
    selected = factures.filter((f) => f.visite.medecinId.toString() === cle)
    if (selected[0]) {
      label = medecinLabel(selected[0].visite.medecin.titre, selected[0].visite.medecin.name)
    }
  } else if (filters.vue === 'assureur') {
    selected =
      cle === 'none'
        ? factures.filter((f) => !f.assuranceId)
        : factures.filter((f) => f.assuranceId?.toString() === cle)
    label = selected[0]?.assurance?.nom ?? (cle === 'none' ? 'Sans assureur' : `Assureur #${cle}`)
  } else if (filters.vue === 'jour') {
    selected = factures.filter((f) => {
      const d = factureDate(f)
      return d ? dayKey(d) === cle : false
    })
    if (selected[0]) {
      const d = factureDate(selected[0])
      label = d
        ? formatInAppTimezone(d, {
            weekday: 'long',
            day: '2-digit',
            month: 'long',
            year: 'numeric',
          })
        : cle
    }
  } else {
    const lignesCat = lignesSite.filter((l) => l.categorieId.toString() === cle)
    label = lignesCat[0]?.categorieNom ?? `Catégorie #${cle}`
    const factureIdSet = new Set(lignesCat.map((l) => l.factureId))
    selected = factures.filter((f) => factureIdSet.has(f.id.toString()))
    const factureById = new Map(selected.map((f) => [f.id.toString(), f]))

    detailLignes = lignesCat.map((l) => {
      const facture = factureById.get(l.factureId)
      const designation =
        l.typeLigne === 'PHARMA'
          ? `${l.produitNom ?? 'Produit'}${l.produitDosage ? ` ${l.produitDosage}` : ''}`
          : (l.acteNom ?? 'Acte')
      return {
        id: l.id.toString(),
        designation,
        categorieNom: l.categorieNom,
        factureNumero: facture?.numero ?? '—',
        factureId: l.factureId,
        quantite: l.quantite,
        montantPatient: round2(l.montantPatient),
        montantAssurance: round2(l.montantAssurance),
        total: round2(l.montantTotal),
      }
    })
  }

  const patientLabels = await resolvePatientLabels(selected.map((f) => f.patientId))

  return toSerializable({
    vue: filters.vue,
    cle,
    label,
    factures: mapDetailFactures(selected, patientLabels),
    lignes: detailLignes,
  }) as RapportCaDetail
}
