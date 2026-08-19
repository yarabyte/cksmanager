"use server"

import { revalidatePath } from "next/cache"
import { Prisma } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { requireUserId } from "@/lib/auth/session"
import {
  isCaisseLegacyRole,
  isMedecinTitre,
  isPharmacieLegacyRole,
  mapLegacyRoleStringToAppRole,
  mapLegacyRoleStringToAppRoles,
  serializeLegacyRoleTokens,
} from "@/lib/user-role"
import { userUpdateSchema } from "@/lib/validations/user"
import type { Role } from "@/lib/types"

export type UserConfigRow = {
  id: string
  name: string
  email: string
  actif: boolean
  /** Rôle principal (affichage). */
  appRole: Role | null
  /** Tous les rôles applicatifs. */
  appRoles: Role[]
  roleRaw: string | null
  titre: string | null
  showMedecinFields: boolean
  specialite: string | null
  numeroOrdre: string | null
  telephone: string | null
  code: string | null
  caissePosteId: string | null
  caissePosteNom: string | null
  pharmacieId: string | null
  pharmacieNom: string | null
}

function toRow(u: {
  id: bigint
  name: string
  email: string
  actif: boolean
  role: string | null
  titre: string | null
  specialite: string | null
  numeroOrdre: string | null
  telephone: string | null
  code: string | null
  caissePosteId: bigint | null
  caissePoste?: { nom: string } | null
  pharmacieId: bigint | null
  pharmacie?: { nom: string } | null
}): UserConfigRow {
  const appRoles = mapLegacyRoleStringToAppRoles(u.role)
  return {
    id: u.id.toString(),
    name: u.name,
    email: u.email,
    actif: u.actif,
    appRole: mapLegacyRoleStringToAppRole(u.role),
    appRoles,
    roleRaw: u.role,
    titre: u.titre,
    showMedecinFields: isMedecinTitre(u.titre),
    specialite: u.specialite,
    numeroOrdre: u.numeroOrdre,
    telephone: u.telephone,
    code: u.code,
    caissePosteId: u.caissePosteId?.toString() ?? null,
    caissePosteNom: u.caissePoste?.nom ?? null,
    pharmacieId: u.pharmacieId?.toString() ?? null,
    pharmacieNom: u.pharmacie?.nom ?? null,
  }
}

const userInclude = {
  caissePoste: { select: { nom: true } },
  pharmacie: { select: { nom: true } },
} as const

/** Liste tous les utilisateurs (page configuration). */
export async function listUsersForConfig(): Promise<UserConfigRow[]> {
  const rows = await prisma.user.findMany({
    orderBy: { id: "asc" },
    include: userInclude,
  })
  return rows.map(toRow)
}

/** Utilisateurs actifs pour sélecteurs (ex. promoteur assureur). */
export async function listActiveUsersForSelect(): Promise<
  { id: string; name: string; email: string }[]
> {
  await requireUserId()
  const rows = await prisma.user.findMany({
    where: { actif: true },
    orderBy: { name: "asc" },
    select: { id: true, name: true, email: true },
  })
  return rows.map((u) => ({
    id: u.id.toString(),
    name: u.name,
    email: u.email,
  }))
}

/** Un seul utilisateur par id (page modifier). */
export async function getUserById(id: string): Promise<UserConfigRow | null> {
  const u = await prisma.user.findUnique({
    where: { id: BigInt(id) },
    include: userInclude,
  })
  if (!u) return null
  return toRow(u)
}

/** Met à jour les champs modifiables d'un utilisateur. */
export async function updateUser(
  id: string,
  data: unknown,
): Promise<UserConfigRow> {
  const parsed = userUpdateSchema.parse(data)
  const roleValue =
    parsed.roles !== undefined
      ? serializeLegacyRoleTokens(parsed.roles)
      : parsed.role?.trim() || null
  const caisseRole = isCaisseLegacyRole(roleValue)
  const pharmacieRole = isPharmacieLegacyRole(roleValue)

  let caissePosteId: bigint | null = null
  if (caisseRole && parsed.caissePosteId) {
    const poste = await prisma.caissePoste.findUnique({
      where: { id: BigInt(parsed.caissePosteId) },
      select: { id: true, actif: true },
    })
    if (!poste || !poste.actif) {
      throw new Error("Poste de caisse introuvable ou inactif.")
    }
    caissePosteId = poste.id
  }

  let pharmacieId: bigint | null = null
  if (pharmacieRole && parsed.pharmacieId) {
    const ph = await prisma.pharmacie.findUnique({
      where: { id: BigInt(parsed.pharmacieId) },
      select: { id: true, actif: true },
    })
    if (!ph || !ph.actif) {
      throw new Error("Pharmacie introuvable ou inactive.")
    }
    pharmacieId = ph.id
  }

  const updated = await prisma.user.update({
    where: { id: BigInt(id) },
    data: {
      name: parsed.name,
      email: parsed.email,
      titre: parsed.titre ?? null,
      code: parsed.code ?? null,
      telephone: parsed.telephone ?? null,
      specialite: parsed.specialite ?? null,
      numeroOrdre: parsed.numeroOrdre ?? null,
      role: roleValue,
      actif: parsed.actif,
      caissePosteId: caisseRole ? caissePosteId : null,
      pharmacieId: pharmacieRole ? pharmacieId : null,
    },
    include: userInclude,
  })
  revalidatePath("/configuration/utilisateurs")
  revalidatePath(`/configuration/utilisateurs/${id}/edit`)
  revalidatePath("/caisse/ouverture")
  return toRow(updated)
}

/** Supprime un utilisateur (échoue s’il a des données liées). */
export async function deleteUser(
  id: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const currentId = await requireUserId()
    const userId = BigInt(id)
    if (userId === currentId) {
      return { ok: false, error: "Vous ne pouvez pas supprimer votre propre compte." }
    }

    const existing = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true },
    })
    if (!existing) {
      return { ok: false, error: "Utilisateur introuvable." }
    }

    await prisma.user.delete({ where: { id: userId } })
    revalidatePath("/configuration/utilisateurs")
    return { ok: true }
  } catch (e) {
    if (
      e instanceof Prisma.PrismaClientKnownRequestError &&
      (e.code === "P2003" || e.code === "P2014")
    ) {
      return {
        ok: false,
        error:
          "Impossible de supprimer cet utilisateur : des données lui sont encore liées. Désactivez le compte à la place.",
      }
    }
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Erreur lors de la suppression",
    }
  }
}
