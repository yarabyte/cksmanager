'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { requireUser } from '@/lib/auth/session'
import {
  getFeuillesInConfirmedFactureIds,
  nextAvoirNumero,
  num,
  resolvePatientLabels,
  round2,
  sumFeuilleMontants,
} from '@/lib/caisse/helpers'
import {
  annulerAvoirFeuilleSchema,
  createAvoirFeuilleSchema,
} from '@/lib/validations/avoir-feuille'
import type { AvoirFeuilleDetail } from '@/lib/types/avoir-feuille'
import type { Role } from '@/lib/types'

type ActionResult<T = { id: string }> =
  | ({ ok: true } & T)
  | { ok: false; error: string }

function canManageAvoir(roles: Role[]): boolean {
  return roles.includes('Admin') || roles.includes('Manager')
}

async function requireAvoirManager() {
  const user = await requireUser()
  if (!canManageAvoir(user.roles)) {
    throw new Error('Seuls les administrateurs et managers peuvent gérer les avoirs.')
  }
  return user
}

export async function createAvoirFeuille(data: unknown): Promise<ActionResult> {
  let parsed
  try {
    parsed = createAvoirFeuilleSchema.parse(data)
  } catch {
    return { ok: false, error: 'Données invalides. Le motif est obligatoire.' }
  }

  try {
    const user = await requireAvoirManager()
    const feuilleId = BigInt(parsed.feuilleId)

    const feuille = await prisma.feuilleCirculation.findUnique({
      where: { id: feuilleId },
      include: {
        avoir: true,
        _count: { select: { lignes: true } },
      },
    })
    if (!feuille) return { ok: false, error: 'Feuille de circulation introuvable.' }
    if (feuille.statut !== 'CONFIRMEE') {
      return { ok: false, error: 'La feuille doit être confirmée.' }
    }
    if (feuille.statutPaiement !== 'IMPAYEE') {
      return { ok: false, error: 'Un avoir n’est possible que sur une feuille impayée.' }
    }
    if (feuille.avoir?.statut === 'ACTIF') {
      return { ok: false, error: 'Un avoir actif existe déjà pour cette feuille.' }
    }

    const locked = await getFeuillesInConfirmedFactureIds()
    if (locked.some((id) => id === feuilleId)) {
      return {
        ok: false,
        error: 'Impossible : cette feuille est liée à une facture groupée confirmée.',
      }
    }

    const { montantPatient } = await sumFeuilleMontants(feuilleId)
    if (montantPatient <= 0) {
      return { ok: false, error: 'Aucun montant patient à couvrir par un avoir.' }
    }

    const avoirId = await prisma.$transaction(async (tx) => {
      const numero = await nextAvoirNumero(tx)
      const now = new Date()

      let id: bigint
      if (feuille.avoir) {
        const updated = await tx.avoirFeuilleCirculation.update({
          where: { id: feuille.avoir.id },
          data: {
            numero,
            montant: montantPatient,
            motif: parsed.motif,
            statut: 'ACTIF',
            userId: user.id,
            cancelledAt: null,
            cancelledById: null,
          },
        })
        id = updated.id
      } else {
        const created = await tx.avoirFeuilleCirculation.create({
          data: {
            numero,
            feuilleId,
            montant: montantPatient,
            motif: parsed.motif,
            statut: 'ACTIF',
            userId: user.id,
          },
        })
        id = created.id
      }

      await tx.feuilleCirculation.update({
        where: { id: feuilleId },
        data: { statutPaiement: 'PAYEE', paidAt: now },
      })

      return id
    })

    revalidatePath('/feuilles-circulation')
    revalidatePath(`/feuilles-circulation/${parsed.feuilleId}`)
    revalidatePath('/caisse')
    return { ok: true, id: avoirId.toString() }
  } catch (e) {
    console.error('createAvoirFeuille error', e)
    return {
      ok: false,
      error: e instanceof Error ? e.message : 'Erreur lors de la création de l’avoir.',
    }
  }
}

export async function annulerAvoirFeuille(data: unknown): Promise<ActionResult> {
  let parsed
  try {
    parsed = annulerAvoirFeuilleSchema.parse(data)
  } catch {
    return { ok: false, error: 'Données invalides.' }
  }

  try {
    const user = await requireAvoirManager()
    const avoir = await prisma.avoirFeuilleCirculation.findUnique({
      where: { id: BigInt(parsed.id) },
    })
    if (!avoir) return { ok: false, error: 'Avoir introuvable.' }
    if (avoir.statut !== 'ACTIF') {
      return { ok: false, error: 'Cet avoir est déjà annulé.' }
    }

    const encaissement = await prisma.encaissement.findFirst({
      where: { feuilleId: avoir.feuilleId },
      select: { id: true },
    })
    if (encaissement) {
      return {
        ok: false,
        error: 'Annulation impossible : un encaissement réel existe pour cette feuille.',
      }
    }

    await prisma.$transaction(async (tx) => {
      await tx.avoirFeuilleCirculation.update({
        where: { id: avoir.id },
        data: {
          statut: 'ANNULE',
          cancelledAt: new Date(),
          cancelledById: user.id,
        },
      })
      await tx.feuilleCirculation.update({
        where: { id: avoir.feuilleId },
        data: { statutPaiement: 'IMPAYEE', paidAt: null },
      })
    })

    const feuilleId = avoir.feuilleId.toString()
    revalidatePath('/feuilles-circulation')
    revalidatePath(`/feuilles-circulation/${feuilleId}`)
    revalidatePath('/caisse')
    return { ok: true, id: parsed.id }
  } catch (e) {
    console.error('annulerAvoirFeuille error', e)
    return {
      ok: false,
      error: e instanceof Error ? e.message : 'Erreur lors de l’annulation de l’avoir.',
    }
  }
}

export async function getAvoirById(id: string): Promise<AvoirFeuilleDetail | null> {
  const avoir = await prisma.avoirFeuilleCirculation.findUnique({
    where: { id: BigInt(id) },
    include: {
      user: { select: { name: true } },
      cancelledBy: { select: { name: true } },
      feuille: {
        include: {
          visite: {
            select: {
              patientId: true,
              dateVisite: true,
              medecin: { select: { name: true, titre: true } },
            },
          },
          lignes: {
            select: { montantPatient: true, montantAssurance: true },
          },
        },
      },
    },
  })
  if (!avoir) return null

  const labels = await resolvePatientLabels([avoir.feuille.visite.patientId])
  const pl = labels.get(avoir.feuille.visite.patientId.toString())
  const medecin = avoir.feuille.visite.medecin
  const medecinNom = medecin
    ? `${medecin.titre ? `${medecin.titre} ` : ''}${medecin.name}`
    : null

  let totalPatient = 0
  let totalAssurance = 0
  for (const l of avoir.feuille.lignes) {
    totalPatient += num(l.montantPatient)
    totalAssurance += num(l.montantAssurance)
  }

  const parametres = await prisma.parametre.findFirst()

  return {
    id: avoir.id.toString(),
    numero: avoir.numero,
    feuilleId: avoir.feuilleId.toString(),
    montant: round2(num(avoir.montant)),
    motif: avoir.motif,
    statut: avoir.statut as AvoirFeuilleDetail['statut'],
    createdAt: avoir.createdAt ? avoir.createdAt.toISOString() : null,
    userName: avoir.user?.name ?? null,
    cancelledAt: avoir.cancelledAt ? avoir.cancelledAt.toISOString() : null,
    cancelledByName: avoir.cancelledBy?.name ?? null,
    feuilleNumero: avoir.feuille.numero,
    patientId: avoir.feuille.visite.patientId.toString(),
    patientLabel: pl?.label ?? null,
    patientDob: pl?.dob ?? null,
    dateVisite: avoir.feuille.visite.dateVisite.toISOString(),
    medecinNom,
    totalPatientFeuille: round2(totalPatient),
    totalAssuranceFeuille: round2(totalAssurance),
    clinique: {
      nomClinique: parametres?.nomClinique ?? null,
      adresse: parametres?.adresse ?? null,
      telephone: parametres?.telephone ?? null,
      email: parametres?.email ?? null,
      niu: parametres?.niu ?? null,
      registreCommerce: parametres?.registreCommerce ?? null,
    },
  }
}

export async function getAvoirByFeuilleId(
  feuilleId: string,
): Promise<AvoirFeuilleDetail | null> {
  const avoir = await prisma.avoirFeuilleCirculation.findUnique({
    where: { feuilleId: BigInt(feuilleId) },
    select: { id: true },
  })
  if (!avoir) return null
  return getAvoirById(avoir.id.toString())
}

export async function downloadAvoirFeuillePdf(
  avoirId: string,
): Promise<{ ok: true; base64: string; filename: string } | { ok: false; error: string }> {
  try {
    const avoir = await getAvoirById(avoirId)
    if (!avoir) return { ok: false, error: 'Avoir introuvable.' }

    const { renderToBuffer } = await import('@react-pdf/renderer')
    const { AvoirFeuillePdfDocument } = await import('@/lib/pdf/avoir-feuille-pdf-document')
    const buffer = Buffer.from(await renderToBuffer(AvoirFeuillePdfDocument({ avoir })))
    const filename = `avoir-${avoir.numero.replace(/\//g, '-')}.pdf`
    return { ok: true, base64: buffer.toString('base64'), filename }
  } catch (e) {
    console.error('downloadAvoirFeuillePdf error', e)
    return {
      ok: false,
      error: e instanceof Error ? e.message : 'Erreur génération PDF.',
    }
  }
}
