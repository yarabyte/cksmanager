'use server'

import { z } from 'zod'
import { Prisma } from '@prisma/client'
import { Decimal } from '@prisma/client/runtime/library'
import { prisma } from '@/lib/prisma'
import { toSerializable } from '@/lib/json-bigint'
import {
  conditionnementCreateSchema,
  conditionnementUpdateSchema,
  formeGaleniqueCreateSchema,
  formeGaleniqueUpdateSchema,
  fournisseurCreateSchema,
  fournisseurUpdateSchema,
  produitCreateSchema,
  produitUpdateSchema,
  produitSitePharmaSchema,
} from '@/lib/validations/pharmacie'

export async function getPharmacieStats() {
  const [conditionnements, formesGaleniques, fournisseurs, produits, produitsActifs] =
    await Promise.all([
      prisma.conditionnement.count(),
      prisma.formeGalenique.count(),
      prisma.fournisseur.count(),
      prisma.produit.count(),
      prisma.produit.count({ where: { actif: true } }),
    ])
  return toSerializable({
    conditionnements,
    formesGaleniques,
    fournisseurs,
    produits,
    produitsActifs,
  })
}

// --- Conditionnements ---

export async function listConditionnements(params?: { q?: string }) {
  const q = params?.q?.trim()
  const where: Prisma.ConditionnementWhereInput =
    q && q.length > 0
      ? { libelle: { contains: q, mode: 'insensitive' } }
      : {}
  const items = await prisma.conditionnement.findMany({
    where,
    orderBy: [{ rank: 'asc' }, { libelle: 'asc' }],
  })
  return toSerializable(items)
}

export async function getConditionnementById(id: string) {
  const row = await prisma.conditionnement.findUnique({
    where: { id: BigInt(id) },
  })
  return row ? toSerializable(row) : null
}

export async function createConditionnement(data: unknown) {
  const v = conditionnementCreateSchema.parse(data)
  const row = await prisma.conditionnement.create({
    data: {
      libelle: v.libelle,
      isCommon: v.isCommon,
      rank: v.rank,
      actif: v.actif,
    },
  })
  return toSerializable(row)
}

export async function updateConditionnement(data: unknown) {
  const v = conditionnementUpdateSchema.parse(data)
  const row = await prisma.conditionnement.update({
    where: { id: BigInt(v.id) },
    data: {
      libelle: v.libelle,
      isCommon: v.isCommon,
      rank: v.rank,
      actif: v.actif,
    },
  })
  return toSerializable(row)
}

export async function deleteConditionnement(id: string) {
  await prisma.conditionnement.delete({ where: { id: BigInt(id) } })
}

// --- Formes galéniques ---

export async function listFormesGaleniques(params?: { q?: string }) {
  const q = params?.q?.trim()
  const where: Prisma.FormeGaleniqueWhereInput =
    q && q.length > 0
      ? { libelle: { contains: q, mode: 'insensitive' } }
      : {}
  const items = await prisma.formeGalenique.findMany({
    where,
    orderBy: [{ rank: 'asc' }, { libelle: 'asc' }],
  })
  return toSerializable(items)
}

export async function getFormeGaleniqueById(id: string) {
  const row = await prisma.formeGalenique.findUnique({
    where: { id: BigInt(id) },
  })
  return row ? toSerializable(row) : null
}

export async function createFormeGalenique(data: unknown) {
  const v = formeGaleniqueCreateSchema.parse(data)
  const row = await prisma.formeGalenique.create({
    data: {
      libelle: v.libelle,
      isCommon: v.isCommon,
      rank: v.rank,
      actif: v.actif,
    },
  })
  return toSerializable(row)
}

export async function updateFormeGalenique(data: unknown) {
  const v = formeGaleniqueUpdateSchema.parse(data)
  const row = await prisma.formeGalenique.update({
    where: { id: BigInt(v.id) },
    data: {
      libelle: v.libelle,
      isCommon: v.isCommon,
      rank: v.rank,
      actif: v.actif,
    },
  })
  return toSerializable(row)
}

export async function deleteFormeGalenique(id: string) {
  await prisma.formeGalenique.delete({ where: { id: BigInt(id) } })
}

// --- Fournisseurs ---

export async function listFournisseurs(params?: { q?: string }) {
  const q = params?.q?.trim()
  const where: Prisma.FournisseurWhereInput =
    q && q.length > 0
      ? {
          OR: [
            { raisonSociale: { contains: q, mode: 'insensitive' } },
            { email: { contains: q, mode: 'insensitive' } },
            { adresse: { contains: q, mode: 'insensitive' } },
          ],
        }
      : {}
  const items = await prisma.fournisseur.findMany({
    where,
    orderBy: { raisonSociale: 'asc' },
  })
  return toSerializable(items)
}

export async function getFournisseurById(id: string) {
  const row = await prisma.fournisseur.findUnique({
    where: { id: BigInt(id) },
  })
  return row ? toSerializable(row) : null
}

export async function createFournisseur(data: unknown) {
  const v = fournisseurCreateSchema.parse(data)
  const row = await prisma.fournisseur.create({
    data: {
      raisonSociale: v.raisonSociale,
      adresse: v.adresse ?? null,
      telephone1: v.telephone1 ?? null,
      telephone2: v.telephone2 ?? null,
      email: v.email ?? null,
      actif: v.actif,
    },
  })
  return toSerializable(row)
}

export async function updateFournisseur(data: unknown) {
  const v = fournisseurUpdateSchema.parse(data)
  const row = await prisma.fournisseur.update({
    where: { id: BigInt(v.id) },
    data: {
      raisonSociale: v.raisonSociale,
      adresse: v.adresse ?? null,
      telephone1: v.telephone1 ?? null,
      telephone2: v.telephone2 ?? null,
      email: v.email ?? null,
      actif: v.actif,
    },
  })
  return toSerializable(row)
}

export async function deleteFournisseur(id: string) {
  await prisma.fournisseur.delete({ where: { id: BigInt(id) } })
}

// --- Produits ---

export async function listProduits(params: {
  q?: string
  formeId?: string
  condId?: string
  assureurId?: string
  sitePharma?: string
  actif?: string
  skip?: number
  take?: number
}) {
  const take = Math.min(params.take ?? 50, 100)
  const skip = params.skip ?? 0
  const q = params.q?.trim()

  const where: Prisma.ProduitWhereInput = {
    ...(q && q.length > 0
      ? {
          OR: [
            { nom: { contains: q, mode: 'insensitive' } },
            { principeActif: { contains: q, mode: 'insensitive' } },
            { codeCip: { contains: q, mode: 'insensitive' } },
          ],
        }
      : {}),
    ...(params.formeId && params.formeId !== 'all'
      ? { formeGaleniqueId: BigInt(params.formeId) }
      : {}),
    ...(params.condId && params.condId !== 'all'
      ? { conditionnementId: BigInt(params.condId) }
      : {}),
    ...(params.assureurId && params.assureurId !== 'all'
      ? params.assureurId === 'none'
        ? { assureurId: null }
        : { assureurId: BigInt(params.assureurId) }
      : {}),
    ...(params.sitePharma === 'CKS' || params.sitePharma === 'PLENITUDE'
      ? { sitePharma: params.sitePharma }
      : {}),
    ...(params.actif === 'true' ? { actif: true } : {}),
    ...(params.actif === 'false' ? { actif: false } : {}),
  }

  const [items, total] = await Promise.all([
    prisma.produit.findMany({
      where,
      skip,
      take,
      orderBy: { id: 'desc' },
      include: {
        formeGalenique: true,
        conditionnement: true,
        assureur: true,
      },
    }),
    prisma.produit.count({ where }),
  ])
  return toSerializable({ items, total })
}

export type ProduitApproSelectOption = {
  id: string
  nom: string
  dosage: string
  prixAchatRef: number
}

/** Tous les produits actifs pour les sélecteurs d'approvisionnement (sans limite artificielle). */
export async function listProduitsForApproSelect(options?: {
  q?: string
  includeIds?: string[]
}): Promise<ProduitApproSelectOption[]> {
  const term = options?.q?.trim()
  const rows = await prisma.produit.findMany({
    where: {
      actif: true,
      ...(term
        ? {
            OR: [
              { nom: { contains: term, mode: 'insensitive' } },
              { dosage: { contains: term, mode: 'insensitive' } },
              { principeActif: { contains: term, mode: 'insensitive' } },
              { codeCip: { contains: term, mode: 'insensitive' } },
            ],
          }
        : {}),
    },
    orderBy: [{ nom: 'asc' }, { id: 'asc' }],
    select: {
      id: true,
      nom: true,
      dosage: true,
      prixAchatRef: true,
    },
  })

  const byId = new Map(
    rows.map((p) => [
      p.id.toString(),
      {
        id: p.id.toString(),
        nom: p.nom,
        dosage: p.dosage,
        prixAchatRef: Number(p.prixAchatRef),
      },
    ]),
  )

  const includeIds = (options?.includeIds ?? []).filter(Boolean)
  if (includeIds.length > 0) {
    const missing = includeIds.filter((id) => !byId.has(id))
    if (missing.length > 0) {
      const extra = await prisma.produit.findMany({
        where: { id: { in: missing.map((id) => BigInt(id)) } },
        select: { id: true, nom: true, dosage: true, prixAchatRef: true },
      })
      for (const p of extra) {
        byId.set(p.id.toString(), {
          id: p.id.toString(),
          nom: p.nom,
          dosage: p.dosage,
          prixAchatRef: Number(p.prixAchatRef),
        })
      }
    }
  }

  return Array.from(byId.values()).sort((a, b) => a.nom.localeCompare(b.nom, 'fr'))
}

export async function getProduitById(id: string) {
  const row = await prisma.produit.findUnique({
    where: { id: BigInt(id) },
    include: {
      formeGalenique: true,
      conditionnement: true,
      assureur: true,
    },
  })
  return row ? toSerializable(row) : null
}

function dec(s: string): Decimal {
  return new Decimal(s)
}

export async function createProduit(data: unknown) {
  const v = produitCreateSchema.parse(data)
  const row = await prisma.produit.create({
    data: {
      nom: v.nom,
      principeActif: v.principeActif ?? null,
      codeCip: v.codeCip ?? null,
      formeGaleniqueId: BigInt(v.formeGaleniqueId),
      dosage: v.dosage,
      conditionnementId: BigInt(v.conditionnementId),
      qteParConditionnement: v.qteParConditionnement,
      prixAchatRef: dec(v.prixAchatRef),
      prixVenteRef: dec(v.prixVenteRef),
      hnc: v.hnc && v.hnc.length > 0 ? dec(v.hnc) : null,
      qteAlerte: v.qteAlerte,
      assureurId: v.assureurId ? BigInt(v.assureurId) : null,
      sitePharma: v.sitePharma,
      actif: v.actif,
    },
    include: {
      formeGalenique: true,
      conditionnement: true,
      assureur: true,
    },
  })
  return toSerializable(row)
}

export async function updateProduit(data: unknown) {
  const v = produitUpdateSchema.parse(data)
  const row = await prisma.produit.update({
    where: { id: BigInt(v.id) },
    data: {
      nom: v.nom,
      principeActif: v.principeActif ?? null,
      codeCip: v.codeCip ?? null,
      formeGaleniqueId: BigInt(v.formeGaleniqueId),
      dosage: v.dosage,
      conditionnementId: BigInt(v.conditionnementId),
      qteParConditionnement: v.qteParConditionnement,
      prixAchatRef: dec(v.prixAchatRef),
      prixVenteRef: dec(v.prixVenteRef),
      hnc: v.hnc && v.hnc.length > 0 ? dec(v.hnc) : null,
      qteAlerte: v.qteAlerte,
      assureurId: v.assureurId ? BigInt(v.assureurId) : null,
      sitePharma: v.sitePharma,
      actif: v.actif,
    },
    include: {
      formeGalenique: true,
      conditionnement: true,
      assureur: true,
    },
  })
  return toSerializable(row)
}

export async function deleteProduit(id: string) {
  await prisma.produit.delete({ where: { id: BigInt(id) } })
}

export async function updateProduitSitePharma(data: unknown) {
  const v = z
    .object({
      id: z.string().regex(/^\d+$/),
      sitePharma: produitSitePharmaSchema,
    })
    .parse(data)
  const row = await prisma.produit.update({
    where: { id: BigInt(v.id) },
    data: { sitePharma: v.sitePharma },
    include: {
      formeGalenique: true,
      conditionnement: true,
      assureur: true,
    },
  })
  return toSerializable(row)
}
