'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { toSerializable } from '@/lib/json-bigint'
import { requireUser } from '@/lib/auth/session'
import { isNonAssureAssuranceName } from '@/lib/assurance/non-assure'
import {
  ensureFactureAssuranceId,
  nextBordereauNumero,
  resolveActiveAssuranceId,
  round2,
  suiviAssureurFromBordereau,
} from '@/lib/bordereau/helpers'
import { resolvePatientLabels } from '@/lib/caisse/helpers'
import {
  createBordereauSchema,
  deposerBordereauSchema,
  payerBordereauSchema,
  updateBordereauFacturesSchema,
} from '@/lib/validations/bordereau'
import type {
  BordereauDetail,
  BordereauListRow,
  BordereauStatut,
  FactureEligibleBordereau,
  FactureSuiviAssureur,
} from '@/lib/types/bordereau'
import type { Role } from '@/lib/types'
import { notifyEventAsync } from '@/lib/notifications/create-notification'

const BORDEREAU_ROLES: Role[] = ['Admin', 'Manager']

async function requireBordereauManager() {
  const user = await requireUser()
  if (!user.roles.some((r) => BORDEREAU_ROLES.includes(r))) {
    throw new Error('Accès réservé au Manager et à l’Admin.')
  }
  return user
}

function parseDateOnly(value: string): Date {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(value.trim())
  if (!m) throw new Error('Date invalide.')
  return new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])))
}

function revalidateBordereaux(id?: string) {
  revalidatePath('/facturation')
  revalidatePath('/facturation/bordereaux')
  if (id) {
    revalidatePath(`/facturation/bordereaux/${id}`)
    revalidatePath(`/facturation/bordereaux/${id}/imprimer`)
  }
}

export async function listBordereaux(params?: {
  assuranceId?: string
  statut?: string
}): Promise<BordereauListRow[]> {
  await requireBordereauManager()

  const where: { assuranceId?: bigint; statut?: string } = {}
  if (params?.assuranceId && params.assuranceId !== 'all') {
    where.assuranceId = BigInt(params.assuranceId)
  }
  if (params?.statut && params.statut !== 'all') {
    where.statut = params.statut
  }

  const rows = await prisma.bordereauAssureur.findMany({
    where: Object.keys(where).length ? where : undefined,
    orderBy: [{ createdAt: 'desc' }],
    include: {
      assurance: { select: { nom: true, code: true } },
      _count: { select: { factures: true } },
    },
  })

  return toSerializable(
    rows.map((b) => ({
      id: b.id.toString(),
      numero: b.numero,
      assuranceId: b.assuranceId.toString(),
      assuranceNom: b.assurance.nom,
      assuranceCode: b.assurance.code,
      statut: b.statut as BordereauStatut,
      montantTotal: round2(Number(b.montantTotal)),
      nbFactures: b._count.factures,
      dateDepot: b.dateDepot ? b.dateDepot.toISOString() : null,
      datePaiement: b.datePaiement ? b.datePaiement.toISOString() : null,
      refVirement: b.refVirement,
      createdAt: b.createdAt ? b.createdAt.toISOString() : null,
    })),
  ) as BordereauListRow[]
}

export async function getBordereauById(id: string): Promise<BordereauDetail | null> {
  await requireBordereauManager()

  const b = await prisma.bordereauAssureur.findUnique({
    where: { id: BigInt(id) },
    include: {
      assurance: { select: { nom: true, code: true } },
      factures: {
        include: {
          facture: {
            select: {
              id: true,
              numero: true,
              patientId: true,
              statut: true,
              visite: { select: { dateVisite: true } },
            },
          },
        },
      },
    },
  })
  if (!b) return null

  const labels = await resolvePatientLabels(b.factures.map((l) => l.facture.patientId))

  return toSerializable({
    id: b.id.toString(),
    numero: b.numero,
    assuranceId: b.assuranceId.toString(),
    assuranceNom: b.assurance.nom,
    assuranceCode: b.assurance.code,
    statut: b.statut as BordereauStatut,
    montantTotal: round2(Number(b.montantTotal)),
    dateDepot: b.dateDepot ? b.dateDepot.toISOString() : null,
    noteDepot: b.noteDepot,
    datePaiement: b.datePaiement ? b.datePaiement.toISOString() : null,
    refVirement: b.refVirement,
    createdAt: b.createdAt ? b.createdAt.toISOString() : null,
    factures: b.factures.map((l) => ({
      factureId: l.facture.id.toString(),
      factureNumero: l.facture.numero,
      patientId: l.facture.patientId.toString(),
      patientLabel: labels.get(l.facture.patientId.toString())?.label ?? null,
      dateVisite: l.facture.visite.dateVisite.toISOString(),
      montantAssurance: round2(Number(l.montantAssurance)),
      statutFacture: l.facture.statut,
    })),
  }) as BordereauDetail
}

/** Factures éligibles pour un assureur (CONFIRMEE/PAYEE, part assurance > 0, hors bordereau). */
export async function listFacturesEligibles(
  assuranceId: string,
  options?: { includeBordereauId?: string },
): Promise<FactureEligibleBordereau[]> {
  await requireBordereauManager()
  const aid = BigInt(assuranceId)

  const factures = await prisma.facture.findMany({
    where: {
      statut: { in: ['CONFIRMEE', 'PAYEE'] },
      montantAssurance: { gt: 0 },
      OR: [{ assuranceId: aid }, { assuranceId: null }],
    },
    include: {
      visite: { select: { dateVisite: true } },
      bordereauFacture: { select: { bordereauId: true } },
      assurance: { select: { nom: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  const includeId = options?.includeBordereauId
    ? BigInt(options.includeBordereauId)
    : null

  const eligible: typeof factures = []
  for (const f of factures) {
    if (f.bordereauFacture) {
      if (!includeId || f.bordereauFacture.bordereauId !== includeId) continue
    }

    let resolvedAssuranceId = f.assuranceId
    if (!resolvedAssuranceId) {
      resolvedAssuranceId = await ensureFactureAssuranceId(f.id)
    }
    if (!resolvedAssuranceId || resolvedAssuranceId !== aid) continue

    if (f.assurance && isNonAssureAssuranceName(f.assurance.nom)) continue

    eligible.push(f)
  }

  const labels = await resolvePatientLabels(eligible.map((f) => f.patientId))

  return toSerializable(
    eligible.map((f) => ({
      id: f.id.toString(),
      numero: f.numero,
      patientId: f.patientId.toString(),
      patientLabel: labels.get(f.patientId.toString())?.label ?? null,
      dateVisite: f.visite.dateVisite.toISOString(),
      montantAssurance: round2(Number(f.montantAssurance)),
      statut: f.statut,
    })),
  ) as FactureEligibleBordereau[]
}

async function loadAndValidateFacturesForAssurance(
  assuranceId: bigint,
  factureIds: bigint[],
  excludeBordereauId?: bigint,
) {
  const factures = await prisma.facture.findMany({
    where: { id: { in: factureIds } },
    include: {
      visite: { select: { dateVisite: true } },
      bordereauFacture: { select: { bordereauId: true } },
      assurance: { select: { nom: true } },
    },
  })

  if (factures.length !== factureIds.length) {
    throw new Error('Une ou plusieurs factures sont introuvables.')
  }

  const lines: { factureId: bigint; montantAssurance: number }[] = []
  let total = 0

  for (const f of factures) {
    if (f.statut !== 'CONFIRMEE' && f.statut !== 'PAYEE') {
      throw new Error(`La facture ${f.numero} n'est pas confirmée.`)
    }
    const montant = round2(Number(f.montantAssurance))
    if (montant <= 0) {
      throw new Error(`La facture ${f.numero} n'a pas de part assurance.`)
    }
    if (f.bordereauFacture) {
      if (!excludeBordereauId || f.bordereauFacture.bordereauId !== excludeBordereauId) {
        throw new Error(`La facture ${f.numero} est déjà dans un bordereau.`)
      }
    }

    let aid = f.assuranceId
    if (!aid) {
      aid = await ensureFactureAssuranceId(f.id)
    }
    if (!aid || aid !== assuranceId) {
      throw new Error(`La facture ${f.numero} n'appartient pas à cet assureur.`)
    }
    if (f.assurance && isNonAssureAssuranceName(f.assurance.nom)) {
      throw new Error(`La facture ${f.numero} concerne un non assuré.`)
    }

    lines.push({ factureId: f.id, montantAssurance: montant })
    total += montant
  }

  return { lines, total: round2(total) }
}

export async function createBordereau(
  data: unknown,
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  try {
    const user = await requireBordereauManager()
    const v = createBordereauSchema.parse(data)
    const assuranceId = BigInt(v.assuranceId)
    const factureIds = [...new Set(v.factureIds.map((id) => BigInt(id)))]

    const assurance = await prisma.assurance.findUnique({ where: { id: assuranceId } })
    if (!assurance) throw new Error('Assureur introuvable.')
    if (isNonAssureAssuranceName(assurance.nom)) {
      throw new Error('Impossible de créer un bordereau pour « Non assuré ».')
    }

    const { lines, total } = await loadAndValidateFacturesForAssurance(
      assuranceId,
      factureIds,
    )

    const id = await prisma.$transaction(async (tx) => {
      const numero = await nextBordereauNumero(assuranceId, tx)
      const bordereau = await tx.bordereauAssureur.create({
        data: {
          numero,
          assuranceId,
          statut: 'BROUILLON',
          montantTotal: total,
          userId: user.id,
        },
      })
      for (const line of lines) {
        await tx.bordereauFacture.create({
          data: {
            bordereauId: bordereau.id,
            factureId: line.factureId,
            montantAssurance: line.montantAssurance,
          },
        })
      }
      return bordereau.id
    })

    revalidateBordereaux(id.toString())
    return { ok: true, id: id.toString() }
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : 'Erreur à la création',
    }
  }
}

export async function updateBordereauFactures(
  data: unknown,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await requireBordereauManager()
    const v = updateBordereauFacturesSchema.parse(data)
    const id = BigInt(v.id)
    const factureIds = [...new Set(v.factureIds.map((fid) => BigInt(fid)))]

    const bordereau = await prisma.bordereauAssureur.findUnique({ where: { id } })
    if (!bordereau) throw new Error('Bordereau introuvable.')
    if (bordereau.statut !== 'BROUILLON') {
      throw new Error('Seuls les bordereaux brouillon sont modifiables.')
    }

    const { lines, total } = await loadAndValidateFacturesForAssurance(
      bordereau.assuranceId,
      factureIds,
      id,
    )

    await prisma.$transaction(async (tx) => {
      await tx.bordereauFacture.deleteMany({ where: { bordereauId: id } })
      for (const line of lines) {
        await tx.bordereauFacture.create({
          data: {
            bordereauId: id,
            factureId: line.factureId,
            montantAssurance: line.montantAssurance,
          },
        })
      }
      await tx.bordereauAssureur.update({
        where: { id },
        data: { montantTotal: total },
      })
    })

    revalidateBordereaux(v.id)
    return { ok: true }
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : 'Erreur à la mise à jour',
    }
  }
}

export async function deleteBordereau(
  id: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await requireBordereauManager()
    const bordereau = await prisma.bordereauAssureur.findUnique({
      where: { id: BigInt(id) },
    })
    if (!bordereau) throw new Error('Bordereau introuvable.')
    if (bordereau.statut !== 'BROUILLON') {
      throw new Error('Seuls les bordereaux brouillon peuvent être supprimés.')
    }

    await prisma.bordereauAssureur.delete({ where: { id: BigInt(id) } })
    revalidateBordereaux()
    return { ok: true }
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : 'Erreur à la suppression',
    }
  }
}

export async function deposerBordereau(
  data: unknown,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const user = await requireBordereauManager()
    const v = deposerBordereauSchema.parse(data)
    const id = BigInt(v.id)

    const bordereau = await prisma.bordereauAssureur.findUnique({
      where: { id },
      include: { _count: { select: { factures: true } } },
    })
    if (!bordereau) throw new Error('Bordereau introuvable.')
    if (bordereau.statut !== 'BROUILLON') {
      throw new Error('Seuls les bordereaux brouillon peuvent être déposés.')
    }
    if (bordereau._count.factures === 0) {
      throw new Error('Le bordereau ne contient aucune facture.')
    }

    await prisma.bordereauAssureur.update({
      where: { id },
      data: {
        statut: 'DEPOSE',
        dateDepot: parseDateOnly(v.dateDepot),
        noteDepot: v.noteDepot?.trim() || null,
        deposeParId: user.id,
      },
    })

    notifyEventAsync({
      type: 'BORDEREAU_DEPOSE',
      message: `Bordereau ${bordereau.numero} déposé`,
      href: `/facturation/bordereaux/${v.id}`,
      entityType: 'BordereauAssureur',
      entityId: id,
      actorUserId: user.id,
    })

    revalidateBordereaux(v.id)
    return { ok: true }
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : 'Erreur au dépôt',
    }
  }
}

export async function annulerDepot(
  id: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await requireBordereauManager()
    const bordereau = await prisma.bordereauAssureur.findUnique({
      where: { id: BigInt(id) },
    })
    if (!bordereau) throw new Error('Bordereau introuvable.')
    if (bordereau.statut !== 'DEPOSE') {
      throw new Error('Seul un bordereau déposé peut être annulé.')
    }

    await prisma.bordereauAssureur.update({
      where: { id: BigInt(id) },
      data: {
        statut: 'BROUILLON',
        dateDepot: null,
        noteDepot: null,
        deposeParId: null,
      },
    })

    revalidateBordereaux(id)
    return { ok: true }
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Erreur à l'annulation",
    }
  }
}

export async function payerBordereau(
  data: unknown,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const user = await requireBordereauManager()
    const v = payerBordereauSchema.parse(data)
    const id = BigInt(v.id)

    const bordereau = await prisma.bordereauAssureur.findUnique({ where: { id } })
    if (!bordereau) throw new Error('Bordereau introuvable.')
    if (bordereau.statut !== 'DEPOSE') {
      throw new Error('Seul un bordereau déposé peut être marqué payé.')
    }

    await prisma.bordereauAssureur.update({
      where: { id },
      data: {
        statut: 'PAYE',
        datePaiement: parseDateOnly(v.datePaiement),
        refVirement: v.refVirement.trim(),
        payeParId: user.id,
      },
    })

    notifyEventAsync({
      type: 'BORDEREAU_PAYE',
      message: `Bordereau ${bordereau.numero} marqué payé`,
      href: `/facturation/bordereaux/${v.id}`,
      entityType: 'BordereauAssureur',
      entityId: id,
      actorUserId: user.id,
    })

    revalidateBordereaux(v.id)
    return { ok: true }
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : 'Erreur au paiement',
    }
  }
}

export async function getFactureSuiviAssureur(
  factureId: string,
): Promise<FactureSuiviAssureur | null> {
  const f = await prisma.facture.findUnique({
    where: { id: BigInt(factureId) },
    include: {
      assurance: { select: { id: true, nom: true } },
      bordereauFacture: {
        include: {
          bordereau: { select: { id: true, numero: true, statut: true } },
        },
      },
      visite: { select: { dateVisite: true } },
    },
  })
  if (!f) return null

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
    }
  }

  if (assuranceNom && isNonAssureAssuranceName(assuranceNom)) {
    assuranceId = null
    assuranceNom = null
  }

  const montant = Number(f.montantAssurance)
  if (montant <= 0 || !assuranceId) {
    return {
      statut: 'A_DEPOSER',
      bordereauId: null,
      bordereauNumero: null,
      assuranceId: null,
      assuranceNom: null,
    }
  }

  const b = f.bordereauFacture?.bordereau
  return {
    statut: suiviAssureurFromBordereau(b?.statut as BordereauStatut | undefined),
    bordereauId: b?.id.toString() ?? null,
    bordereauNumero: b?.numero ?? null,
    assuranceId: assuranceId.toString(),
    assuranceNom,
  }
}

export async function listAssureursPourBordereau(): Promise<
  { id: string; nom: string; code: string | null }[]
> {
  await requireBordereauManager()
  const rows = await prisma.assurance.findMany({
    orderBy: { nom: 'asc' },
    select: { id: true, nom: true, code: true },
  })
  return toSerializable(
    rows
      .filter((a) => !isNonAssureAssuranceName(a.nom))
      .map((a) => ({
        id: a.id.toString(),
        nom: a.nom,
        code: a.code,
      })),
  ) as { id: string; nom: string; code: string | null }[]
}

/** Assureurs ayant au moins une facture éligible à un bordereau. */
export async function listAssureursAvecFacturesEligibles(): Promise<
  { id: string; nom: string; code: string | null; nbFactures: number }[]
> {
  await requireBordereauManager()

  const factures = await prisma.facture.findMany({
    where: {
      statut: { in: ['CONFIRMEE', 'PAYEE'] },
      montantAssurance: { gt: 0 },
      bordereauFacture: null,
    },
    select: {
      id: true,
      assuranceId: true,
      assurance: { select: { nom: true } },
    },
  })

  const counts = new Map<string, number>()
  for (const f of factures) {
    if (f.assurance && isNonAssureAssuranceName(f.assurance.nom)) continue

    let aid = f.assuranceId
    if (!aid) {
      aid = await ensureFactureAssuranceId(f.id)
    }
    if (!aid) continue

    const key = aid.toString()
    counts.set(key, (counts.get(key) ?? 0) + 1)
  }

  if (counts.size === 0) return []

  const rows = await prisma.assurance.findMany({
    where: { id: { in: [...counts.keys()].map((id) => BigInt(id)) } },
    orderBy: { nom: 'asc' },
    select: { id: true, nom: true, code: true },
  })

  return toSerializable(
    rows
      .filter((a) => !isNonAssureAssuranceName(a.nom))
      .map((a) => ({
        id: a.id.toString(),
        nom: a.nom,
        code: a.code,
        nbFactures: counts.get(a.id.toString()) ?? 0,
      })),
  ) as { id: string; nom: string; code: string | null; nbFactures: number }[]
}
