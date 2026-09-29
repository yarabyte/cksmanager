'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { toSerializable } from '@/lib/json-bigint'
import { requirePermission } from '@/lib/permissions-guard'
import { requirePermission } from '@/lib/permissions-guard'
import {
  getFeuillesInConfirmedFactureIds,
  resolvePatientLabels,
  round2,
} from '@/lib/caisse/helpers'
import { hasHospitalisationEnCoursForVisite } from '@/lib/hospitalisation/helpers'
import { createFacture, confirmFacture } from '@/app/actions/factures'
import type {
  HospitalisationDetail,
  HospitalisationListRow,
  HospitalisationStatut,
  VisiteEligibleHospitalisation,
} from '@/lib/types/hospitalisation'

function parseDateOnly(value: string): Date {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(value.trim())
  if (!m) throw new Error('Date invalide.')
  return new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])))
}

function medecinLabel(m: { name: string; titre: string | null }) {
  return `${m.titre ? `${m.titre} ` : ''}${m.name}`
}

export { hasHospitalisationEnCoursForVisite }

export async function listHospitalisations(params?: {
  statut?: string
  q?: string
}): Promise<HospitalisationListRow[]> {
  await requirePermission('hospitalisation', 'view')

  const where: {
    statut?: string
    patientId?: bigint
  } = {}
  if (params?.statut && params.statut !== 'all') {
    where.statut = params.statut
  }

  const rows = await prisma.hospitalisation.findMany({
    where: Object.keys(where).length ? where : undefined,
    orderBy: [{ dateEntree: 'desc' }, { createdAt: 'desc' }],
    include: {
      visite: {
        select: {
          dateVisite: true,
          medecin: { select: { name: true, titre: true } },
          _count: { select: { feuillesCirculation: true } },
        },
      },
    },
  })

  const labels = await resolvePatientLabels(rows.map((r) => r.patientId))
  const q = params?.q?.trim().toLowerCase() ?? ''

  const mapped = rows.map((h) => ({
    id: h.id.toString(),
    visiteId: h.visiteId.toString(),
    patientId: h.patientId.toString(),
    patientLabel: labels.get(h.patientId.toString())?.label ?? null,
    medecinNom: medecinLabel(h.visite.medecin),
    dateEntree: h.dateEntree.toISOString(),
    dateSortie: h.dateSortie ? h.dateSortie.toISOString() : null,
    dateVisite: h.visite.dateVisite.toISOString(),
    statut: h.statut as HospitalisationStatut,
    nbFeuilles: h.visite._count.feuillesCirculation,
    createdAt: h.createdAt ? h.createdAt.toISOString() : null,
  }))

  const filtered = q
    ? mapped.filter(
        (h) =>
          (h.patientLabel?.toLowerCase().includes(q) ?? false) ||
          h.patientId.includes(q) ||
          (h.medecinNom?.toLowerCase().includes(q) ?? false),
      )
    : mapped

  return toSerializable(filtered) as HospitalisationListRow[]
}

export async function getHospitalisationById(
  id: string,
): Promise<HospitalisationDetail | null> {
  await requirePermission('hospitalisation', 'view')

  const h = await prisma.hospitalisation.findUnique({
    where: { id: BigInt(id) },
    include: {
      visite: {
        select: {
          dateVisite: true,
          medecin: { select: { name: true, titre: true } },
          feuillesCirculation: {
            orderBy: { createdAt: 'desc' },
            include: {
              lignes: {
                select: { montantPatient: true, montantAssurance: true },
              },
              factureLiens: { select: { factureId: true } },
            },
          },
        },
      },
    },
  })
  if (!h) return null

  const facture = h.factureId
    ? await prisma.facture.findUnique({
        where: { id: h.factureId },
        select: { id: true, numero: true },
      })
    : null

  const locked = new Set((await getFeuillesInConfirmedFactureIds()).map(String))
  const labels = await resolvePatientLabels([h.patientId])
  const pl = labels.get(h.patientId.toString())

  return toSerializable({
    id: h.id.toString(),
    visiteId: h.visiteId.toString(),
    patientId: h.patientId.toString(),
    patientLabel: pl?.label ?? null,
    patientDob: pl?.dob ?? null,
    medecinNom: medecinLabel(h.visite.medecin),
    dateEntree: h.dateEntree.toISOString(),
    dateSortie: h.dateSortie ? h.dateSortie.toISOString() : null,
    dateVisite: h.visite.dateVisite.toISOString(),
    statut: h.statut as HospitalisationStatut,
    commentaires: h.commentaires,
    createdAt: h.createdAt ? h.createdAt.toISOString() : null,
    factureId: facture?.id.toString() ?? null,
    factureNumero: facture?.numero ?? null,
    feuilles: h.visite.feuillesCirculation.map((f) => {
      const dejaFacturee = f.factureLiens.length > 0
      const eligibleFacture =
        f.statut === 'CONFIRMEE' &&
        !dejaFacturee &&
        !locked.has(f.id.toString())
      return {
        id: f.id.toString(),
        numero: f.numero,
        libelle: f.libelle,
        statut: f.statut,
        statutPaiement: f.statutPaiement,
        montantPatient: round2(
          f.lignes.reduce((s, l) => s + Number(l.montantPatient), 0),
        ),
        montantAssurance: round2(
          f.lignes.reduce((s, l) => s + Number(l.montantAssurance), 0),
        ),
        createdAt: f.createdAt ? f.createdAt.toISOString() : null,
        dejaFacturee,
        eligibleFacture,
      }
    }),
  }) as HospitalisationDetail
}

export async function listVisitesEligiblesHospitalisation(): Promise<
  VisiteEligibleHospitalisation[]
> {
  await requirePermission('hospitalisation', 'create')

  const since = new Date()
  since.setDate(since.getDate() - 60)

  const visites = await prisma.visite.findMany({
    where: {
      dateVisite: { gte: since },
      hospitalisation: null,
    },
    orderBy: { dateVisite: 'desc' },
    take: 200,
    include: { medecin: { select: { name: true, titre: true } } },
  })

  const labels = await resolvePatientLabels(visites.map((v) => v.patientId))

  return toSerializable(
    visites.map((v) => ({
      id: v.id.toString(),
      dateVisite: v.dateVisite.toISOString(),
      patientId: v.patientId.toString(),
      patientLabel: labels.get(v.patientId.toString())?.label ?? null,
      medecinNom: medecinLabel(v.medecin),
    })),
  ) as VisiteEligibleHospitalisation[]
}

export async function createHospitalisation(data: {
  visiteId: string
  dateEntree: string
  commentaires?: string | null
}): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  try {
    const user = await requirePermission('hospitalisation', 'create')
    const visiteId = BigInt(data.visiteId)
    const dateEntree = parseDateOnly(data.dateEntree)

    const visite = await prisma.visite.findUnique({
      where: { id: visiteId },
      select: { id: true, patientId: true, hospitalisation: { select: { id: true } } },
    })
    if (!visite) throw new Error('Visite introuvable.')
    if (visite.hospitalisation) {
      throw new Error('Cette visite a déjà une hospitalisation.')
    }

    const row = await prisma.hospitalisation.create({
      data: {
        visiteId,
        patientId: visite.patientId,
        dateEntree,
        statut: 'EN_COURS',
        commentaires: data.commentaires?.trim() || null,
        userId: user.id,
      },
    })

    revalidatePath('/hospitalisation')
    revalidatePath(`/hospitalisation/${row.id}`)
    revalidatePath(`/visites/${visiteId}`)
    return { ok: true, id: row.id.toString() }
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : 'Erreur à la création',
    }
  }
}

/**
 * Enregistre la sortie. Si `feuilleIds` non vide, crée une facture unique
 * (comme /facturation/nouvelle) puis la rattache à l'hospitalisation.
 */
export async function sortirHospitalisation(data: {
  id: string
  dateSortie: string
  feuilleIds?: string[]
}): Promise<
  { ok: true; factureId: string | null } | { ok: false; error: string }
> {
  try {
    await requirePermission('hospitalisation', 'edit')
    const id = BigInt(data.id)
    const dateSortie = parseDateOnly(data.dateSortie)
    const feuilleIds = [...new Set((data.feuilleIds ?? []).map(String))]

    const h = await prisma.hospitalisation.findUnique({
      where: { id },
      select: {
        id: true,
        visiteId: true,
        statut: true,
        dateEntree: true,
        factureId: true,
      },
    })
    if (!h) throw new Error('Hospitalisation introuvable.')
    if (h.statut !== 'EN_COURS' || h.factureId) {
      throw new Error('Cette hospitalisation est déjà clôturée.')
    }
    if (dateSortie < h.dateEntree) {
      throw new Error("La date de sortie ne peut pas être antérieure à l'entrée.")
    }

    let factureId: string | null = null
    if (feuilleIds.length > 0) {
      const res = await createFacture({
        visiteId: h.visiteId.toString(),
        feuilleIds,
      })
      if (!res.ok) throw new Error(res.error)
      factureId = res.id
      // Confirmée immédiatement pour être éligible aux bordereaux assureur
      const conf = await confirmFacture({ id: factureId })
      if (!conf.ok) throw new Error(conf.error)
    }

    await prisma.hospitalisation.update({
      where: { id },
      data: {
        dateSortie,
        statut: 'SORTI',
        factureId: factureId ? BigInt(factureId) : null,
      },
    })

    revalidatePath('/hospitalisation')
    revalidatePath(`/hospitalisation/${data.id}`)
    revalidatePath('/facturation')
    revalidatePath('/facturation/bordereaux')
    revalidatePath('/caisse')
    if (factureId) revalidatePath(`/facturation/${factureId}`)

    return { ok: true, factureId }
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : 'Erreur à la sortie',
    }
  }
}
