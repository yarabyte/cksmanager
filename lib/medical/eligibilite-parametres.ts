import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'

/**
 * Visite listable pour paramètres ⇔
 * - feuille PAYEE / part patient ≤ 0, ou facture PAYEE / montantPatient ≤ 0
 * - OU fiche paramètres déjà saisie (ex. import historique sans facturation)
 */
export async function getVisiteIdsEligiblesParametres(): Promise<bigint[]> {
  const [feuillesPayees, facturesOk, feuillesZeroPatient, avecParametres] =
    await Promise.all([
      prisma.feuilleCirculation.findMany({
        where: { statutPaiement: 'PAYEE' },
        select: { visiteId: true },
        distinct: ['visiteId'],
      }),
      prisma.facture.findMany({
        where: {
          OR: [{ statut: 'PAYEE' }, { montantPatient: { lte: 0 } }],
        },
        select: { visiteId: true },
        distinct: ['visiteId'],
      }),
      prisma.$queryRaw<{ visite_id: bigint }[]>`
      SELECT DISTINCT f.visite_id
      FROM feuilles_circulation f
      LEFT JOIN feuille_circulation_lignes l ON l.feuille_id = f.id
      GROUP BY f.id, f.visite_id
      HAVING COALESCE(SUM(l.montant_patient), 0) <= 0
    `,
      prisma.parametrePatient.findMany({
        select: { visiteId: true },
      }),
    ])

  const ids = new Set<string>()
  for (const r of feuillesPayees) ids.add(r.visiteId.toString())
  for (const r of facturesOk) ids.add(r.visiteId.toString())
  for (const r of feuillesZeroPatient) ids.add(r.visite_id.toString())
  for (const r of avecParametres) ids.add(r.visiteId.toString())

  return [...ids].map((id) => BigInt(id))
}

export async function isVisiteEligibleParametres(visiteId: bigint): Promise<boolean> {
  const dejaSaisi = await prisma.parametrePatient.findUnique({
    where: { visiteId },
    select: { id: true },
  })
  if (dejaSaisi) return true

  const feuillePayee = await prisma.feuilleCirculation.findFirst({
    where: { visiteId, statutPaiement: 'PAYEE' },
    select: { id: true },
  })
  if (feuillePayee) return true

  const factureOk = await prisma.facture.findFirst({
    where: {
      visiteId,
      OR: [{ statut: 'PAYEE' }, { montantPatient: { lte: 0 } }],
    },
    select: { id: true },
  })
  if (factureOk) return true

  const zeroRows = await prisma.$queryRaw<{ ok: number }[]>`
    SELECT 1 AS ok
    FROM feuilles_circulation f
    LEFT JOIN feuille_circulation_lignes l ON l.feuille_id = f.id
    WHERE f.visite_id = ${visiteId}
    GROUP BY f.id
    HAVING COALESCE(SUM(l.montant_patient), 0) <= 0
    LIMIT 1
  `
  return zeroRows.length > 0
}

/** Filtre Prisma réutilisable (feuilles PAYEE / factures OK / params déjà saisis). */
export function visiteEligibleWhere(): Prisma.VisiteWhereInput {
  return {
    OR: [
      { parametrePatient: { isNot: null } },
      { feuillesCirculation: { some: { statutPaiement: 'PAYEE' } } },
      {
        factures: {
          some: {
            OR: [{ statut: 'PAYEE' }, { montantPatient: { lte: 0 } }],
          },
        },
      },
    ],
  }
}
