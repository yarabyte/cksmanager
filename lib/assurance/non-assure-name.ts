const NON_ASSURE_PATTERN = /non\s*assur/i

/** Détecte l'assurance référentiel « Non assuré » (orthographe variable). */
export function isNonAssureAssuranceName(nom: string): boolean {
  return NON_ASSURE_PATTERN.test(nom.trim())
}
