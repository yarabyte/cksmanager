export type ObsObstFieldKey =
  | 'typeObservation'
  | 'motifConsult'
  | 'ddr'
  | 'dateDebutGrossesse'
  | 'histMaladie'
  | 'mouvementsFoetaux'
  | 'contractions'
  | 'ressentiesDouloureuses'
  | 'endRessenties'
  | 'perteLiquideAmnio'
  | 'pruritVaginal'
  | 'pruritNu'
  | 'signesHta'
  | 'glasgow'
  | 'cephalees'
  | 'endCephalees'
  | 'oedemesMi'
  | 'oedemesMains'
  | 'oedemesVisage'
  | 'barreEpigastrique'
  | 'obnubilation'
  | 'troublesVigilance'
  | 'noteInterrogatoire'
  | 'hauteurUterineCm'
  | 'consistanceUterine'
  | 'malformationUterine'
  | 'speculum'
  | 'metrorragies'
  | 'perteLiquideTarnier'
  | 'aspectLeucorrhees'
  | 'cdsLateraux'
  | 'col'
  | 'presentation'
  | 'cdsDouglas'
  | 'bishop'
  | 'noteToucherVaginal'
  | 'echoObstetricale'
  | 'hypothese1'
  | 'hypothese2'
  | 'hypothese3'

export type ObsObstFieldKind = 'text' | 'textarea' | 'select' | 'ouiNon'

export type ObsObstFieldOption = { value: string; label: string }

export type ObsObstFieldDef = {
  key: ObsObstFieldKey
  label: string
  kind?: ObsObstFieldKind
  options?: ObsObstFieldOption[]
  hint?: string
}

export type ObsObstTabDef = {
  id: string
  label: string
  shortLabel: string
  description: string
  fields: ObsObstFieldDef[]
}

export type ObsObstFormState = Record<ObsObstFieldKey, string>

export const OUI_NON_OPTIONS: ObsObstFieldOption[] = [
  { value: 'Oui', label: 'Oui' },
  { value: 'Non', label: 'Non' },
]

export const TYPE_OBSERVATION_OPTIONS: ObsObstFieldOption[] = [
  { value: 'Urgence', label: 'Urgence' },
  { value: 'Consultation prénatale', label: 'Consultation prénatale' },
]

export const END_OPTIONS: ObsObstFieldOption[] = Array.from(
  { length: 11 },
  (_, i) => ({ value: String(i), label: String(i) }),
)

export const BISHOP_OPTIONS: ObsObstFieldOption[] = Array.from(
  { length: 14 },
  (_, i) => ({ value: String(i), label: String(i) }),
)

export function emptyObsObstForm(): ObsObstFormState {
  return {
    typeObservation: '',
    motifConsult: '',
    ddr: '',
    dateDebutGrossesse: '',
    histMaladie: '',
    mouvementsFoetaux: '',
    contractions: '',
    ressentiesDouloureuses: '',
    endRessenties: '',
    perteLiquideAmnio: '',
    pruritVaginal: '',
    pruritNu: '',
    signesHta: '',
    glasgow: '',
    cephalees: '',
    endCephalees: '',
    oedemesMi: '',
    oedemesMains: '',
    oedemesVisage: '',
    barreEpigastrique: '',
    obnubilation: '',
    troublesVigilance: '',
    noteInterrogatoire: '',
    hauteurUterineCm: '',
    consistanceUterine: '',
    malformationUterine: '',
    speculum: '',
    metrorragies: '',
    perteLiquideTarnier: '',
    aspectLeucorrhees: '',
    cdsLateraux: '',
    col: '',
    presentation: '',
    cdsDouglas: '',
    bishop: '',
    noteToucherVaginal: '',
    echoObstetricale: '',
    hypothese1: '',
    hypothese2: '',
    hypothese3: '',
  }
}

export function normalizeOuiNon(v: string): string {
  const t = v.trim().toLowerCase()
  if (t === 'oui' || t === 'o' || t === 'yes' || t === '1') return 'Oui'
  if (t === 'non' || t === 'n' || t === 'no' || t === '0') return 'Non'
  if (v === 'Oui' || v === 'Non') return v
  return v
}

export const OBS_OBST_OUI_NON_KEYS: ObsObstFieldKey[] = [
  'ressentiesDouloureuses',
  'perteLiquideAmnio',
  'pruritVaginal',
  'pruritNu',
  'signesHta',
  'cephalees',
]

export const OBS_OBST_TABS: ObsObstTabDef[] = [
  {
    id: 'motif',
    label: 'Motif de la consultation',
    shortLabel: 'Motif',
    description: 'Type, motif et histoire de la grossesse',
    fields: [
      {
        key: 'typeObservation',
        label: 'Type Observation',
        kind: 'ouiNon',
        options: TYPE_OBSERVATION_OPTIONS,
      },
      { key: 'motifConsult', label: 'Motif de consultation', kind: 'textarea' },
      {
        key: 'ddr',
        label: 'Date des dernières règles',
        hint: 'Format libre (ex. 18/05/2026)',
      },
      {
        key: 'dateDebutGrossesse',
        label: 'Date de début de grossesse',
        hint: 'Format libre',
      },
      {
        key: 'histMaladie',
        label: 'Histoire de la maladie / Anamnèse',
        kind: 'textarea',
      },
    ],
  },
  {
    id: 'interrogatoire',
    label: 'Interrogatoire',
    shortLabel: 'Interro.',
    description: 'Symptômes et signes fonctionnels',
    fields: [
      { key: 'mouvementsFoetaux', label: 'Mouvements actifs fœtaux' },
      { key: 'contractions', label: 'Contraction (Nbre/10 min)' },
      {
        key: 'ressentiesDouloureuses',
        label: 'Ressenties douloureuses',
        kind: 'ouiNon',
        options: OUI_NON_OPTIONS,
      },
      {
        key: 'endRessenties',
        label: 'END',
        kind: 'select',
        options: END_OPTIONS,
        hint: 'Échelle numérique de la douleur (0–10)',
      },
      {
        key: 'perteLiquideAmnio',
        label: 'Perte de liquide amniotique',
        kind: 'ouiNon',
        options: OUI_NON_OPTIONS,
      },
      {
        key: 'pruritVaginal',
        label: 'Prurit vaginal',
        kind: 'ouiNon',
        options: OUI_NON_OPTIONS,
      },
      {
        key: 'pruritNu',
        label: 'Prurit Nu',
        kind: 'ouiNon',
        options: OUI_NON_OPTIONS,
      },
      {
        key: 'signesHta',
        label: 'Signes d’HTA',
        kind: 'ouiNon',
        options: OUI_NON_OPTIONS,
      },
      { key: 'glasgow', label: 'Glasgow' },
      {
        key: 'cephalees',
        label: 'Céphalées',
        kind: 'ouiNon',
        options: OUI_NON_OPTIONS,
      },
      {
        key: 'endCephalees',
        label: 'END',
        kind: 'select',
        options: END_OPTIONS,
        hint: 'Échelle numérique de la douleur (0–10)',
      },
      { key: 'oedemesMi', label: 'Œdèmes des membres inférieurs' },
      { key: 'oedemesMains', label: 'Œdèmes des mains' },
      { key: 'oedemesVisage', label: 'Œdèmes du visage' },
      { key: 'barreEpigastrique', label: 'Barre épigastrique' },
      { key: 'obnubilation', label: 'Obnubilation' },
      { key: 'troublesVigilance', label: 'Troubles de la vigilance' },
      { key: 'noteInterrogatoire', label: 'Note', kind: 'textarea' },
    ],
  },
  {
    id: 'examen',
    label: 'Examen physique',
    shortLabel: 'Examen',
    description: 'Examen clinique obstétrical',
    fields: [
      { key: 'hauteurUterineCm', label: 'Hauteur utérine en cm' },
      { key: 'consistanceUterine', label: 'Consistance utérine' },
      { key: 'malformationUterine', label: 'Malformation utérine palpable' },
      { key: 'speculum', label: 'Spéculum' },
      { key: 'metrorragies', label: 'Métrorragies' },
      {
        key: 'perteLiquideTarnier',
        label: 'Perte de liquide amniotique, signe de Tarnier',
      },
      { key: 'aspectLeucorrhees', label: 'Aspect des leucorrhées' },
      { key: 'cdsLateraux', label: 'CDS latéraux' },
    ],
  },
  {
    id: 'toucher',
    label: 'Toucher vaginal',
    shortLabel: 'TV',
    description: 'Toucher vaginal et score de Bishop',
    fields: [
      { key: 'col', label: 'Col' },
      { key: 'presentation', label: 'Présentation' },
      { key: 'cdsDouglas', label: 'CDS de Douglas' },
      {
        key: 'bishop',
        label: 'Bishop',
        kind: 'select',
        options: BISHOP_OPTIONS,
      },
      { key: 'noteToucherVaginal', label: 'Note', kind: 'textarea' },
    ],
  },
  {
    id: 'echo',
    label: 'Écho obstétricale',
    shortLabel: 'Écho',
    description: 'Compte-rendu échographique',
    fields: [
      {
        key: 'echoObstetricale',
        label: 'Écho obstétricale',
        kind: 'textarea',
      },
    ],
  },
  {
    id: 'hypotheses',
    label: 'Hypothèses diagnostiques',
    shortLabel: 'Hypothèses',
    description: 'Hypothèses et conduites à tenir',
    fields: [
      {
        key: 'hypothese1',
        label: 'Hypothèses diagnostiques N°1',
        kind: 'textarea',
      },
      {
        key: 'hypothese2',
        label: 'Hypothèses diagnostiques N°2',
        kind: 'textarea',
      },
      {
        key: 'hypothese3',
        label: 'Hypothèses diagnostiques N°3',
        kind: 'textarea',
      },
    ],
  },
]
