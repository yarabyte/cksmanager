/** IMC = poids (kg) / (taille m)² — 1 décimale. Safe for client & server. */
export function computeImc(poidsKg: number, tailleCm: number): number {
  if (!Number.isFinite(poidsKg) || !Number.isFinite(tailleCm) || tailleCm <= 0) {
    return 0
  }
  const m = tailleCm / 100
  const imc = poidsKg / (m * m)
  return Math.round(imc * 10) / 10
}
