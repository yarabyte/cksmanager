/** Options prédéfinies pour la bandelette urinaire. */

export const BANDELETTE_QUALI_VALUES = [
  'negatif',
  'trace',
  'plus',
  'plus_plus',
  'plus_plus_plus',
] as const

export type BandeletteQuali = (typeof BANDELETTE_QUALI_VALUES)[number]

export const BANDELETTE_NITRITE_VALUES = ['negatif', 'positif'] as const
export type BandeletteNitrite = (typeof BANDELETTE_NITRITE_VALUES)[number]

export const BANDELETTE_PH_VALUES = [
  '5',
  '5.5',
  '6',
  '6.5',
  '7',
  '7.5',
  '8',
  '8.5',
  '9',
] as const

export type BandelettePh = (typeof BANDELETTE_PH_VALUES)[number]

export const BANDELETTE_SUCRE_VALUES = [
  'negatif',
  'trace',
  'plus',
  'plus_plus',
  'plus_plus_plus',
  'plus_plus_plus_plus',
] as const

export type BandeletteSucre = (typeof BANDELETTE_SUCRE_VALUES)[number]

export const bandeletteQualiLabels: Record<BandeletteQuali, string> = {
  negatif: 'Négatif',
  trace: 'Trace',
  plus: '+',
  plus_plus: '++',
  plus_plus_plus: '+++',
}

export const bandeletteNitriteLabels: Record<BandeletteNitrite, string> = {
  negatif: 'Négatif',
  positif: 'Positif',
}

export const bandeletteSucreLabels: Record<BandeletteSucre, string> = {
  ...bandeletteQualiLabels,
  plus_plus_plus_plus: '++++',
}

export const AGE_PEDIATRIQUE_MAX = 15
