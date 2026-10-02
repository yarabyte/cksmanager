import type { Role } from "@/lib/types"

/**
 * Affichage : spécialité et n° d’ordre si le libellé de civilite/titre
 * indique un médecin (Docteur, Professeur) — exclut Madame/Monsieur etc.
 */
export function isMedecinTitre(titre: string | null | undefined): boolean {
  const t = (titre ?? "").trim().toLowerCase()
  if (!t) return false
  return t === "docteur" || t === "professeur"
}

const LEGACY_ROLE_TO_APP: Record<string, Role> = {
  admin: "Admin",
  medecins: "Médecin",
  medecin: "Médecin",
  sage_femme: "Sage femme",
  sagefemme: "Sage femme",
  "sage femme": "Sage femme",
  "sage-femme": "Sage femme",
  sage_femmes: "Sage femme",
  caisse: "Caisse",
  front_office: "Front Office",
  "front office": "Front Office",
  "front-office": "Front Office",
  frontoffice: "Front Office",
  manager: "Manager",
  pharmacie: "Pharmacie",
  commis_pharmacie: "Commis Pharmacie",
  "commis pharmacie": "Commis Pharmacie",
}

const APP_ROLE_TO_LEGACY: Record<Role, string> = {
  Admin: "admin",
  Manager: "manager",
  Médecin: "medecins",
  "Sage femme": "sage_femme",
  "Front Office": "front_office",
  Caisse: "caisse",
  Pharmacie: "pharmacie",
  "Commis Pharmacie": "commis_pharmacie",
}

/** Ordre d’affichage / rôle principal (avatar, en-tête). */
const ROLE_PRIORITY: Role[] = [
  "Admin",
  "Manager",
  "Médecin",
  "Sage femme",
  "Caisse",
  "Pharmacie",
  "Commis Pharmacie",
  "Front Office",
]

function splitLegacyTokens(role: string | null | undefined): string[] {
  if (role == null || role.trim() === "") return []
  return role
    .split(/[,;|]/)
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean)
}

function normalizeRoleLabel(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

/** Groupe perso créé sous le même nom que le rôle fixe — à traiter comme Sage femme. */
export function customGroupLooksLikeSageFemme(group: {
  id: string
  label: string
}): boolean {
  const haystack = `${normalizeRoleLabel(group.id)} ${normalizeRoleLabel(group.label)}`
  return haystack.includes("sage femme") || haystack.includes("sagefemme")
}

/** Groupe perso nommé comme le Front Office. */
export function customGroupLooksLikeFrontOffice(group: {
  id: string
  label: string
}): boolean {
  const haystack = `${normalizeRoleLabel(group.id)} ${normalizeRoleLabel(group.label)}`
  return (
    haystack.includes("front office") ||
    haystack.includes("frontoffice") ||
    haystack.includes("accueil")
  )
}

/** Si le groupe perso duplique un rôle fixe, renvoyer ce rôle. */
export function builtinRoleFromCustomGroup(group: {
  id: string
  label: string
}): Role | null {
  if (customGroupLooksLikeSageFemme(group)) return "Sage femme"
  if (customGroupLooksLikeFrontOffice(group)) return "Front Office"
  return null
}

/**
 * Rôles d’écran à partir de la colonne `users.role`
 * (un ou plusieurs tokens séparés par virgule).
 */
export function mapLegacyRoleStringToAppRoles(
  role: string | null | undefined,
): Role[] {
  const seen = new Set<Role>()
  const roles: Role[] = []
  for (const token of splitLegacyTokens(role)) {
    const app = LEGACY_ROLE_TO_APP[token]
    if (app && !seen.has(app)) {
      seen.add(app)
      roles.push(app)
    }
  }
  return roles
}

/**
 * Rôle principal (compatibilité) — le plus prioritaire parmi les rôles.
 * Chaîne vide ou inconnue → `null`.
 */
export function mapLegacyRoleStringToAppRole(
  role: string | null | undefined,
): Role | null {
  const roles = mapLegacyRoleStringToAppRoles(role)
  if (roles.length === 0) return null
  for (const preferred of ROLE_PRIORITY) {
    if (roles.includes(preferred)) return preferred
  }
  return roles[0] ?? null
}

/** Sérialise des rôles applicatifs vers la colonne legacy (virgules). */
export function serializeAppRolesToLegacy(roles: Role[]): string | null {
  const unique = [...new Set(roles)]
  if (unique.length === 0) return null
  return unique.map((r) => APP_ROLE_TO_LEGACY[r]).join(",")
}

/** Sérialise des tokens legacy (ex. formulaire) vers la colonne. */
export function serializeLegacyRoleTokens(tokens: string[]): string | null {
  const cleaned = [
    ...new Set(
      tokens
        .map((t) => t.trim().toLowerCase())
        .filter((t) => t && LEGACY_ROLE_TO_APP[t]),
    ),
  ]
  return cleaned.length > 0 ? cleaned.join(",") : null
}

export function parseLegacyRoleTokens(role: string | null | undefined): string[] {
  return splitLegacyTokens(role).filter((t) => LEGACY_ROLE_TO_APP[t])
}

export function isCaisseLegacyRole(role: string | null | undefined): boolean {
  return mapLegacyRoleStringToAppRoles(role).includes("Caisse")
}

export function isPharmacieLegacyRole(role: string | null | undefined): boolean {
  const roles = mapLegacyRoleStringToAppRoles(role)
  return roles.includes("Pharmacie") || roles.includes("Commis Pharmacie")
}

export function userHasAnyRole(
  roles: Role[] | null | undefined,
  allowed: readonly Role[],
): boolean {
  if (!roles?.length) return false
  return roles.some((r) => allowed.includes(r))
}

export function userIsAdmin(roles: Role[] | null | undefined): boolean {
  return userHasAnyRole(roles, ["Admin"])
}

/** Assignation médecin sur une visite : rôle Médecin, ou Admin avec titre Dr/Pr. */
export function userCanBeVisitMedecin(
  role: string | null | undefined,
  titre: string | null | undefined,
): boolean {
  const roles = mapLegacyRoleStringToAppRoles(role)
  if (roles.includes("Médecin")) return true
  return roles.includes("Admin") && isMedecinTitre(titre)
}

/**
 * Initiales monogramme (nom complet : prénom le plus souvent en dernier dans la base héritée).
 */
export function getInitialsFromFullName(name: string): string {
  const p = name.trim().split(/\s+/)
  if (p.length === 0) return "?"
  if (p.length === 1) return p[0]!.slice(0, 2).toUpperCase()
  return `${p[0]!.charAt(0)}${p[p.length - 1]!.charAt(0)}`.toUpperCase()
}
