'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { toSerializable } from '@/lib/json-bigint'
import { resolvePatientLabels, round2 } from '@/lib/caisse/helpers'
import {
  assertPharmacieAccessible,
  listPharmaciesAccessiblesPourSortie,
  requirePharmacieSortie,
} from '@/lib/pharmacie/access'
import { canValiderSortie } from '@/lib/pharmacie/roles'
import { getCurrentUser } from '@/lib/auth/session'
import type {
  DocumentSortieGroup,
  SortieFefoPreview,
  SortiePharmacieDetail,
  SortiePharmacieRow,
  SortiesGroupedResult,
} from '@/lib/types/pharmacie-sortie'
import { allocateFefo, previewFefo } from '@/lib/pharmacie/fefo'
import {
  getUserPharmacieContext,
  nextPharmaNumero,
  upsertStockLot,
  writeMouvement,
} from '@/lib/pharmacie/stock-helpers'
import { createSortieSchema } from '@/lib/validations/pharmacie-ops'
import {
  endOfDayDouala,
  shiftDoualaDays,
  startOfDayDouala,
} from '@/lib/timezone'

export type ProduitAServir = {
  produitId: string
  produitNom: string
  produitDosage: string | null
  quantiteDemandee: number
  quantiteDejaServie: number
  quantiteRestante: number
  montantPatientUnitaire: number
}

async function loadPharmaLinesFromFeuilleIds(feuilleIds: bigint[]) {
  if (feuilleIds.length === 0) return []
  return prisma.feuilleCirculationLigne.findMany({
    where: { feuilleId: { in: feuilleIds }, typeLigne: 'PHARMA', produitId: { not: null } },
    include: { produit: { select: { id: true, nom: true, dosage: true } } },
  })
}

async function loadPharmaLinesFromPrescriptionIds(prescriptionIds: bigint[]) {
  if (prescriptionIds.length === 0) return []
  return prisma.prescriptionLigne.findMany({
    where: { prescriptionId: { in: prescriptionIds } },
    include: { produit: { select: { id: true, nom: true, dosage: true } } },
  })
}

async function loadFeuilleFactureMap(): Promise<Map<string, bigint>> {
  const links = await prisma.factureFeuille.findMany({
    where: { facture: { statut: { in: ['CONFIRMEE', 'PAYEE'] } } },
    select: { feuilleCirculationId: true, factureId: true },
  })
  return new Map(
    links.map((l) => [l.feuilleCirculationId.toString(), l.factureId]),
  )
}

async function encaissementIdsForFeuilles(feuilleIds: bigint[]): Promise<bigint[]> {
  if (feuilleIds.length === 0) return []
  const rows = await prisma.encaissement.findMany({
    where: { feuilleId: { in: feuilleIds } },
    select: { id: true },
  })
  return rows.map((r) => r.id)
}

async function alreadyServedByProduit(
  encaissementId: bigint | null,
  factureId: bigint | null,
  linkedFeuilleIds: bigint[] = [],
): Promise<Map<string, number>> {
  const feuilleEncIds = await encaissementIdsForFeuilles(linkedFeuilleIds)
  const encIds = [
    ...(encaissementId ? [encaissementId] : []),
    ...feuilleEncIds,
  ]

  const sorties = await prisma.sortiePharmacie.findMany({
    where: {
      OR: [
        ...(encIds.length > 0 ? [{ encaissementId: { in: encIds } }] : []),
        ...(factureId ? [{ factureId }] : []),
      ],
    },
    include: { lignes: true },
  })
  const map = new Map<string, number>()
  for (const s of sorties) {
    for (const l of s.lignes) {
      const key = l.produitId.toString()
      map.set(key, (map.get(key) ?? 0) + l.quantiteServie)
    }
  }
  return map
}

function aggregateDemand(
  lines:
    | Awaited<ReturnType<typeof loadPharmaLinesFromFeuilleIds>>
    | Awaited<ReturnType<typeof loadPharmaLinesFromPrescriptionIds>>,
  served: Map<string, number>,
): ProduitAServir[] {
  const demand = new Map<
    string,
    { nom: string; dosage: string | null; qte: number; montantPatient: number }
  >()
  for (const l of lines) {
    if (!l.produitId || !l.produit) continue
    const key = l.produitId.toString()
    const prev = demand.get(key) ?? {
      nom: l.produit.nom,
      dosage: l.produit.dosage,
      qte: 0,
      montantPatient: 0,
    }
    prev.qte += l.quantite
    prev.montantPatient += Number(l.montantPatient)
    demand.set(key, prev)
  }

  return [...demand.entries()]
    .map(([produitId, d]) => {
      const deja = served.get(produitId) ?? 0
      const restante = Math.max(0, d.qte - deja)
      const unit = d.qte > 0 ? round2(d.montantPatient / d.qte) : 0
      return {
        produitId,
        produitNom: d.nom,
        produitDosage: d.dosage,
        quantiteDemandee: d.qte,
        quantiteDejaServie: deja,
        quantiteRestante: restante,
        montantPatientUnitaire: unit,
      }
    })
    .filter((p) => p.quantiteRestante > 0)
}

function computeStatutService(
  produits: ProduitAServir[],
  sorties: SortiePharmacieRow[],
): Pick<DocumentSortieGroup, 'statutService' | 'nbProduitsRestants'> {
  const nbProduitsRestants = produits.reduce((s, p) => s + p.quantiteRestante, 0)
  if (nbProduitsRestants === 0) {
    return { statutService: 'COMPLETE', nbProduitsRestants: 0 }
  }
  const dejaServi = produits.some((p) => p.quantiteDejaServie > 0) || sorties.length > 0
  return {
    statutService: dejaServi ? 'PARTIELLE' : 'A_SERVIR',
    nbProduitsRestants,
  }
}

function deriveGroupKey(input: {
  factureId: bigint | null
  encaissement?: {
    id: bigint
    type: string
    feuilleId: bigint | null
    prescriptionId?: bigint | null
  } | null
  feuilleToFacture?: Map<string, bigint>
}): { groupKey: string; type: 'FEUILLE' | 'FACTURE' | 'PRESCRIPTION' } {
  if (input.factureId) {
    return { groupKey: `facture:${input.factureId}`, type: 'FACTURE' }
  }
  if (input.encaissement?.feuilleId && input.feuilleToFacture) {
    const linkedFactureId = input.feuilleToFacture.get(
      input.encaissement.feuilleId.toString(),
    )
    if (linkedFactureId) {
      return { groupKey: `facture:${linkedFactureId}`, type: 'FACTURE' }
    }
  }
  if (input.encaissement?.type === 'FEUILLE' && input.encaissement.feuilleId) {
    return {
      groupKey: `feuille:${input.encaissement.feuilleId}`,
      type: 'FEUILLE',
    }
  }
  if (input.encaissement?.type === 'PRESCRIPTION' && input.encaissement.prescriptionId) {
    return {
      groupKey: `prescription:${input.encaissement.prescriptionId}`,
      type: 'PRESCRIPTION',
    }
  }
  if (input.encaissement) {
    return { groupKey: `enc:${input.encaissement.id}`, type: 'FEUILLE' }
  }
  return { groupKey: 'unknown', type: 'FEUILLE' }
}

async function resolveFeuillesPourSortie(input: {
  encaissementId: bigint | null
  factureId: bigint | null
  feuilleIds: bigint[]
}): Promise<{
  encaissementId: bigint | null
  factureId: bigint | null
  feuilleIds: bigint[]
}> {
  let factureId = input.factureId
  let feuilleIds = input.feuilleIds

  if (!factureId && feuilleIds.length === 1) {
    const link = await prisma.factureFeuille.findUnique({
      where: { feuilleCirculationId: feuilleIds[0]! },
      include: { facture: { select: { statut: true } } },
    })
    if (link && ['CONFIRMEE', 'PAYEE'].includes(link.facture.statut)) {
      factureId = link.factureId
    }
  }

  if (factureId) {
    const links = await prisma.factureFeuille.findMany({
      where: { factureId },
      select: { feuilleCirculationId: true },
    })
    feuilleIds = links.map((l) => l.feuilleCirculationId)
  }

  return {
    encaissementId: input.encaissementId,
    factureId,
    feuilleIds,
  }
}

async function buildDocumentGroup(input: {
  groupKey: string
  type: 'FEUILLE' | 'FACTURE' | 'PRESCRIPTION'
  encaissementId: bigint | null
  factureId: bigint | null
  patientId: bigint
  encaissement?: {
    numero: string
    type: string
    feuilleId: bigint | null
    prescriptionId?: bigint | null
    feuille?: { id: bigint; numero: string } | null
    facture?: { id: bigint; numero: string } | null
    prescription?: { id: bigint; numero: string } | null
  } | null
  facture?: { id: bigint; numero: string } | null
  prescription?: { id: bigint; numero: string } | null
  sorties: SortiePharmacieRow[]
  patientLabel: string | null
}): Promise<DocumentSortieGroup> {
  let feuilleIds: bigint[] = []
  let prescriptionIds: bigint[] = []
  let factureId = input.factureId
  const encaissementId = input.encaissementId

  if (input.encaissement?.type === 'FEUILLE' && input.encaissement.feuilleId) {
    feuilleIds = [input.encaissement.feuilleId]
  } else if (input.encaissement?.type === 'PRESCRIPTION' && input.encaissement.prescriptionId) {
    prescriptionIds = [input.encaissement.prescriptionId]
  } else if (factureId) {
    const links = await prisma.factureFeuille.findMany({
      where: { factureId },
      select: { feuilleCirculationId: true },
    })
    feuilleIds = links.map((l) => l.feuilleCirculationId)
  }

  const lines = prescriptionIds.length > 0
    ? await loadPharmaLinesFromPrescriptionIds(prescriptionIds)
    : await loadPharmaLinesFromFeuilleIds(feuilleIds)
  const served = await alreadyServedByProduit(encaissementId, factureId, feuilleIds)
  const produits = aggregateDemand(lines, served)
  const service = computeStatutService(produits, input.sorties)

  const factureNumero =
    input.facture?.numero ?? input.encaissement?.facture?.numero ?? null
  const prescriptionNumero =
    input.prescription?.numero ?? input.encaissement?.prescription?.numero ?? null
  let feuilleNumero =
    input.encaissement?.feuille?.numero ?? null
  if (input.type === 'FACTURE' && feuilleIds.length > 0) {
    const feuilles = await prisma.feuilleCirculation.findMany({
      where: { id: { in: feuilleIds } },
      select: { numero: true },
      orderBy: { numero: 'asc' },
    })
    feuilleNumero = feuilles.map((f) => f.numero).join(', ') || feuilleNumero
  }
  const documentNumero =
    input.type === 'FACTURE'
      ? factureNumero ?? `Facture #${factureId}`
      : input.type === 'PRESCRIPTION'
        ? prescriptionNumero ?? input.encaissement?.numero ?? '—'
      : feuilleNumero ?? input.encaissement?.numero ?? '—'

  const referenceSortie =
    input.encaissement?.numero ?? factureNumero ?? documentNumero

  const dates = [
    ...input.sorties.map((s) => s.createdAt).filter(Boolean),
  ] as string[]

  return {
    groupKey: input.groupKey,
    type: input.type,
    documentNumero,
    encaissementId: encaissementId?.toString() ?? null,
    encaissementNumero: input.encaissement?.numero ?? null,
    factureId: factureId?.toString() ?? null,
    factureNumero,
    feuilleId:
      input.encaissement?.feuille?.id.toString() ??
      input.encaissement?.feuilleId?.toString() ??
      null,
    feuilleNumero,
    prescriptionId:
      input.prescription?.id.toString() ??
      input.encaissement?.prescription?.id.toString() ??
      input.encaissement?.prescriptionId?.toString() ??
      null,
    prescriptionNumero,
    patientId: input.patientId.toString(),
    patientLabel: input.patientLabel,
    referenceSortie,
    sorties: input.sorties,
    derniereActivite: dates.sort().reverse()[0] ?? null,
    ...service,
  }
}

export async function listDocumentsSortieGrouped(
  pharmacieId?: string,
): Promise<SortiesGroupedResult> {
  await requirePharmacieSortie()
  const pharmacies = await listPharmaciesAccessiblesPourSortie()

  let pharmacieFilter: bigint[] = pharmacies.map((p) => BigInt(p.id))
  if (pharmacieId) {
    await assertPharmacieAccessible(pharmacieId)
    pharmacieFilter = [BigInt(pharmacieId)]
  }

  const defaultPharmacieId =
    pharmacieId ?? (pharmacies.length === 1 ? pharmacies[0]!.id : null)

  const feuilleToFacture = await loadFeuilleFactureMap()

  const sortieRows = await prisma.sortiePharmacie.findMany({
    where: { pharmacieId: { in: pharmacieFilter } },
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    take: 300,
    include: {
      pharmacie: { select: { nom: true } },
      user: { select: { name: true } },
      encaissement: {
        select: {
          id: true,
          numero: true,
          type: true,
          feuilleId: true,
          factureId: true,
          prescriptionId: true,
          patientId: true,
          feuille: { select: { id: true, numero: true } },
          facture: { select: { id: true, numero: true } },
          prescription: { select: { id: true, numero: true } },
        },
      },
      facture: { select: { id: true, numero: true, patientId: true } },
    },
  })

  const sortiesByGroup = new Map<string, SortiePharmacieRow[]>()
  const groupMeta = new Map<
    string,
    {
      type: 'FEUILLE' | 'FACTURE' | 'PRESCRIPTION'
      encaissementId: bigint | null
      factureId: bigint | null
      patientId: bigint
      encaissement: (typeof sortieRows)[number]['encaissement']
      facture: { id: bigint; numero: string } | null
      prescription: { id: bigint; numero: string } | null
    }
  >()

  for (const s of sortieRows) {
    const factureId = s.factureId ?? s.encaissement?.factureId ?? null
    const { groupKey, type } = deriveGroupKey({
      factureId,
      encaissement: s.encaissement,
      feuilleToFacture,
    })
    if (groupKey === 'unknown') continue

    const row: SortiePharmacieRow = {
      id: s.id.toString(),
      numero: s.numero,
      statut: s.statut,
      nbLignes: 0,
      userNom: s.user.name,
      pharmacieNom: s.pharmacie.nom,
      createdAt: s.createdAt?.toISOString() ?? null,
    }

    if (!sortiesByGroup.has(groupKey)) sortiesByGroup.set(groupKey, [])
    sortiesByGroup.get(groupKey)!.push(row)

    if (!groupMeta.has(groupKey)) {
      groupMeta.set(groupKey, {
        type,
        encaissementId: s.encaissementId,
        factureId: factureId ?? s.factureId,
        patientId: s.patientId,
        encaissement: s.encaissement,
        facture: s.facture
          ? { id: s.facture.id, numero: s.facture.numero }
          : s.encaissement?.facture ?? null,
        prescription: s.encaissement?.prescription ?? null,
      })
    }
  }

  const sortieIds = sortieRows.map((s) => s.id)
  if (sortieIds.length > 0) {
    const counts = await prisma.sortiePharmacieLigne.groupBy({
      by: ['sortieId'],
      where: { sortieId: { in: sortieIds } },
      _count: { _all: true },
    })
    const countMap = new Map(counts.map((c) => [c.sortieId.toString(), c._count._all]))
    for (const list of sortiesByGroup.values()) {
      for (const row of list) {
        row.nbLignes = countMap.get(row.id) ?? 0
      }
    }
  }

  const encaissements = await prisma.encaissement.findMany({
    orderBy: { createdAt: 'desc' },
    take: 150,
    include: {
      feuille: { select: { id: true, numero: true } },
      facture: { select: { id: true, numero: true } },
      prescription: { select: { id: true, numero: true } },
    },
  })

  const patientIds = new Set<bigint>()
  for (const meta of groupMeta.values()) patientIds.add(meta.patientId)
  for (const enc of encaissements) patientIds.add(enc.patientId)

  for (const enc of encaissements) {
    const factureId = enc.factureId
    if (
      enc.type === 'FEUILLE' &&
      enc.feuilleId &&
      feuilleToFacture.has(enc.feuilleId.toString())
    ) {
      continue
    }
    const { groupKey, type } = deriveGroupKey({
      factureId,
      encaissement: enc,
      feuilleToFacture,
    })
    if (groupKey === 'unknown' || groupMeta.has(groupKey)) continue

    const feuilleIds =
      enc.type === 'FEUILLE' && enc.feuilleId
        ? [enc.feuilleId]
        : factureId
          ? (
              await prisma.factureFeuille.findMany({
                where: { factureId },
                select: { feuilleCirculationId: true },
              })
            ).map((l) => l.feuilleCirculationId)
          : []
    const prescriptionIds =
      enc.type === 'PRESCRIPTION' && enc.prescriptionId ? [enc.prescriptionId] : []

    const lines = prescriptionIds.length > 0
      ? await loadPharmaLinesFromPrescriptionIds(prescriptionIds)
      : await loadPharmaLinesFromFeuilleIds(feuilleIds)
    if (lines.length === 0) continue

    const served = await alreadyServedByProduit(enc.id, factureId, feuilleIds)
    const produits = aggregateDemand(lines, served)
    if (produits.length === 0) continue

    groupMeta.set(groupKey, {
      type,
      encaissementId: enc.id,
      factureId,
      patientId: enc.patientId,
      encaissement: enc,
      facture: enc.facture,
      prescription: enc.prescription,
    })
    sortiesByGroup.set(groupKey, [])
  }

  const factures = await prisma.facture.findMany({
    where: { statut: { in: ['CONFIRMEE', 'PAYEE'] } },
    orderBy: { createdAt: 'desc' },
    take: 80,
    select: { id: true, numero: true, patientId: true },
  })

  for (const fac of factures) {
    const groupKey = `facture:${fac.id}`
    if (groupMeta.has(groupKey)) continue

    const links = await prisma.factureFeuille.findMany({
      where: { factureId: fac.id },
      select: { feuilleCirculationId: true },
    })
    const feuilleIds = links.map((l) => l.feuilleCirculationId)
    const lines = await loadPharmaLinesFromFeuilleIds(feuilleIds)
    if (lines.length === 0) continue

    const served = await alreadyServedByProduit(null, fac.id, feuilleIds)
    const produits = aggregateDemand(lines, served)
    if (produits.length === 0) continue

    groupMeta.set(groupKey, {
      type: 'FACTURE',
      encaissementId: null,
      factureId: fac.id,
      patientId: fac.patientId,
      encaissement: null,
      facture: fac,
      prescription: null,
    })
    sortiesByGroup.set(groupKey, [])
    patientIds.add(fac.patientId)
  }

  const allLabels = await resolvePatientLabels([...patientIds])

  const groups: DocumentSortieGroup[] = []
  for (const [groupKey, meta] of groupMeta) {
    if (
      meta.type === 'FEUILLE' &&
      meta.encaissement?.feuilleId &&
      feuilleToFacture.has(meta.encaissement.feuilleId.toString())
    ) {
      continue
    }
    groups.push(
      await buildDocumentGroup({
        groupKey,
        type: meta.type,
        encaissementId: meta.encaissementId,
        factureId: meta.factureId,
        patientId: meta.patientId,
        encaissement: meta.encaissement,
        facture: meta.facture,
        prescription: meta.prescription,
        sorties: sortiesByGroup.get(groupKey) ?? [],
        patientLabel: allLabels.get(meta.patientId.toString())?.label ?? null,
      }),
    )
  }

  groups.sort((a, b) => {
    const rank = (s: DocumentSortieGroup['statutService']) =>
      s === 'A_SERVIR' ? 0 : s === 'PARTIELLE' ? 1 : 2
    const dr = rank(a.statutService) - rank(b.statutService)
    if (dr !== 0) return dr
    const da = a.derniereActivite ? new Date(a.derniereActivite).getTime() : 0
    const db = b.derniereActivite ? new Date(b.derniereActivite).getTime() : 0
    return db - da
  })

  return toSerializable({
    pharmacies,
    defaultPharmacieId,
    groups,
  }) as SortiesGroupedResult
}

export async function getSortiesNavCount(): Promise<number> {
  const user = await getCurrentUser()
  if (!user || !canValiderSortie(user.roles)) return 0

  try {
    const { groups } = await listDocumentsSortieGrouped()
    return groups.filter((g) => g.statutService !== 'COMPLETE').length
  } catch {
    return 0
  }
}

export async function lookupDocumentPourSortie(reference: string) {
  const user = await requirePharmacieSortie()
  const ctx = await getUserPharmacieContext(user.id)
  const ref = reference.trim()
  if (!ref) throw new Error('Référence obligatoire.')

  const encaissement = await prisma.encaissement.findFirst({
    where: { numero: { equals: ref, mode: 'insensitive' } },
    include: {
      feuille: { select: { id: true } },
      facture: { select: { id: true, numero: true } },
      prescription: { select: { id: true, numero: true } },
    },
  })

  let factureId: bigint | null = null
  let encaissementId: bigint | null = null
  let patientId: bigint | null = null
  let label = ref
  let feuilleIds: bigint[] = []
  let prescriptionIds: bigint[] = []

  if (encaissement) {
    encaissementId = encaissement.id
    patientId = encaissement.patientId
    label = `Reçu ${encaissement.numero}`
    if (encaissement.type === 'FEUILLE' && encaissement.feuilleId) {
      feuilleIds = [encaissement.feuilleId]
    } else if (encaissement.type === 'PRESCRIPTION' && encaissement.prescriptionId) {
      prescriptionIds = [encaissement.prescriptionId]
      label = `Reçu ${encaissement.numero} (prescription ${encaissement.prescription?.numero ?? ''})`
    } else if (encaissement.factureId) {
      factureId = encaissement.factureId
      label = `Reçu ${encaissement.numero} (facture ${encaissement.facture?.numero ?? ''})`
    }
  } else {
    const prescription = await prisma.prescription.findFirst({
      where: {
        numero: { equals: ref, mode: 'insensitive' },
        statutPaiement: 'PAYEE',
      },
      select: { id: true, numero: true, visiteId: true },
    })
    if (prescription) {
      prescriptionIds = [prescription.id]
      encaissementId = (
        await prisma.encaissement.findFirst({
          where: { prescriptionId: prescription.id },
          select: { id: true },
        })
      )?.id ?? null
      patientId = (
        await prisma.visite.findUnique({
          where: { id: prescription.visiteId },
          select: { patientId: true },
        })
      )?.patientId ?? null
      label = `Prescription ${prescription.numero}`
    } else {
    const facture = await prisma.facture.findFirst({
      where: {
        numero: { equals: ref, mode: 'insensitive' },
        statut: { in: ['CONFIRMEE', 'PAYEE'] },
      },
    })
    if (!facture) throw new Error('Aucun reçu ou facture trouvé pour cette référence.')
    factureId = facture.id
    patientId = facture.patientId
    label = `Facture ${facture.numero}`
    }
  }

  if (factureId) {
    const links = await prisma.factureFeuille.findMany({
      where: { factureId },
      select: { feuilleCirculationId: true },
    })
    feuilleIds = links.map((l) => l.feuilleCirculationId)
  }

  const resolved = await resolveFeuillesPourSortie({
    encaissementId,
    factureId,
    feuilleIds,
  })
  encaissementId = resolved.encaissementId
  factureId = resolved.factureId
  feuilleIds = resolved.feuilleIds

  if (factureId && encaissement && encaissement.type === 'FEUILLE') {
    const fac = await prisma.facture.findUnique({
      where: { id: factureId },
      select: { numero: true },
    })
    if (fac) {
      label = `Facture ${fac.numero} (reçu ${encaissement.numero})`
    }
  }

  const lines = prescriptionIds.length > 0
    ? await loadPharmaLinesFromPrescriptionIds(prescriptionIds)
    : await loadPharmaLinesFromFeuilleIds(feuilleIds)
  const served = await alreadyServedByProduit(encaissementId, factureId, feuilleIds)
  const produits = aggregateDemand(lines, served)

  const patient = await prisma.patient.findUnique({
    where: { id: patientId! },
    select: { patName: true, patSurname: true },
  })

  return toSerializable({
    label,
    encaissementId: encaissementId?.toString() ?? null,
    factureId: factureId?.toString() ?? null,
    patientId: patientId!.toString(),
    patientLabel: patient
      ? `${patient.patSurname} ${patient.patName}`.trim()
      : `Patient #${patientId}`,
    pharmacieNom: ctx.pharmacieNom,
    magasinNom: ctx.magasinNom,
    produits,
  })
}

export async function previewSortieFefo(
  lignes: { produitId: string; quantite: number }[],
): Promise<SortieFefoPreview> {
  const user = await requirePharmacieSortie()
  const ctx = await getUserPharmacieContext(user.id)

  const produits: SortieFefoPreview['produits'] = []
  let peutValider = lignes.some((l) => l.quantite > 0)

  for (const ligne of lignes) {
    if (ligne.quantite <= 0) continue

    const preview = await previewFefo(
      ctx.magasinId,
      BigInt(ligne.produitId),
      ligne.quantite,
    )

    const allocByLot = new Map(
      preview.allocations.map((a) => [a.stockLotId.toString(), a.quantite]),
    )

    const lots = preview.lotsDisponibles.map((lot) => ({
      stockLotId: lot.stockLotId.toString(),
      numeroLot: lot.numeroLot,
      datePeremption: lot.datePeremption.toISOString(),
      quantiteDisponible: lot.quantite,
      quantiteAllouee: allocByLot.get(lot.stockLotId.toString()) ?? 0,
    }))

    const stockSuffisant = preview.stockSuffisant
    if (!stockSuffisant) peutValider = false

    produits.push({
      produitId: ligne.produitId,
      quantite: ligne.quantite,
      stockDisponible: preview.stockDisponible,
      stockSuffisant,
      lots,
      message: stockSuffisant
        ? null
        : `Stock insuffisant (${preview.stockDisponible} disponible, ${ligne.quantite} demandé).`,
    })
  }

  if (!lignes.some((l) => l.quantite > 0)) peutValider = false

  return toSerializable({
    pharmacieNom: ctx.pharmacieNom,
    magasinNom: ctx.magasinNom,
    produits,
    peutValider,
  }) as SortieFefoPreview
}

export async function listSorties() {
  await requirePharmacieSortie()
  const rows = await prisma.sortiePharmacie.findMany({
    orderBy: { createdAt: 'desc' },
    take: 100,
    include: {
      pharmacie: { select: { nom: true } },
      user: { select: { name: true } },
      encaissement: { select: { numero: true } },
      facture: { select: { numero: true } },
      _count: { select: { lignes: true } },
    },
  })
  return toSerializable(
    rows.map((s) => ({
      id: s.id.toString(),
      numero: s.numero,
      pharmacieNom: s.pharmacie.nom,
      userNom: s.user.name,
      statut: s.statut,
      encaissementNumero: s.encaissement?.numero ?? null,
      factureNumero: s.facture?.numero ?? null,
      patientId: s.patientId.toString(),
      nbLignes: s._count.lignes,
      createdAt: s.createdAt?.toISOString() ?? null,
    })),
  )
}

export async function getSortie(id: string): Promise<SortiePharmacieDetail | null> {
  await requirePharmacieSortie()
  const s = await prisma.sortiePharmacie.findUnique({
    where: { id: BigInt(id) },
    include: {
      pharmacie: { select: { nom: true } },
      magasin: { select: { nom: true } },
      user: { select: { name: true } },
      encaissement: {
        select: {
          id: true,
          numero: true,
          feuilleId: true,
          prescriptionId: true,
          feuille: { select: { id: true, numero: true } },
          prescription: { select: { id: true, numero: true } },
        },
      },
      facture: { select: { id: true, numero: true } },
      lignes: {
        include: { produit: { select: { nom: true, dosage: true } } },
        orderBy: [{ produitId: 'asc' }, { datePeremption: 'asc' }],
      },
    },
  })
  if (!s) return null

  const labels = await resolvePatientLabels([s.patientId])

  let feuilleId = s.encaissement?.feuilleId?.toString() ?? null
  let feuilleNumero = s.encaissement?.feuille?.numero ?? null
  const prescriptionId = s.encaissement?.prescriptionId?.toString() ?? null
  const prescriptionNumero = s.encaissement?.prescription?.numero ?? null
  if (!feuilleId && s.factureId) {
    const link = await prisma.factureFeuille.findFirst({
      where: { factureId: s.factureId },
      include: { feuille: { select: { id: true, numero: true } } },
    })
    if (link) {
      feuilleId = link.feuilleCirculationId.toString()
      feuilleNumero = link.feuille.numero
    }
  }

  return toSerializable({
    id: s.id.toString(),
    numero: s.numero,
    pharmacieNom: s.pharmacie.nom,
    magasinNom: s.magasin.nom,
    userNom: s.user.name,
    statut: s.statut,
    encaissementId: s.encaissementId?.toString() ?? null,
    encaissementNumero: s.encaissement?.numero ?? null,
    factureId: s.factureId?.toString() ?? null,
    factureNumero: s.facture?.numero ?? null,
    feuilleId,
    feuilleNumero,
    prescriptionId,
    prescriptionNumero,
    patientId: s.patientId.toString(),
    patientLabel: labels.get(s.patientId.toString())?.label ?? null,
    createdAt: s.createdAt?.toISOString() ?? null,
    lignes: s.lignes.map((l) => ({
      id: l.id.toString(),
      produitNom: l.produit.nom,
      produitDosage: l.produit.dosage,
      quantiteDemandee: l.quantiteDemandee,
      quantiteServie: l.quantiteServie,
      numeroLot: l.numeroLot,
      datePeremption: l.datePeremption.toISOString(),
      montantPatientUnitaire: round2(Number(l.montantPatientUnitaire)),
    })),
  }) as SortiePharmacieDetail
}

async function resolveDocumentDemand(encaissementId?: string | null, factureId?: string | null) {
  let encId: bigint | null = encaissementId ? BigInt(encaissementId) : null
  let facId: bigint | null = factureId ? BigInt(factureId) : null
  let patientId: bigint | null = null
  let feuilleIds: bigint[] = []

  if (encId) {
    const enc = await prisma.encaissement.findUnique({ where: { id: encId } })
    if (!enc) throw new Error('Reçu introuvable.')
    patientId = enc.patientId
    if (enc.type === 'FEUILLE' && enc.feuilleId) feuilleIds = [enc.feuilleId]
    else if (enc.type === 'PRESCRIPTION' && enc.prescriptionId) {
      const lines = await loadPharmaLinesFromPrescriptionIds([enc.prescriptionId])
      const served = await alreadyServedByProduit(encId, null, [])
      return {
        patientId: patientId!,
        encaissementId: encId,
        factureId: null,
        produits: aggregateDemand(lines, served),
      }
    }
    else if (enc.factureId) facId = enc.factureId
  } else if (facId) {
    const fac = await prisma.facture.findUnique({ where: { id: facId } })
    if (!fac || (fac.statut !== 'CONFIRMEE' && fac.statut !== 'PAYEE')) {
      throw new Error('Facture introuvable ou non confirmée.')
    }
    patientId = fac.patientId
  } else {
    throw new Error('Indiquez un reçu ou une facture.')
  }

  if (facId) {
    const links = await prisma.factureFeuille.findMany({
      where: { factureId: facId },
      select: { feuilleCirculationId: true },
    })
    feuilleIds = links.map((l) => l.feuilleCirculationId)
  }

  const resolved = await resolveFeuillesPourSortie({
    encaissementId: encId,
    factureId: facId,
    feuilleIds,
  })
  encId = resolved.encaissementId
  facId = resolved.factureId
  feuilleIds = resolved.feuilleIds

  const lines = await loadPharmaLinesFromFeuilleIds(feuilleIds)
  const served = await alreadyServedByProduit(encId, facId, feuilleIds)
  return {
    patientId: patientId!,
    encaissementId: encId,
    factureId: facId,
    produits: aggregateDemand(lines, served),
  }
}

export async function validerSortie(
  data: unknown,
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  try {
    const user = await requirePharmacieSortie()
    const v = createSortieSchema.parse(data)
    if (!v.encaissementId && !v.factureId) {
      throw new Error('Indiquez un reçu ou une facture.')
    }

    const ctx = await getUserPharmacieContext(user.id)
    const doc = await resolveDocumentDemand(v.encaissementId, v.factureId)
    const demandByProduit = new Map(doc.produits.map((p) => [p.produitId, p]))

    const id = await prisma.$transaction(async (tx) => {
      const numero = await nextPharmaNumero('SOR', tx, 'sortiePharmacie')
      const sortie = await tx.sortiePharmacie.create({
        data: {
          numero,
          pharmacieId: ctx.pharmacieId,
          magasinId: ctx.magasinId,
          encaissementId: doc.encaissementId,
          factureId: doc.factureId,
          patientId: doc.patientId,
          userId: user.id,
          statut: 'PARTIELLE',
        },
      })

      let totalServi = 0
      let totalDemandeRestante = 0
      for (const p of doc.produits) totalDemandeRestante += p.quantiteRestante

      for (const ligne of v.lignes) {
        const demand = demandByProduit.get(ligne.produitId)
        if (!demand) throw new Error(`Produit #${ligne.produitId} absent du document.`)
        if (ligne.quantite > demand.quantiteRestante) {
          throw new Error(
            `Quantité trop élevée pour ${demand.produitNom} (reste ${demand.quantiteRestante}).`,
          )
        }

        const allocations = await allocateFefo(
          ctx.magasinId,
          BigInt(ligne.produitId),
          ligne.quantite,
          tx,
        )

        for (const alloc of allocations) {
          await tx.sortiePharmacieLigne.create({
            data: {
              sortieId: sortie.id,
              produitId: BigInt(ligne.produitId),
              quantiteDemandee: demand.quantiteDemandee,
              quantiteServie: alloc.quantite,
              stockLotId: alloc.stockLotId,
              numeroLot: alloc.numeroLot,
              datePeremption: alloc.datePeremption,
              montantPatientUnitaire: round2(ligne.montantPatientUnitaire),
            },
          })
          await upsertStockLot(tx, {
            produitId: BigInt(ligne.produitId),
            magasinId: ctx.magasinId,
            numeroLot: alloc.numeroLot,
            datePeremption: alloc.datePeremption,
            quantiteDelta: -alloc.quantite,
          })
          await writeMouvement(tx, {
            type: 'SORTIE',
            stockLotId: alloc.stockLotId,
            quantite: -alloc.quantite,
            referenceType: 'SortiePharmacie',
            referenceId: sortie.id,
            userId: user.id,
          })
          totalServi += alloc.quantite
        }
      }

      const statut = totalServi >= totalDemandeRestante ? 'COMPLETE' : 'PARTIELLE'
      await tx.sortiePharmacie.update({
        where: { id: sortie.id },
        data: { statut },
      })

      return sortie.id
    })

    revalidatePath('/pharmacie/sorties')
    revalidatePath('/pharmacie/sorties/medicaments-sortis')
    revalidatePath('/pharmacie/stock')
    return { ok: true, id: id.toString() }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Erreur' }
  }
}

export type MedicamentSortiPeriod = 'today' | 'yesterday' | 'week' | 'month' | 'all'

export type MedicamentSortiRow = {
  ligneId: string
  produitId: string
  produitNom: string
  produitDosage: string | null
  quantiteServie: number
  numeroLot: string
  datePeremption: string
  sortieId: string
  sortieNumero: string
  pharmacieId: string
  pharmacieNom: string
  patientId: string
  patientLabel: string | null
  userNom: string
  factureNumero: string | null
  encaissementNumero: string | null
  createdAt: string | null
}

function periodCreatedAtFilter(period: MedicamentSortiPeriod): {
  gte?: Date
  lte?: Date
} {
  const now = new Date()
  if (period === 'today') {
    return { gte: startOfDayDouala(now), lte: endOfDayDouala(now) }
  }
  if (period === 'yesterday') {
    const y = shiftDoualaDays(now, -1)
    return { gte: startOfDayDouala(y), lte: endOfDayDouala(y) }
  }
  if (period === 'week') {
    return {
      gte: startOfDayDouala(shiftDoualaDays(now, -6)),
      lte: endOfDayDouala(now),
    }
  }
  if (period === 'month') {
    return {
      gte: startOfDayDouala(shiftDoualaDays(now, -29)),
      lte: endOfDayDouala(now),
    }
  }
  return {}
}

export async function listMedicamentsSortis(params?: {
  period?: MedicamentSortiPeriod
  pharmacieId?: string
  q?: string
}): Promise<{
  rows: MedicamentSortiRow[]
  pharmacies: { id: string; nom: string; magasinNom: string }[]
  period: MedicamentSortiPeriod
  totalQuantite: number
}> {
  await requirePharmacieSortie()
  const pharmacies = await listPharmaciesAccessiblesPourSortie()
  const period = params?.period ?? 'today'

  let pharmacieFilter: bigint[] = pharmacies.map((p) => BigInt(p.id))
  if (params?.pharmacieId) {
    await assertPharmacieAccessible(params.pharmacieId)
    pharmacieFilter = [BigInt(params.pharmacieId)]
  }

  const createdAt = periodCreatedAtFilter(period)
  const hasDateFilter = createdAt.gte != null || createdAt.lte != null

  const lignes = await prisma.sortiePharmacieLigne.findMany({
    where: {
      quantiteServie: { gt: 0 },
      sortie: {
        pharmacieId: { in: pharmacieFilter },
        ...(hasDateFilter ? { createdAt } : {}),
      },
    },
    include: {
      produit: { select: { id: true, nom: true, dosage: true } },
      sortie: {
        include: {
          pharmacie: { select: { id: true, nom: true } },
          user: { select: { name: true } },
          facture: { select: { numero: true } },
          encaissement: { select: { numero: true } },
        },
      },
    },
    orderBy: [{ sortie: { createdAt: 'desc' } }, { id: 'desc' }],
    take: period === 'all' ? 500 : 400,
  })

  const patientIds = [...new Set(lignes.map((l) => l.sortie.patientId))]
  const labels = await resolvePatientLabels(patientIds)

  let rows: MedicamentSortiRow[] = lignes.map((l) => ({
    ligneId: l.id.toString(),
    produitId: l.produitId.toString(),
    produitNom: l.produit.nom,
    produitDosage: l.produit.dosage,
    quantiteServie: l.quantiteServie,
    numeroLot: l.numeroLot,
    datePeremption: l.datePeremption.toISOString(),
    sortieId: l.sortieId.toString(),
    sortieNumero: l.sortie.numero,
    pharmacieId: l.sortie.pharmacie.id.toString(),
    pharmacieNom: l.sortie.pharmacie.nom,
    patientId: l.sortie.patientId.toString(),
    patientLabel: labels.get(l.sortie.patientId.toString())?.label ?? null,
    userNom: l.sortie.user.name,
    factureNumero: l.sortie.facture?.numero ?? null,
    encaissementNumero: l.sortie.encaissement?.numero ?? null,
    createdAt: l.sortie.createdAt?.toISOString() ?? null,
  }))

  const q = params?.q?.trim().toLowerCase()
  if (q) {
    rows = rows.filter(
      (r) =>
        r.produitNom.toLowerCase().includes(q) ||
        (r.produitDosage?.toLowerCase().includes(q) ?? false) ||
        r.sortieNumero.toLowerCase().includes(q) ||
        r.numeroLot.toLowerCase().includes(q) ||
        r.pharmacieNom.toLowerCase().includes(q) ||
        r.userNom.toLowerCase().includes(q) ||
        (r.patientLabel?.toLowerCase().includes(q) ?? false) ||
        (r.factureNumero?.toLowerCase().includes(q) ?? false) ||
        (r.encaissementNumero?.toLowerCase().includes(q) ?? false),
    )
  }

  const totalQuantite = rows.reduce((s, r) => s + r.quantiteServie, 0)

  return toSerializable({
    rows,
    pharmacies: pharmacies.map((p) => ({
      id: p.id,
      nom: p.nom,
      magasinNom: p.magasinNom,
    })),
    period,
    totalQuantite,
  })
}
