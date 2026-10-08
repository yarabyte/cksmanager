/** Part patient hors HNC couverte par un avoir d'exonération. */

export function roundMoney(n: number): number {
  return Math.round(n * 100) / 100
}

export function montantExonereLigne(ligne: {
  typeLigne?: string
  exonerePartPatient?: boolean
  montantPatient: number
  hnc: number
  quantite: number
}): number {
  if (ligne.typeLigne && ligne.typeLigne !== "ACTE") return 0
  if (!ligne.exonerePartPatient) return 0
  const hncTotal = roundMoney(ligne.hnc * ligne.quantite)
  return roundMoney(Math.max(0, ligne.montantPatient - hncTotal))
}
