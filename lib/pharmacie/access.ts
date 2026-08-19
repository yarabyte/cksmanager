import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { getCurrentUser, requireUser } from '@/lib/auth/session'
import { toSerializable } from '@/lib/json-bigint'
import { userHasAnyRole } from '@/lib/user-role'
import type { Role } from '@/lib/types'
import type { PharmacieAccessible } from '@/lib/types/pharmacie-sortie'
import {
  canGererPharmacie,
  canValiderSortie,
  PHARMACIE_GESTION_ROLES,
  PHARMACIE_SORTIE_ROLES,
} from '@/lib/pharmacie/roles'

export { canGererPharmacie, canValiderSortie }

const GESTION_ROLES = PHARMACIE_GESTION_ROLES
const SORTIE_ROLES = PHARMACIE_SORTIE_ROLES

export async function requirePharmacieGestion() {
  const user = await requireUser()
  if (!userHasAnyRole(user.roles, GESTION_ROLES)) {
    throw new Error('Accès réservé à la pharmacie, au Manager et à l’Admin.')
  }
  return user
}

export async function requirePharmacieSortie() {
  const user = await requireUser()
  if (!userHasAnyRole(user.roles, SORTIE_ROLES)) {
    throw new Error('Accès réservé au personnel pharmacie.')
  }
  return user
}

export async function requirePharmaciePageGestion() {
  const user = await getCurrentUser()
  if (!user || !userHasAnyRole(user.roles, GESTION_ROLES)) {
    redirect('/dashboard')
  }
  return user
}

export async function requirePharmaciePageSortie() {
  const user = await getCurrentUser()
  if (!user || !userHasAnyRole(user.roles, SORTIE_ROLES)) {
    redirect('/dashboard')
  }
  return user
}

const SORTIE_GLOBAL_ROLES: Role[] = ['Admin', 'Manager']

export async function listPharmaciesAccessiblesPourSortie(): Promise<PharmacieAccessible[]> {
  const user = await requirePharmacieSortie()
  const global = userHasAnyRole(user.roles, SORTIE_GLOBAL_ROLES)

  if (global) {
    const rows = await prisma.pharmacie.findMany({
      where: { actif: true },
      include: { magasin: { select: { id: true, nom: true } } },
      orderBy: { nom: 'asc' },
    })
    return toSerializable(
      rows.map((p) => ({
        id: p.id.toString(),
        nom: p.nom,
        magasinId: p.magasinId.toString(),
        magasinNom: p.magasin.nom,
      })),
    ) as PharmacieAccessible[]
  }

  const row = await prisma.user.findUnique({
    where: { id: user.id },
    include: {
      pharmacie: {
        include: { magasin: { select: { id: true, nom: true } } },
      },
    },
  })
  if (!row?.pharmacie?.actif) return []

  return toSerializable([
    {
      id: row.pharmacie.id.toString(),
      nom: row.pharmacie.nom,
      magasinId: row.pharmacie.magasinId.toString(),
      magasinNom: row.pharmacie.magasin.nom,
    },
  ]) as PharmacieAccessible[]
}

export async function assertPharmacieAccessible(pharmacieId: string) {
  const pharmacies = await listPharmaciesAccessiblesPourSortie()
  if (!pharmacies.some((p) => p.id === pharmacieId)) {
    throw new Error('Pharmacie inaccessible.')
  }
  return pharmacies
}
