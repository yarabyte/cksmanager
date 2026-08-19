'use server'

import type { Prisma } from '@prisma/client'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { toSerializable } from '@/lib/json-bigint'
import { round2 } from '@/lib/caisse/helpers'
import { requirePharmacieGestion } from '@/lib/pharmacie/access'
import {
  nextPharmaNumero,
  parseDateOnly,
  upsertStockLot,
  writeMouvement,
} from '@/lib/pharmacie/stock-helpers'
import {
  createApproSchema,
  createTransfertSchema,
  magasinSchema,
  magasinUpdateSchema,
  pharmacieSchema,
  pharmacieUpdateSchema,
  saveApproSchema,
} from '@/lib/validations/pharmacie-ops'

function revalidatePharma() {
  revalidatePath('/pharmacie/stock')
  revalidatePath('/pharmacie/magasins')
  revalidatePath('/pharmacie/officines')
  revalidatePath('/pharmacie/approvisionnements')
  revalidatePath('/pharmacie/transferts')
}

// ─── Magasins ───────────────────────────────────────────────

export async function listMagasins() {
  await requirePharmacieGestion()
  const rows = await prisma.magasin.findMany({
    orderBy: { nom: 'asc' },
    include: {
      pharmacie: { select: { id: true, nom: true } },
      _count: { select: { stockLots: true } },
    },
  })
  return toSerializable(
    rows.map((m) => ({
      id: m.id.toString(),
      nom: m.nom,
      emplacement: m.emplacement,
      description: m.description,
      actif: m.actif,
      pharmacieId: m.pharmacie?.id.toString() ?? null,
      pharmacieNom: m.pharmacie?.nom ?? null,
      nbLots: m._count.stockLots,
    })),
  )
}

export async function createMagasin(data: unknown) {
  await requirePharmacieGestion()
  const v = magasinSchema.parse(data)
  const row = await prisma.magasin.create({
    data: {
      nom: v.nom.trim(),
      emplacement: v.emplacement?.trim() || null,
      description: v.description?.trim() || null,
      actif: v.actif ?? true,
    },
  })
  revalidatePharma()
  return toSerializable({ id: row.id.toString() })
}

export async function updateMagasin(data: unknown) {
  await requirePharmacieGestion()
  const v = magasinUpdateSchema.parse(data)
  await prisma.magasin.update({
    where: { id: BigInt(v.id) },
    data: {
      nom: v.nom.trim(),
      emplacement: v.emplacement?.trim() || null,
      description: v.description?.trim() || null,
      actif: v.actif ?? true,
    },
  })
  revalidatePharma()
  return { ok: true as const }
}

// ─── Pharmacies (officines) ─────────────────────────────────

export async function listPharmacies() {
  await requirePharmacieGestion()
  const rows = await prisma.pharmacie.findMany({
    orderBy: { nom: 'asc' },
    include: {
      magasin: { select: { id: true, nom: true } },
      users: {
        orderBy: { name: 'asc' },
        select: { id: true, name: true, role: true, actif: true },
      },
    },
  })
  return toSerializable(
    rows.map((p) => ({
      id: p.id.toString(),
      nom: p.nom,
      actif: p.actif,
      magasinId: p.magasinId.toString(),
      magasinNom: p.magasin.nom,
      nbUsers: p.users.length,
      users: p.users.map((u) => ({
        id: u.id.toString(),
        name: u.name,
        role: u.role,
        actif: u.actif,
      })),
    })),
  )
}

export async function listPharmaciesForAssignment() {
  const rows = await prisma.pharmacie.findMany({
    where: { actif: true },
    orderBy: { nom: 'asc' },
    select: { id: true, nom: true },
  })
  return toSerializable(rows.map((p) => ({ id: p.id.toString(), nom: p.nom })))
}

export async function createPharmacie(data: unknown) {
  await requirePharmacieGestion()
  const v = pharmacieSchema.parse(data)
  const magasinId = BigInt(v.magasinId)
  const existing = await prisma.pharmacie.findUnique({ where: { magasinId } })
  if (existing) throw new Error('Ce magasin est déjà lié à une pharmacie.')
  const row = await prisma.pharmacie.create({
    data: { nom: v.nom.trim(), magasinId, actif: v.actif ?? true },
  })
  revalidatePharma()
  return toSerializable({ id: row.id.toString() })
}

export async function updatePharmacie(data: unknown) {
  await requirePharmacieGestion()
  const v = pharmacieUpdateSchema.parse(data)
  const magasinId = BigInt(v.magasinId)
  const conflict = await prisma.pharmacie.findFirst({
    where: { magasinId, id: { not: BigInt(v.id) } },
  })
  if (conflict) throw new Error('Ce magasin est déjà lié à une autre pharmacie.')
  await prisma.pharmacie.update({
    where: { id: BigInt(v.id) },
    data: { nom: v.nom.trim(), magasinId, actif: v.actif ?? true },
  })
  revalidatePharma()
  return { ok: true as const }
}

// ─── Stock ──────────────────────────────────────────────────

export async function listStockLots(params?: { magasinId?: string; q?: string }) {
  await requirePharmacieGestion()
  const where: {
    magasinId?: bigint
    quantite?: { gt: number }
    OR?: object[]
  } = { quantite: { gt: 0 } }
  if (params?.magasinId && params.magasinId !== 'all') {
    where.magasinId = BigInt(params.magasinId)
  }
  if (params?.q?.trim()) {
    const q = params.q.trim()
    where.OR = [
      { numeroLot: { contains: q, mode: 'insensitive' } },
      { produit: { nom: { contains: q, mode: 'insensitive' } } },
    ]
  }
  const rows = await prisma.stockLot.findMany({
    where,
    orderBy: [{ datePeremption: 'asc' }],
    include: {
      produit: {
        select: {
          id: true,
          nom: true,
          dosage: true,
          qteAlerte: true,
          formeGalenique: { select: { libelle: true } },
          conditionnement: { select: { libelle: true } },
        },
      },
      magasin: { select: { id: true, nom: true } },
    },
    take: 500,
  })
  const now = new Date()
  const in30 = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
  return toSerializable(
    rows.map((l) => ({
      id: l.id.toString(),
      produitId: l.produitId.toString(),
      produitNom: l.produit.nom,
      produitDosage: l.produit.dosage,
      produitForme: l.produit.formeGalenique?.libelle ?? '',
      produitConditionnement: l.produit.conditionnement?.libelle ?? '',
      magasinId: l.magasinId.toString(),
      magasinNom: l.magasin.nom,
      numeroLot: l.numeroLot,
      datePeremption: l.datePeremption.toISOString(),
      quantite: l.quantite,
      prixAchat: round2(Number(l.prixAchat)),
      valeur: round2(l.quantite * Number(l.prixAchat)),
      alerteStock: l.quantite <= l.produit.qteAlerte,
      alertePeremption: l.datePeremption <= in30,
    })),
  )
}

// ─── Approvisionnement ──────────────────────────────────────

type ApproLigneInput = {
  produitId: string | null
  quantite: number
  numeroLot: string | null
  datePeremption: string | null
  prixAchatUnitaire: number
}

async function replaceApproLignes(
  tx: Prisma.TransactionClient,
  approId: bigint,
  lignes: ApproLigneInput[],
) {
  await tx.approvisionnementLigne.deleteMany({
    where: { approvisionnementId: approId },
  })
  for (const ligne of lignes) {
    await tx.approvisionnementLigne.create({
      data: {
        approvisionnementId: approId,
        produitId: ligne.produitId ? BigInt(ligne.produitId) : null,
        quantite: ligne.quantite,
        numeroLot: ligne.numeroLot,
        datePeremption: ligne.datePeremption
          ? parseDateOnly(ligne.datePeremption)
          : null,
        prixAchatUnitaire: round2(ligne.prixAchatUnitaire),
      },
    })
  }
}

async function applyApproStock(
  tx: Prisma.TransactionClient,
  appro: {
    id: bigint
    magasinId: bigint
    lignes: {
      produitId: bigint | null
      quantite: number
      numeroLot: string | null
      datePeremption: Date | null
      prixAchatUnitaire: { toString(): string } | number
    }[]
  },
  userId: bigint,
) {
  if (appro.lignes.length === 0) {
    throw new Error('Ajoutez au moins une ligne avant de valider.')
  }
  for (const [i, ligne] of appro.lignes.entries()) {
    const n = i + 1
    if (!ligne.produitId) throw new Error(`Ligne ${n} : produit requis.`)
    if (ligne.quantite <= 0) throw new Error(`Ligne ${n} : quantité invalide.`)
    if (!ligne.numeroLot?.trim()) throw new Error(`Ligne ${n} : n° de lot requis.`)
    if (!ligne.datePeremption) {
      throw new Error(`Ligne ${n} : date de péremption requise.`)
    }
    const prix = Number(ligne.prixAchatUnitaire)
    if (prix < 0) throw new Error(`Ligne ${n} : prix d'achat invalide.`)

    const lot = await upsertStockLot(tx, {
      produitId: ligne.produitId,
      magasinId: appro.magasinId,
      numeroLot: ligne.numeroLot.trim(),
      datePeremption: ligne.datePeremption,
      quantiteDelta: ligne.quantite,
      prixAchat: prix,
    })
    await writeMouvement(tx, {
      type: 'APPRO',
      stockLotId: lot.id,
      quantite: ligne.quantite,
      referenceType: 'Approvisionnement',
      referenceId: appro.id,
      userId,
    })
  }
}

export async function listApprovisionnements() {
  await requirePharmacieGestion()
  const rows = await prisma.approvisionnement.findMany({
    orderBy: { createdAt: 'desc' },
    take: 100,
    include: {
      magasin: { select: { nom: true } },
      fournisseur: { select: { raisonSociale: true } },
      user: { select: { name: true } },
      _count: { select: { lignes: true } },
    },
  })
  return toSerializable(
    rows.map((a) => ({
      id: a.id.toString(),
      numero: a.numero,
      statut: a.statut,
      magasinNom: a.magasin.nom,
      fournisseurNom: a.fournisseur?.raisonSociale ?? null,
      userNom: a.user.name,
      dateReception: a.dateReception.toISOString(),
      nbLignes: a._count.lignes,
      validatedAt: a.validatedAt?.toISOString() ?? null,
      createdAt: a.createdAt?.toISOString() ?? null,
    })),
  )
}

export async function getApprovisionnement(id: string) {
  await requirePharmacieGestion()
  const a = await prisma.approvisionnement.findUnique({
    where: { id: BigInt(id) },
    include: {
      magasin: { select: { nom: true } },
      fournisseur: { select: { raisonSociale: true } },
      user: { select: { name: true } },
      validatedBy: { select: { name: true } },
      lignes: {
        include: {
          produit: {
            select: {
              nom: true,
              dosage: true,
              formeGalenique: { select: { libelle: true } },
              conditionnement: { select: { libelle: true } },
            },
          },
        },
      },
    },
  })
  if (!a) return null
  return toSerializable({
    id: a.id.toString(),
    numero: a.numero,
    statut: a.statut,
    magasinId: a.magasinId.toString(),
    magasinNom: a.magasin.nom,
    fournisseurId: a.fournisseurId?.toString() ?? null,
    fournisseurNom: a.fournisseur?.raisonSociale ?? null,
    userNom: a.user.name,
    dateReception: a.dateReception.toISOString(),
    note: a.note,
    validatedAt: a.validatedAt?.toISOString() ?? null,
    validatedByNom: a.validatedBy?.name ?? null,
    lignes: a.lignes.map((l) => ({
      id: l.id.toString(),
      produitId: l.produitId?.toString() ?? null,
      produitNom: l.produit?.nom ?? '',
      produitDosage: l.produit?.dosage ?? '',
      produitForme: l.produit?.formeGalenique?.libelle ?? '',
      produitConditionnement: l.produit?.conditionnement?.libelle ?? '',
      quantite: l.quantite,
      numeroLot: l.numeroLot ?? '',
      datePeremption: l.datePeremption?.toISOString() ?? '',
      prixAchatUnitaire: round2(Number(l.prixAchatUnitaire)),
    })),
  })
}

/** Crée ou met à jour un brouillon (aucun impact stock). */
export async function saveApprovisionnement(
  data: unknown,
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  try {
    const user = await requirePharmacieGestion()
    const v = saveApproSchema.parse(data)
    const magasinId = BigInt(v.magasinId)
    const magasin = await prisma.magasin.findUnique({ where: { id: magasinId } })
    if (!magasin?.actif) throw new Error('Magasin introuvable ou inactif.')

    const lignes: ApproLigneInput[] = v.lignes.map((l) => ({
      produitId: l.produitId,
      quantite: l.quantite,
      numeroLot: l.numeroLot,
      datePeremption: l.datePeremption,
      prixAchatUnitaire: l.prixAchatUnitaire,
    }))

    const id = await prisma.$transaction(async (tx) => {
      if (v.id) {
        const existing = await tx.approvisionnement.findUnique({
          where: { id: BigInt(v.id) },
        })
        if (!existing) throw new Error('Approvisionnement introuvable.')
        if (existing.statut === 'VALIDE') {
          throw new Error('Cette réception est déjà validée et ne peut plus être modifiée.')
        }
        await tx.approvisionnement.update({
          where: { id: existing.id },
          data: {
            magasinId,
            fournisseurId: v.fournisseurId ? BigInt(v.fournisseurId) : null,
            dateReception: parseDateOnly(v.dateReception),
            note: v.note?.trim() || null,
            statut: 'BROUILLON',
          },
        })
        await replaceApproLignes(tx, existing.id, lignes)
        return existing.id
      }

      const numero = await nextPharmaNumero('APP', tx, 'approvisionnement')
      const appro = await tx.approvisionnement.create({
        data: {
          numero,
          magasinId,
          fournisseurId: v.fournisseurId ? BigInt(v.fournisseurId) : null,
          userId: user.id,
          statut: 'BROUILLON',
          dateReception: parseDateOnly(v.dateReception),
          note: v.note?.trim() || null,
        },
      })
      await replaceApproLignes(tx, appro.id, lignes)
      return appro.id
    })

    revalidatePharma()
    revalidatePath(`/pharmacie/approvisionnements/${id}`)
    return { ok: true, id: id.toString() }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Erreur' }
  }
}

/** Valide un brouillon : incrémente le stock et passe en VALIDE. */
export async function validerApprovisionnement(
  id: string,
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  try {
    const user = await requirePharmacieGestion()
    const approId = BigInt(id)

    await prisma.$transaction(async (tx) => {
      const appro = await tx.approvisionnement.findUnique({
        where: { id: approId },
        include: { lignes: true },
      })
      if (!appro) throw new Error('Approvisionnement introuvable.')
      if (appro.statut === 'VALIDE') {
        throw new Error('Cette réception est déjà validée.')
      }
      if (appro.statut !== 'BROUILLON') {
        throw new Error('Statut invalide pour la validation.')
      }

      await applyApproStock(tx, appro, user.id)

      await tx.approvisionnement.update({
        where: { id: appro.id },
        data: {
          statut: 'VALIDE',
          validatedAt: new Date(),
          validatedById: user.id,
        },
      })
    })

    revalidatePharma()
    revalidatePath(`/pharmacie/approvisionnements/${id}`)
    return { ok: true, id }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Erreur' }
  }
}

/**
 * Raccourci : enregistre puis valide (entrée stock immédiate).
 * Préférer saveApprovisionnement + validerApprovisionnement pour le flux brouillon.
 */
export async function createApprovisionnement(
  data: unknown,
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  try {
    const user = await requirePharmacieGestion()
    const v = createApproSchema.parse(data)
    const magasinId = BigInt(v.magasinId)
    const magasin = await prisma.magasin.findUnique({ where: { id: magasinId } })
    if (!magasin?.actif) throw new Error('Magasin introuvable ou inactif.')

    const lignes: ApproLigneInput[] = v.lignes.map((l) => ({
      produitId: l.produitId,
      quantite: l.quantite,
      numeroLot: l.numeroLot.trim(),
      datePeremption: l.datePeremption,
      prixAchatUnitaire: l.prixAchatUnitaire,
    }))

    const id = await prisma.$transaction(async (tx) => {
      const numero = await nextPharmaNumero('APP', tx, 'approvisionnement')
      const appro = await tx.approvisionnement.create({
        data: {
          numero,
          magasinId,
          fournisseurId: v.fournisseurId ? BigInt(v.fournisseurId) : null,
          userId: user.id,
          statut: 'BROUILLON',
          dateReception: parseDateOnly(v.dateReception),
          note: v.note?.trim() || null,
        },
      })
      await replaceApproLignes(tx, appro.id, lignes)

      const full = await tx.approvisionnement.findUniqueOrThrow({
        where: { id: appro.id },
        include: { lignes: true },
      })
      await applyApproStock(tx, full, user.id)

      await tx.approvisionnement.update({
        where: { id: appro.id },
        data: {
          statut: 'VALIDE',
          validatedAt: new Date(),
          validatedById: user.id,
        },
      })
      return appro.id
    })

    revalidatePharma()
    revalidatePath(`/pharmacie/approvisionnements/${id}`)
    return { ok: true, id: id.toString() }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Erreur' }
  }
}

// ─── Transferts ─────────────────────────────────────────────

export async function listTransferts() {
  await requirePharmacieGestion()
  const rows = await prisma.transfertMagasin.findMany({
    orderBy: { createdAt: 'desc' },
    take: 100,
    include: {
      magasinSource: { select: { nom: true } },
      magasinDest: { select: { nom: true } },
      user: { select: { name: true } },
      _count: { select: { lignes: true } },
    },
  })
  return toSerializable(
    rows.map((t) => ({
      id: t.id.toString(),
      numero: t.numero,
      magasinSourceNom: t.magasinSource.nom,
      magasinDestNom: t.magasinDest.nom,
      userNom: t.user.name,
      statut: t.statut,
      nbLignes: t._count.lignes,
      createdAt: t.createdAt?.toISOString() ?? null,
    })),
  )
}

export async function getTransfert(id: string) {
  await requirePharmacieGestion()
  const t = await prisma.transfertMagasin.findUnique({
    where: { id: BigInt(id) },
    include: {
      magasinSource: { select: { nom: true } },
      magasinDest: { select: { nom: true } },
      user: { select: { name: true } },
      lignes: {
        include: { produit: { select: { nom: true, dosage: true } } },
      },
    },
  })
  if (!t) return null
  return toSerializable({
    id: t.id.toString(),
    numero: t.numero,
    magasinSourceNom: t.magasinSource.nom,
    magasinDestNom: t.magasinDest.nom,
    userNom: t.user.name,
    statut: t.statut,
    note: t.note,
    createdAt: t.createdAt?.toISOString() ?? null,
    lignes: t.lignes.map((l) => ({
      id: l.id.toString(),
      produitNom: l.produit.nom,
      produitDosage: l.produit.dosage,
      numeroLot: l.numeroLot,
      datePeremption: l.datePeremption.toISOString(),
      quantite: l.quantite,
    })),
  })
}

export async function listLotsDisponibles(magasinId: string, produitId?: string) {
  await requirePharmacieGestion()
  const rows = await prisma.stockLot.findMany({
    where: {
      magasinId: BigInt(magasinId),
      quantite: { gt: 0 },
      ...(produitId ? { produitId: BigInt(produitId) } : {}),
    },
    orderBy: [{ datePeremption: 'asc' }],
    include: { produit: { select: { nom: true, dosage: true } } },
  })
  return toSerializable(
    rows.map((l) => ({
      id: l.id.toString(),
      produitId: l.produitId.toString(),
      produitNom: l.produit.nom,
      produitDosage: l.produit.dosage,
      numeroLot: l.numeroLot,
      datePeremption: l.datePeremption.toISOString(),
      quantite: l.quantite,
    })),
  )
}

export async function createTransfert(
  data: unknown,
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  try {
    const user = await requirePharmacieGestion()
    const v = createTransfertSchema.parse(data)
    if (v.magasinSourceId === v.magasinDestId) {
      throw new Error('Les magasins source et destination doivent être différents.')
    }
    const sourceId = BigInt(v.magasinSourceId)
    const destId = BigInt(v.magasinDestId)

    const id = await prisma.$transaction(async (tx) => {
      const numero = await nextPharmaNumero('TRF', tx, 'transfertMagasin')
      const transfert = await tx.transfertMagasin.create({
        data: {
          numero,
          magasinSourceId: sourceId,
          magasinDestId: destId,
          userId: user.id,
          statut: 'EFFECTUE',
          note: v.note?.trim() || null,
        },
      })

      for (const ligne of v.lignes) {
        const lotSource = await tx.stockLot.findUnique({
          where: { id: BigInt(ligne.stockLotId) },
        })
        if (!lotSource || lotSource.magasinId !== sourceId) {
          throw new Error('Lot source introuvable dans le magasin sélectionné.')
        }
        if (lotSource.quantite < ligne.quantite) {
          throw new Error(`Stock insuffisant sur le lot ${lotSource.numeroLot}.`)
        }

        await tx.transfertLigne.create({
          data: {
            transfertId: transfert.id,
            produitId: lotSource.produitId,
            stockLotId: lotSource.id,
            numeroLot: lotSource.numeroLot,
            datePeremption: lotSource.datePeremption,
            quantite: ligne.quantite,
          },
        })

        await upsertStockLot(tx, {
          produitId: lotSource.produitId,
          magasinId: sourceId,
          numeroLot: lotSource.numeroLot,
          datePeremption: lotSource.datePeremption,
          quantiteDelta: -ligne.quantite,
        })
        await writeMouvement(tx, {
          type: 'TRANSFERT_OUT',
          stockLotId: lotSource.id,
          quantite: -ligne.quantite,
          referenceType: 'TransfertMagasin',
          referenceId: transfert.id,
          userId: user.id,
        })

        const lotDest = await upsertStockLot(tx, {
          produitId: lotSource.produitId,
          magasinId: destId,
          numeroLot: lotSource.numeroLot,
          datePeremption: lotSource.datePeremption,
          quantiteDelta: ligne.quantite,
          prixAchat: Number(lotSource.prixAchat),
        })
        await writeMouvement(tx, {
          type: 'TRANSFERT_IN',
          stockLotId: lotDest.id,
          quantite: ligne.quantite,
          referenceType: 'TransfertMagasin',
          referenceId: transfert.id,
          userId: user.id,
        })
      }
      return transfert.id
    })

    revalidatePharma()
    return { ok: true, id: id.toString() }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Erreur' }
  }
}
