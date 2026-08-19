import type { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'

const NON_ASSURE_PATTERN = /non\s*assur/i

/** Détecte l'assurance référentiel « Non assuré » (orthographe variable). */
export function isNonAssureAssuranceName(nom: string): boolean {
  return NON_ASSURE_PATTERN.test(nom.trim())
}

type Db = Prisma.TransactionClient | typeof prisma

/** Assurance « Non assuré » configurée dans le référentiel. */
export async function findNonAssureAssurance(tx?: Prisma.TransactionClient) {
  const db: Db = tx ?? prisma
  return db.assurance.findFirst({
    where: { nom: { contains: 'non assur', mode: 'insensitive' } },
    include: { assuranceValeurs: true },
  })
}

/**
 * Lie le patient à « Non assuré » s'il n'a aucune affiliation.
 * Retourne true si le patient est (ou devient) non assuré.
 */
export async function ensurePatientNonAssureLink(patientId: bigint): Promise<boolean> {
  const existing = await prisma.assurancePatient.findFirst({
    where: { patientId },
    include: { assurance: { select: { nom: true } } },
  })
  if (existing) return isNonAssureAssuranceName(existing.assurance.nom)

  const assurance = await findNonAssureAssurance()
  if (!assurance) return false

  await prisma.assurancePatient.create({
    data: {
      patientId,
      assuranceId: assurance.id,
      tauxCouverture: 0,
    },
  })
  return true
}
