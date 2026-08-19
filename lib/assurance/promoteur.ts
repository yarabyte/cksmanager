/** Messages d’erreur exposés au client. */
export const MSG_ASSIGN_PROMOTEUR =
  'Seul le promoteur propriétaire peut affecter cette assurance.'

export const MSG_TAUX_PROMOTEUR =
  'Seul le promoteur propriétaire peut modifier le taux de cette assurance.'

export type AssurancePromoteurFields = {
  promoteurUserId?: bigint | string | null
}

export function isAssurancePromoteur(
  assurance: AssurancePromoteurFields | null | undefined,
): boolean {
  if (!assurance) return false
  const id = assurance.promoteurUserId
  return id != null && String(id) !== ''
}

/** Assurances classiques : tout le monde ; promoteur : uniquement le propriétaire. */
export function canAssignAssurance(
  userId: bigint | string,
  assurance: AssurancePromoteurFields | null | undefined,
): boolean {
  if (!isAssurancePromoteur(assurance)) return true
  return String(assurance!.promoteurUserId) === String(userId)
}

/** Même règle que l’assignation pour le taux / couvertures d’une assurance promoteur. */
export function canEditTauxPromoteur(
  userId: bigint | string,
  assurance: AssurancePromoteurFields | null | undefined,
): boolean {
  if (!isAssurancePromoteur(assurance)) return true
  return String(assurance!.promoteurUserId) === String(userId)
}

export function assertCanAssignAssurance(
  userId: bigint | string,
  assurance: AssurancePromoteurFields | null | undefined,
): void {
  if (!canAssignAssurance(userId, assurance)) {
    throw new Error(MSG_ASSIGN_PROMOTEUR)
  }
}

export function assertCanEditTauxPromoteur(
  userId: bigint | string,
  assurance: AssurancePromoteurFields | null | undefined,
): void {
  if (!canEditTauxPromoteur(userId, assurance)) {
    throw new Error(MSG_TAUX_PROMOTEUR)
  }
}
