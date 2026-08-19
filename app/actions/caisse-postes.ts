'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { toSerializable } from '@/lib/json-bigint'
import { requireUser } from '@/lib/auth/session'
import { hasPermissionForRoles } from '@/lib/permissions-server'
import type { CaissePosteRow } from '@/lib/types/caisse-session'

const posteSchema = z.object({
  nom: z.string().min(1).max(100),
  description: z.string().max(255).optional().nullable(),
  actif: z.boolean().optional(),
})

export async function listCaissePostesForAssignment(): Promise<
  { id: string; nom: string }[]
> {
  const user = await requireUser()
  if (!(await hasPermissionForRoles(user.roles, 'configuration', 'view'))) {
    throw new Error('Accès refusé.')
  }

  const rows = await prisma.caissePoste.findMany({
    where: { actif: true },
    orderBy: { nom: 'asc' },
    select: { id: true, nom: true },
  })

  return toSerializable(
    rows.map((r) => ({ id: r.id.toString(), nom: r.nom })),
  ) as { id: string; nom: string }[]
}

export async function listCaissePostes(): Promise<CaissePosteRow[]> {
  const user = await requireUser()
  if (
    !(await hasPermissionForRoles(user.roles, 'configuration', 'view')) &&
    !user.roles.includes('Caisse')
  ) {
    throw new Error('Accès refusé.')
  }

  const rows = await prisma.caissePoste.findMany({
    orderBy: [{ actif: 'desc' }, { nom: 'asc' }],
    include: {
      sessions: {
        where: { statut: 'OUVERTE' },
        select: { id: true, user: { select: { name: true } } },
        take: 1,
      },
    },
  })

  return toSerializable(
    rows.map((r) => ({
      id: r.id.toString(),
      nom: r.nom,
      description: r.description,
      actif: r.actif,
      sessionOuverte: r.sessions[0]
        ? {
            id: r.sessions[0].id.toString(),
            caissierNom: r.sessions[0].user.name,
          }
        : null,
    })),
  ) as CaissePosteRow[]
}

export async function createCaissePoste(
  data: unknown,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const user = await requireUser()
    if (!(await hasPermissionForRoles(user.roles, 'configuration', 'create'))) {
      return { ok: false, error: 'Accès refusé.' }
    }
    const v = posteSchema.parse(data)
    await prisma.caissePoste.create({
      data: {
        nom: v.nom.trim(),
        description: v.description?.trim() || null,
        actif: v.actif ?? true,
      },
    })
    revalidatePath('/configuration/caisses')
    return { ok: true }
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : 'Erreur lors de la création.',
    }
  }
}

export async function updateCaissePoste(
  id: string,
  data: unknown,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const user = await requireUser()
    if (!(await hasPermissionForRoles(user.roles, 'configuration', 'edit'))) {
      return { ok: false, error: 'Accès refusé.' }
    }
    const v = posteSchema.parse(data)
    await prisma.caissePoste.update({
      where: { id: BigInt(id) },
      data: {
        nom: v.nom.trim(),
        description: v.description?.trim() || null,
        actif: v.actif ?? true,
      },
    })
    revalidatePath('/configuration/caisses')
    return { ok: true }
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : 'Erreur lors de la mise à jour.',
    }
  }
}
