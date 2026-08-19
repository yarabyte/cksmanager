/**
 * Calcul de valorisation d'une ligne de feuille de circulation.
 *
 * Logique portée à l'identique du contrôleur Laravel
 * `CategorieActeRealiseController` (méthodes store/update), mais factorisée
 * dans une fonction pure unique pour éviter la duplication et permettre les tests.
 */

export type LigneType = 'ACTE' | 'PHARMA'

/** Arrondi monétaire à 2 décimales (half-up, montants positifs). */
export function round2(value: number): number {
  if (!Number.isFinite(value)) return 0
  return Math.round((value + Number.EPSILON) * 100) / 100
}

/**
 * Normalise un décimal saisi "1 234,56" => 1234.56.
 * Retourne `null` si vide ou non numérique (équivalent Laravel `normalizeDecimal`).
 */
export function normalizeDecimal(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null
  let v = String(value)
    .replace(/\u00a0/g, '')
    .replace(/\s/g, '')
    .replace(',', '.')
  if (v === '') return null
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

type ValeursTarif = Map<string, number> | Record<string, number>

function getValeurTarif(valeurs: ValeursTarif, codeBase: string): number | undefined {
  const v = valeurs instanceof Map ? valeurs.get(codeBase) : valeurs[codeBase]
  return v != null && v > 0 ? v : undefined
}

/**
 * Valeur unitaire d'un point pour un acte :
 * 1. grille de l'assurance patient (si renseignée)
 * 2. sinon tarif de l'assureur lié à l'acte (ex. PAD pour le labo)
 */
export function resolveValeurUnitairePoint(
  codeBase: string | null | undefined,
  affiliationValeurs: ValeursTarif,
  acteTarifValeurs?: ValeursTarif | number | null,
): number {
  if (!codeBase) return 0
  const fromActeTarif =
    typeof acteTarifValeurs === 'number'
      ? acteTarifValeurs > 0
        ? acteTarifValeurs
        : undefined
      : acteTarifValeurs
        ? getValeurTarif(acteTarifValeurs, codeBase)
        : undefined
  return getValeurTarif(affiliationValeurs, codeBase) ?? fromActeTarif ?? 0
}

export type ComputeLigneInput = {
  typeLigne: LigneType
  quantite: number
  /** Taux de couverture appliqué (%) */
  taux: number
  /** HNC unitaire saisi (override). null => valeur par défaut acte/produit. */
  hncSaisi?: number | null

  // ── Ligne ACTE ──
  valeurFixe?: number | null
  coefficient?: number | null
  /** AssuranceValeur.valeur_unitaire matché sur code_base de l'assurance active. */
  valeurUnitairePoint?: number | null
  acteHnc?: number | null
  /** 0/1 — si 1, la ligne est intégralement imputée au patient. */
  imputeAssurance?: number | null

  // ── Ligne PHARMA ──
  /** Prix de vente unitaire (défaut produit.prix_vente_ref). */
  pu?: number | null
  /** Remise unitaire. */
  remise?: number | null
  produitHnc?: number | null
}

export type ComputeLigneResult = {
  /** Valeur unitaire nette (point acte valorisé, ou PU net pharma). */
  valeur: number
  /** HNC unitaire appliqué. */
  hnc: number
  /** Snapshot prix de vente unitaire (pharma uniquement). */
  puSnapshot: number | null
  /** Snapshot remise unitaire (pharma uniquement). */
  remiseUnitaire: number | null
  montantTotal: number
  montantAssurance: number
  montantPatient: number
  /** Snapshot de l'imputation assurance (0/1) — pour les lignes ACTE. */
  imputeAssurance: number | null
}

export function computeLigne(input: ComputeLigneInput): ComputeLigneResult {
  const quantite = Math.max(1, Math.trunc(input.quantite || 1))
  const taux = Number.isFinite(input.taux) ? input.taux : 0

  let valeur: number
  let puSnapshot: number | null = null
  let remiseUnitaire: number | null = null
  let defaultHnc: number
  let imputeAssurance: number | null = null

  if (input.typeLigne === 'PHARMA') {
    const pu = Number(input.pu ?? 0)
    const remise = Number(input.remise ?? 0)
    valeur = Math.max(0, round2(pu - remise))
    puSnapshot = round2(pu)
    remiseUnitaire = round2(remise)
    defaultHnc = Number(input.produitHnc ?? 0)
  } else {
    if (input.valeurFixe !== null && input.valeurFixe !== undefined) {
      valeur = Number(input.valeurFixe)
    } else {
      const coefficient = Number(input.coefficient ?? 0)
      const valeurPoint = Number(input.valeurUnitairePoint ?? 0)
      valeur = coefficient * valeurPoint
    }
    valeur = round2(valeur)
    defaultHnc = Number(input.acteHnc ?? 0)
    imputeAssurance = input.imputeAssurance ?? null
  }

  const totalBase = round2(valeur * quantite)

  const hncU = round2(input.hncSaisi ?? defaultHnc)
  const hncTotal = round2(hncU * quantite)

  let montantAssurance = round2((totalBase * taux) / 100)
  let montantPatient = round2(totalBase - montantAssurance + hncTotal)
  const montantTotal = round2(totalBase + hncTotal)

  // Acte imputé intégralement au patient (aucune prise en charge assurance)
  if (input.typeLigne === 'ACTE' && input.imputeAssurance === 1) {
    montantPatient = montantTotal
    montantAssurance = 0
  }

  return {
    valeur,
    hnc: hncU,
    puSnapshot,
    remiseUnitaire,
    montantTotal,
    montantAssurance,
    montantPatient,
    imputeAssurance,
  }
}
