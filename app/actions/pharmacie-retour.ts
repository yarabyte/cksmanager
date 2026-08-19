'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { toSerializable } from '@/lib/json-bigint'
import { ensureWallet, resolvePatientLabels, round2 } from '@/lib/caisse/helpers'
import { requirePharmacieSortie } from '@/lib/pharmacie/access'
import {
  getUserPharmacieContext,
  nextPharmaNumero,
  upsertStockLot,
  writeMouvement,
} from '@/lib/pharmacie/stock-helpers'
import { createRetourSchema } from '@/lib/validations/pharmacie-ops'
import type { RetourPharmacieDetail, RetourPharmacieRow } from '@/lib/types/pharmacie-retour'
import { notifyRetourPharmacie } from '@/lib/whatsapp/notify'

export async function listRetours(): Promise<RetourPharmacieRow[]> {
  await requirePharmacieSortie()
  const rows = await prisma.retourPharmacie.findMany({
    orderBy: { createdAt: 'desc' },
    take: 100,
    include: {
      pharmacie: { select: { nom: true } },
      user: { select: { name: true } },
      sortie: { select: { id: true, numero: true } },
      _count: { select: { lignes: true } },
    },
  })

  const labels = await resolvePatientLabels(rows.map((r) => r.patientId))

  return toSerializable(
    rows.map((r) => ({
      id: r.id.toString(),
      numero: r.numero,
      sortieId: r.sortie.id.toString(),
      sortieNumero: r.sortie.numero,
      pharmacieNom: r.pharmacie.nom,
      userNom: r.user.name,
      patientId: r.patientId.toString(),
      patientLabel: labels.get(r.patientId.toString())?.label ?? null,
      montantAvoir: round2(Number(r.montantAvoir)),
      nbLignes: r._count.lignes,
      motif: r.motif,
      createdAt: r.createdAt?.toISOString() ?? null,
    })),
  ) as RetourPharmacieRow[]
}

export async function getRetour(id: string): Promise<RetourPharmacieDetail | null> {
  await requirePharmacieSortie()
  const r = await prisma.retourPharmacie.findUnique({
    where: { id: BigInt(id) },
    include: {
      pharmacie: { select: { nom: true } },
      user: { select: { name: true } },
      sortie: { select: { id: true, numero: true } },
      lignes: {
        include: {
          produit: { select: { nom: true, dosage: true } },
          sortieLigne: {
            select: {
              numeroLot: true,
              datePeremption: true,
              montantPatientUnitaire: true,
            },
          },
        },
      },
    },
  })
  if (!r) return null

  const labels = await resolvePatientLabels([r.patientId])

  return toSerializable({
    id: r.id.toString(),
    numero: r.numero,
    sortieId: r.sortie.id.toString(),
    sortieNumero: r.sortie.numero,
    pharmacieNom: r.pharmacie.nom,
    userNom: r.user.name,
    patientId: r.patientId.toString(),
    patientLabel: labels.get(r.patientId.toString())?.label ?? null,
    montantAvoir: round2(Number(r.montantAvoir)),
    motif: r.motif,
    createdAt: r.createdAt?.toISOString() ?? null,
    lignes: r.lignes.map((l) => ({
      id: l.id.toString(),
      produitNom: l.produit.nom,
      produitDosage: l.produit.dosage,
      numeroLot: l.sortieLigne.numeroLot,
      datePeremption: l.sortieLigne.datePeremption.toISOString(),
      quantite: l.quantite,
      montantUnitaire: round2(Number(l.sortieLigne.montantPatientUnitaire)),
    })),
  }) as RetourPharmacieDetail
}
export async function getSortiePourRetour(sortieId: string) {
  await requirePharmacieSortie()
  const s = await prisma.sortiePharmacie.findUnique({
    where: { id: BigInt(sortieId) },
    include: {
      lignes: {
        include: {
          produit: { select: { nom: true, dosage: true } },
          retours: { select: { quantite: true } },
        },
      },
    },
  })
  if (!s) return null

  const labels = await resolvePatientLabels([s.patientId])

  return toSerializable({
    id: s.id.toString(),
    numero: s.numero,
    patientId: s.patientId.toString(),
    patientLabel: labels.get(s.patientId.toString())?.label ?? null,
    lignes: s.lignes
      .map((l) => {
        const dejaRetournee = l.retours.reduce((sum, r) => sum + r.quantite, 0)
        const restante = l.quantiteServie - dejaRetournee
        return {
          id: l.id.toString(),
          produitNom: l.produit.nom,
          produitDosage: l.produit.dosage,
          numeroLot: l.numeroLot,
          datePeremption: l.datePeremption.toISOString(),
          quantiteServie: l.quantiteServie,
          quantiteDejaRetournee: dejaRetournee,
          quantiteRetournable: restante,
          montantPatientUnitaire: round2(Number(l.montantPatientUnitaire)),
        }
      })
      .filter((l) => l.quantiteRetournable > 0),
  })
}

export async function createRetour(
  data: unknown,
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  try {
    const user = await requirePharmacieSortie()
    const v = createRetourSchema.parse(data)
    const ctx = await getUserPharmacieContext(user.id)
    const sortieId = BigInt(v.sortieId)

    const sortie = await prisma.sortiePharmacie.findUnique({
      where: { id: sortieId },
      include: {
        lignes: { include: { retours: true } },
      },
    })
    if (!sortie) throw new Error('Sortie introuvable.')
    if (sortie.pharmacieId !== ctx.pharmacieId) {
      throw new Error('Cette sortie n’appartient pas à votre pharmacie.')
    }

    const ligneById = new Map(sortie.lignes.map((l) => [l.id.toString(), l]))

    const wallet = await ensureWallet(sortie.patientId, user.id)

    const retourMeta = await prisma.$transaction(async (tx) => {
      let montantAvoir = 0
      const numero = await nextPharmaNumero('RET', tx, 'retourPharmacie')
      const retour = await tx.retourPharmacie.create({
        data: {
          numero,
          sortieId,
          pharmacieId: ctx.pharmacieId,
          userId: user.id,
          patientId: sortie.patientId,
          montantAvoir: 0,
          motif: v.motif?.trim() || null,
        },
      })

      for (const ligne of v.lignes) {
        const src = ligneById.get(ligne.sortieLigneId)
        if (!src) throw new Error('Ligne de sortie introuvable.')
        const deja = src.retours.reduce((s, r) => s + r.quantite, 0)
        const max = src.quantiteServie - deja
        if (ligne.quantite > max) {
          throw new Error(
            `Quantité de retour trop élevée pour le lot ${src.numeroLot} (max ${max}).`,
          )
        }

        await tx.retourPharmacieLigne.create({
          data: {
            retourId: retour.id,
            sortieLigneId: src.id,
            produitId: src.produitId,
            stockLotId: src.stockLotId,
            quantite: ligne.quantite,
          },
        })

        await upsertStockLot(tx, {
          produitId: src.produitId,
          magasinId: sortie.magasinId,
          numeroLot: src.numeroLot,
          datePeremption: src.datePeremption,
          quantiteDelta: ligne.quantite,
        })
        await writeMouvement(tx, {
          type: 'RETOUR',
          stockLotId: src.stockLotId,
          quantite: ligne.quantite,
          referenceType: 'RetourPharmacie',
          referenceId: retour.id,
          userId: user.id,
        })

        montantAvoir += ligne.quantite * Number(src.montantPatientUnitaire)
      }

      montantAvoir = round2(montantAvoir)
      await tx.retourPharmacie.update({
        where: { id: retour.id },
        data: { montantAvoir },
      })

      if (montantAvoir > 0) {
        await tx.walletTransaction.create({
          data: {
            walletId: wallet.id,
            type: 'AVOIR',
            montant: montantAvoir,
            description: `Avoir retour pharmacie ${numero}`,
            transactionableType: 'RetourPharmacie',
            transactionableId: retour.id,
            userId: user.id,
          },
        })
      }

      return {
        id: retour.id,
        numero,
        montantAvoir,
        patientId: sortie.patientId,
      }
    })

    revalidatePath('/pharmacie/retours')
    revalidatePath('/pharmacie/sorties')
    revalidatePath('/pharmacie/stock')

    void notifyRetourPharmacie({
      retourId: retourMeta.id.toString(),
      patientId: retourMeta.patientId.toString(),
      numero: retourMeta.numero,
      montantAvoir: retourMeta.montantAvoir,
    }).catch((err) => console.error('[whatsapp] retour:', err))

    return { ok: true, id: retourMeta.id.toString() }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Erreur' }
  }
}
