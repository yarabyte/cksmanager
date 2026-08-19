import { prisma } from '@/lib/prisma'
import {
  getVisiteIdsEligiblesAntecedents,
  isVisiteEligibleAntecedents,
} from '@/lib/medical/eligibilite-antecedents'
import { SEXE_FEMININ } from '@/lib/medical/eligibilite-obs-gyneco'

/**
 * Visite listable pour observation obstétricale ⇔
 * éligible antécédents (payée / part ≤ 0 / fiche existante)
 * ET patiente féminine, OU fiche obs. obstétricale déjà saisie.
 */
export async function getVisiteIdsEligiblesObsObstetricale(): Promise<bigint[]> {
  const [baseEligible, avecObs, patientesFemmes] = await Promise.all([
    getVisiteIdsEligiblesAntecedents(),
    prisma.observationObstetricale.findMany({
      select: { visiteId: true },
    }),
    prisma.patient.findMany({
      where: { sexe: SEXE_FEMININ },
      select: { id: true },
    }),
  ])

  const femmes = new Set(patientesFemmes.map((p) => p.id.toString()))

  const visitesBase = baseEligible.length
    ? await prisma.visite.findMany({
        where: { id: { in: baseEligible } },
        select: { id: true, patientId: true },
      })
    : []

  const ids = new Set<string>()
  for (const v of visitesBase) {
    if (femmes.has(v.patientId.toString())) ids.add(v.id.toString())
  }
  for (const r of avecObs) ids.add(r.visiteId.toString())

  return [...ids].map((id) => BigInt(id))
}

export async function isVisiteEligibleObsObstetricale(
  visiteId: bigint,
): Promise<boolean> {
  const dejaSaisi = await prisma.observationObstetricale.findUnique({
    where: { visiteId },
    select: { id: true },
  })
  if (dejaSaisi) return true

  const visite = await prisma.visite.findUnique({
    where: { id: visiteId },
    select: { patientId: true },
  })
  if (!visite) return false

  const patient = await prisma.patient.findUnique({
    where: { id: visite.patientId },
    select: { sexe: true },
  })
  if (!patient || patient.sexe !== SEXE_FEMININ) return false

  return isVisiteEligibleAntecedents(visiteId)
}
