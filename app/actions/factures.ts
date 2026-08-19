'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { toSerializable } from '@/lib/json-bigint'
import { confirmFactureSchema, createFactureSchema } from '@/lib/validations/facture'
import { requireUserId } from '@/lib/auth/session'
import {
  getFeuillesInConfirmedFactureIds,
  loadFeuilleLignes,
  nextFactureNumero,
  resolvePatientLabels,
  round2,
  sumFeuilleMontants,
} from '@/lib/caisse/helpers'
import { isNonAssureAssuranceName } from '@/lib/assurance/non-assure'
import { loadFactureHistoriquePaiements } from '@/lib/facture/payment-history'
import {
  resolveActiveAssuranceId,
  suiviAssureurFromBordereau,
} from '@/lib/bordereau/helpers'
import type {
  FactureDetail,
  FactureListRow,
  FacturePrintData,
  FactureStatut,
  FeuilleEligibleFacture,
  VisiteFeuillesEligibles,
} from '@/lib/types/facture'
import type { BordereauStatut, FactureSuiviAssureur } from '@/lib/types/bordereau'
import { notifyEventAsync } from '@/lib/notifications/create-notification'
import { formatFactureNumero } from '@/lib/formatting'

async function feuillesDejaFacturees(): Promise<Set<string>> {
  const links = await prisma.factureFeuille.findMany({
    select: { feuilleCirculationId: true },
  })
  return new Set(links.map((l) => l.feuilleCirculationId.toString()))
}

export async function listVisitesAvecFeuillesEligibles(): Promise<VisiteFeuillesEligibles[]> {
  const deja = await feuillesDejaFacturees()
  const locked = new Set((await getFeuillesInConfirmedFactureIds()).map(String))

  const feuilles = await prisma.feuilleCirculation.findMany({
    where: {
      statut: 'CONFIRMEE',
    },
    include: {
      visite: {
        select: {
          id: true,
          patientId: true,
          dateVisite: true,
          medecin: { select: { name: true, titre: true } },
        },
      },
    },
    orderBy: { confirmedAt: 'desc' },
  })

  const eligible = feuilles.filter(
    (f) => !deja.has(f.id.toString()) && !locked.has(f.id.toString()),
  )

  const byVisite = new Map<string, typeof eligible>()
  for (const f of eligible) {
    const vid = f.visiteId.toString()
    if (!byVisite.has(vid)) byVisite.set(vid, [])
    byVisite.get(vid)!.push(f)
  }

  const patientIds = [...new Set(eligible.map((f) => f.visite.patientId))]
  const labels = await resolvePatientLabels(patientIds)

  const out: VisiteFeuillesEligibles[] = []
  for (const [visiteId, list] of byVisite) {
    const v = list[0].visite
    const feuilleRows: FeuilleEligibleFacture[] = []
    for (const f of list) {
      const m = await sumFeuilleMontants(f.id)
      feuilleRows.push({
        id: f.id.toString(),
        numero: f.numero,
        libelle: f.libelle,
        montantPatient: m.montantPatient,
        montantAssurance: m.montantAssurance,
        statutPaiement: f.statutPaiement as 'IMPAYEE' | 'PAYEE',
        confirmedAt: f.confirmedAt ? f.confirmedAt.toISOString() : null,
      })
    }
    const pl = labels.get(v.patientId.toString())
    out.push({
      visiteId,
      dateVisite: v.dateVisite.toISOString(),
      patientId: v.patientId.toString(),
      patientLabel: pl?.label ?? null,
      medecinNom: v.medecin
        ? `${v.medecin.titre ? v.medecin.titre + ' ' : ''}${v.medecin.name}`
        : null,
      feuilles: feuilleRows,
    })
  }

  out.sort((a, b) => new Date(b.dateVisite).getTime() - new Date(a.dateVisite).getTime())
  return toSerializable(out) as VisiteFeuillesEligibles[]
}

function mapFactureListRow(
  f: {
    id: bigint
    numero: string
    visiteId: bigint
    patientId: bigint
    statut: string
    montantPatient: { toString(): string } | number
    montantAssurance: { toString(): string } | number
    confirmedAt: Date | null
    paidAt: Date | null
    createdAt: Date | null
    assuranceId: bigint | null
    assurance: { id: bigint; nom: string } | null
    bordereauFacture: {
      bordereau: { id: bigint; numero: string; statut: string }
    } | null
    _count: { feuilles: number }
  },
  patientLabel: string | null,
): FactureListRow {
  const montantAssurance = round2(Number(f.montantAssurance))
  let suiviAssureur: FactureSuiviAssureur | null = null
  if (montantAssurance > 0) {
    const assuranceNom = f.assurance?.nom ?? null
    const nonAssure = assuranceNom ? isNonAssureAssuranceName(assuranceNom) : !f.assuranceId
    if (!nonAssure && (f.assuranceId || f.assurance)) {
      const b = f.bordereauFacture?.bordereau
      suiviAssureur = {
        statut: suiviAssureurFromBordereau(b?.statut as BordereauStatut | undefined),
        bordereauId: b?.id.toString() ?? null,
        bordereauNumero: b?.numero ?? null,
        assuranceId: (f.assuranceId ?? f.assurance?.id)?.toString() ?? null,
        assuranceNom,
      }
    }
  }

  return {
    id: f.id.toString(),
    numero: f.numero,
    visiteId: f.visiteId.toString(),
    patientId: f.patientId.toString(),
    patientLabel,
    statut: f.statut as FactureStatut,
    montantPatient: round2(Number(f.montantPatient)),
    montantAssurance,
    nbFeuilles: f._count.feuilles,
    confirmedAt: f.confirmedAt ? f.confirmedAt.toISOString() : null,
    paidAt: f.paidAt ? f.paidAt.toISOString() : null,
    createdAt: f.createdAt ? f.createdAt.toISOString() : null,
    suiviAssureur,
  }
}

const factureListInclude = {
  _count: { select: { feuilles: true } },
  assurance: { select: { id: true, nom: true } },
  bordereauFacture: {
    include: {
      bordereau: { select: { id: true, numero: true, statut: true } },
    },
  },
} as const

export async function listFactures(params?: {
  q?: string
  statut?: string
}): Promise<FactureListRow[]> {
  const where: { statut?: string; OR?: object[] } = {}
  if (params?.statut && params.statut !== 'all') {
    where.statut = params.statut
  }
  if (params?.q?.trim()) {
    const term = params.q.trim()
    where.OR = [
      { numero: { contains: term, mode: 'insensitive' } },
      ...( /^\d+$/.test(term) ? [{ patientId: BigInt(term) }] : []),
    ]
  }

  const rows = await prisma.facture.findMany({
    where: Object.keys(where).length ? where : undefined,
    orderBy: [{ createdAt: 'desc' }],
    include: factureListInclude,
  })

  const labels = await resolvePatientLabels(rows.map((r) => r.patientId))

  return toSerializable(
    rows.map((f) =>
      mapFactureListRow(f, labels.get(f.patientId.toString())?.label ?? null),
    ),
  ) as FactureListRow[]
}

export async function getFacturesByPatientId(patientId: string): Promise<FactureListRow[]> {
  const rows = await prisma.facture.findMany({
    where: { patientId: BigInt(patientId) },
    orderBy: [{ createdAt: 'desc' }],
    include: factureListInclude,
  })
  const labels = await resolvePatientLabels([BigInt(patientId)])
  const pl = labels.get(patientId)?.label ?? null
  return toSerializable(rows.map((f) => mapFactureListRow(f, pl))) as FactureListRow[]
}

function buildSuiviAssureur(
  f: {
    patientId: bigint
    montantAssurance: { toString(): string } | number
    assuranceId: bigint | null
    assurance: { id: bigint; nom: string } | null
    bordereauFacture: {
      bordereau: { id: bigint; numero: string; statut: string }
    } | null
    visite: { dateVisite: Date }
  },
  resolvedAssuranceId: bigint | null,
  resolvedAssuranceNom: string | null,
): FactureSuiviAssureur | null {
  const montant = Number(f.montantAssurance)
  if (montant <= 0) return null

  let assuranceId = resolvedAssuranceId
  let assuranceNom = resolvedAssuranceNom
  if (assuranceNom && isNonAssureAssuranceName(assuranceNom)) {
    assuranceId = null
    assuranceNom = null
  }
  if (!assuranceId) return null

  const b = f.bordereauFacture?.bordereau
  return {
    statut: suiviAssureurFromBordereau(b?.statut as BordereauStatut | undefined),
    bordereauId: b?.id.toString() ?? null,
    bordereauNumero: b?.numero ?? null,
    assuranceId: assuranceId.toString(),
    assuranceNom,
  }
}

export async function getFactureById(id: string): Promise<FactureDetail | null> {
  const f = await prisma.facture.findUnique({
    where: { id: BigInt(id) },
    include: {
      visite: {
        select: {
          dateVisite: true,
          medecin: { select: { name: true, titre: true } },
        },
      },
      feuilles: {
        include: {
          feuille: { select: { id: true, numero: true, libelle: true } },
        },
      },
      assurance: { select: { id: true, nom: true } },
      bordereauFacture: {
        include: {
          bordereau: { select: { id: true, numero: true, statut: true } },
        },
      },
    },
  })
  if (!f) return null

  const labels = await resolvePatientLabels([f.patientId])
  const pl = labels.get(f.patientId.toString())

  const feuilles = []
  const feuilleIds: bigint[] = []
  for (const link of f.feuilles) {
    feuilleIds.push(link.feuilleCirculationId)
    const { lignes, totaux } = await loadFeuilleLignes(link.feuilleCirculationId)
    feuilles.push({
      feuilleId: link.feuille.id.toString(),
      numero: link.feuille.numero,
      libelle: link.feuille.libelle,
      montantPatient: totaux.totalPatient,
      montantAssurance: totaux.totalAssurance,
      lignes,
      totaux,
    })
  }

  const { rows: historiquePaiements, totalEncaisse } = await loadFactureHistoriquePaiements(
    f.id,
    feuilleIds,
  )

  const medecinNom = f.visite.medecin
    ? `${f.visite.medecin.titre ? f.visite.medecin.titre + ' ' : ''}${f.visite.medecin.name}`
    : null

  let assuranceId = f.assuranceId
  let assuranceNom = f.assurance?.nom ?? null
  if (!assuranceId) {
    assuranceId = await resolveActiveAssuranceId(f.patientId, f.visite.dateVisite)
    if (assuranceId) {
      const a = await prisma.assurance.findUnique({
        where: { id: assuranceId },
        select: { nom: true },
      })
      assuranceNom = a?.nom ?? null
      if (Number(f.montantAssurance) > 0) {
        await prisma.facture.update({
          where: { id: f.id },
          data: { assuranceId },
        })
      }
    }
  }

  return toSerializable({
    id: f.id.toString(),
    numero: f.numero,
    visiteId: f.visiteId.toString(),
    patientId: f.patientId.toString(),
    patientLabel: pl?.label ?? null,
    patientDob: pl?.dob ?? null,
    dateVisite: f.visite.dateVisite.toISOString(),
    medecinNom,
    statut: f.statut as FactureStatut,
    montantPatient: round2(Number(f.montantPatient)),
    montantAssurance: round2(Number(f.montantAssurance)),
    confirmedAt: f.confirmedAt ? f.confirmedAt.toISOString() : null,
    paidAt: f.paidAt ? f.paidAt.toISOString() : null,
    createdAt: f.createdAt ? f.createdAt.toISOString() : null,
    feuilles,
    suiviAssureur: buildSuiviAssureur(f, assuranceId, assuranceNom),
    historiquePaiements,
    totalEncaisse,
  }) as FactureDetail
}

export async function getFacturePrintData(id: string): Promise<FacturePrintData | null> {
  const detail = await getFactureById(id)
  if (!detail) return null

  const f = await prisma.facture.findUnique({
    where: { id: BigInt(id) },
    select: {
      patientId: true,
      assuranceId: true,
      visite: { select: { dateVisite: true, medecin: { select: { numeroOrdre: true } } } },
    },
  })
  if (!f) return null

  const assuranceId =
    f.assuranceId ??
    (await resolveActiveAssuranceId(f.patientId, f.visite.dateVisite))

  const ap = assuranceId
    ? await prisma.assurancePatient.findFirst({
        where: { patientId: f.patientId, assuranceId },
        include: { assurance: { select: { nom: true } } },
      })
    : await prisma.assurancePatient.findFirst({
        where: { patientId: f.patientId },
        include: { assurance: { select: { nom: true } } },
      })

  const assuranceNom = ap?.assurance.nom ?? detail.suiviAssureur?.assuranceNom ?? null
  const nonAssure = assuranceNom ? isNonAssureAssuranceName(assuranceNom) : true

  return toSerializable({
    ...detail,
    medecinNumeroOrdre: f.visite.medecin?.numeroOrdre ?? null,
    assurance: {
      assuranceNom: nonAssure ? null : assuranceNom,
      numeroAttestation: ap?.numeroAttestation ?? null,
      tauxCouverture: ap ? Number(ap.tauxCouverture) : null,
    },
  }) as FacturePrintData
}

export async function createFacture(
  data: unknown,
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  try {
    const userId = await requireUserId()
    const v = createFactureSchema.parse(data)
    const visiteId = BigInt(v.visiteId)
    const feuilleIds = [...new Set(v.feuilleIds.map((id) => BigInt(id)))]

    const visite = await prisma.visite.findUnique({
      where: { id: visiteId },
      include: { medecin: { select: { code: true } } },
    })
    if (!visite) throw new Error('Visite introuvable.')

    const deja = await feuillesDejaFacturees()
    const locked = new Set((await getFeuillesInConfirmedFactureIds()).map(String))

    let montantPatient = 0
    let montantAssurance = 0

    for (const fid of feuilleIds) {
      const feuille = await prisma.feuilleCirculation.findUnique({ where: { id: fid } })
      if (!feuille) throw new Error(`Feuille de circulation #${fid} introuvable.`)
      if (feuille.visiteId !== visiteId) {
        throw new Error('Toutes les feuilles de circulation doivent être de la même visite.')
      }
      if (feuille.statut !== 'CONFIRMEE') {
        throw new Error(`La feuille de circulation ${feuille.numero} n'est pas validée.`)
      }
      if (deja.has(fid.toString())) {
        throw new Error(`Feuille de circulation ${feuille.numero} déjà facturée.`)
      }
      if (locked.has(fid.toString())) {
        throw new Error(
          `Feuille de circulation ${feuille.numero} incluse dans une facture confirmée.`,
        )
      }

      const m = await sumFeuilleMontants(fid)
      if (feuille.statutPaiement !== 'PAYEE') {
        montantPatient += m.montantPatient
      }
      montantAssurance += m.montantAssurance
    }

    const assuranceId =
      montantAssurance > 0
        ? await resolveActiveAssuranceId(visite.patientId, visite.dateVisite)
        : null

    const id = await prisma.$transaction(async (tx) => {
      const numero = await nextFactureNumero(tx, visite.medecin.code)
      const facture = await tx.facture.create({
        data: {
          numero,
          visiteId,
          patientId: visite.patientId,
          assuranceId,
          statut: 'BROUILLON',
          montantPatient: round2(montantPatient),
          montantAssurance: round2(montantAssurance),
          userId,
        },
      })
      for (const fid of feuilleIds) {
        await tx.factureFeuille.create({
          data: { factureId: facture.id, feuilleCirculationId: fid },
        })
      }
      return facture.id
    })

    revalidatePath('/facturation')
    return { ok: true, id: id.toString() }
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : 'Erreur à la création',
    }
  }
}

export async function confirmFacture(
  data: unknown,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const userId = await requireUserId()
    const v = confirmFactureSchema.parse(data)
    const id = BigInt(v.id)

    const facture = await prisma.facture.findUnique({
      where: { id },
      include: { feuilles: true },
    })
    if (!facture) throw new Error('Facture introuvable.')
    if (facture.statut !== 'BROUILLON') throw new Error('Seules les factures brouillon peuvent être confirmées.')
    if (facture.feuilles.length < 1) {
      throw new Error('Une facture doit contenir au moins une feuille de circulation validée.')
    }

    await prisma.facture.update({
      where: { id },
      data: { statut: 'CONFIRMEE', confirmedAt: new Date() },
    })

    notifyEventAsync({
      type: 'FACTURE_CONFIRMEE',
      message: `Facture ${formatFactureNumero(facture.numero)} confirmée`,
      href: `/facturation/${v.id}`,
      entityType: 'Facture',
      entityId: id,
      actorUserId: userId,
    })

    revalidatePath('/facturation')
    revalidatePath(`/facturation/${v.id}`)
    revalidatePath('/caisse')
    return { ok: true }
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : 'Erreur à la confirmation',
    }
  }
}

export async function deleteFactureBrouillon(
  id: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const facture = await prisma.facture.findUnique({ where: { id: BigInt(id) } })
    if (!facture) throw new Error('Facture introuvable.')
    if (facture.statut !== 'BROUILLON') throw new Error('Seul un brouillon peut être supprimé.')

    await prisma.facture.delete({ where: { id: BigInt(id) } })
    revalidatePath('/facturation')
    return { ok: true }
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : 'Erreur à la suppression',
    }
  }
}
