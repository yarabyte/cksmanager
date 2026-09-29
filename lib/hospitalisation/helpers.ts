import { prisma } from '@/lib/prisma'

/** True si la visite a une hospitalisation sans date de sortie / statut EN_COURS. */
export async function hasHospitalisationEnCoursForVisite(
  visiteId: bigint,
): Promise<boolean> {
  const row = await prisma.hospitalisation.findUnique({
    where: { visiteId },
    select: { dateSortie: true, statut: true },
  })
  if (!row) return false
  return row.dateSortie == null && row.statut === 'EN_COURS'
}
