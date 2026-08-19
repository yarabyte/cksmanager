export type AntecedentFieldKey =
  | 'situationMatrimoniale'
  | 'nbrCigarJour'
  | 'nbrAnneeCigar'
  | 'alcool'
  | 'drogue'
  | 'activitePhysique'
  | 'poidsKg'
  | 'tailleCm'
  | 'tourTaille'
  | 'pointure'
  | 'groupeSanguin'
  | 'imc'
  | 'pa'
  | 'familDiabete'
  | 'familHta'
  | 'familTrombo'
  | 'familCardioAvc'
  | 'familDysthyroidie'
  | 'familCancer'
  | 'familAutres'
  | 'menarches'
  | 'cyclesReguliers'
  | 'nbreJoursCycle'
  | 'nbreJoursRegles'
  | 'nbreChanges'
  | 'menopause'
  | 'traitMenopause'
  | 'dernierFcv'
  | 'derniereMammo'
  | 'medHta'
  | 'medDiabete'
  | 'medDyslipidemie'
  | 'medNotes'
  | 'chirAppendicectomie'
  | 'chirPelvienne'
  | 'chirNotes'
  | 'allMedicaments'
  | 'allRespiratoires'
  | 'allContact'
  | 'allAlimentaires'
  | 'notesTransfusion'
  | 'gynGestite'
  | 'gynParite'
  | 'gynIst'
  | 'gynConisation'
  | 'gynKystes'
  | 'gynMyomes'
  | 'gynNotes'

export type AntecedentFieldKind =
  | 'text'
  | 'number'
  | 'textarea'
  | 'select'
  | 'ouiNon'
  | 'readonly'

export type AntecedentFieldOption = { value: string; label: string }

export const GROUPE_SANGUIN_OPTIONS: AntecedentFieldOption[] = [
  { value: 'A Rhésus Positif', label: 'A Rhésus Positif' },
  { value: 'A Rhésus Négatif', label: 'A Rhésus Négatif' },
  { value: 'B Rhésus Positif', label: 'B Rhésus Positif' },
  { value: 'B Rhésus Négatif', label: 'B Rhésus Négatif' },
  { value: 'AB Rhésus Positif', label: 'AB Rhésus Positif' },
  { value: 'AB Rhésus Négatif', label: 'AB Rhésus Négatif' },
  { value: 'O Rhésus Positif', label: 'O Rhésus Positif' },
  { value: 'O Rhésus Négatif', label: 'O Rhésus Négatif' },
]

export const OUI_NON_OPTIONS: AntecedentFieldOption[] = [
  { value: 'Oui', label: 'Oui' },
  { value: 'Non', label: 'Non' },
]

/** Normalise O/N, oui/non, etc. vers Oui | Non | "". */
export function normalizeOuiNon(raw: string | null | undefined): string {
  if (raw == null) return ''
  const t = raw.trim().toLowerCase()
  if (!t) return ''
  if (['oui', 'o', 'y', 'yes', '1', 'true'].includes(t)) return 'Oui'
  if (['non', 'n', 'no', '0', 'false'].includes(t)) return 'Non'
  if (t === 'oui' || raw.trim() === 'Oui') return 'Oui'
  if (t === 'non' || raw.trim() === 'Non') return 'Non'
  return raw.trim()
}

export type AntecedentFieldDef = {
  key: AntecedentFieldKey
  label: string
  kind?: AntecedentFieldKind
  options?: AntecedentFieldOption[]
  hint?: string
}

export type AntecedentTabDef = {
  id: string
  label: string
  shortLabel?: string
  description: string
  accent?: 'default' | 'danger'
  fields: AntecedentFieldDef[]
}

export const ANTECEDENT_TABS: AntecedentTabDef[] = [
  {
    id: 'mode-vie',
    label: 'Mode de vie',
    shortLabel: 'Vie',
    description: 'Habitudes, mensurations et groupe sanguin',
    fields: [
      { key: 'situationMatrimoniale', label: 'Situation matrimoniale' },
      { key: 'nbrCigarJour', label: 'Cigarettes / jour', kind: 'number' },
      {
        key: 'nbrAnneeCigar',
        label: 'Années de tabac',
        kind: 'number',
        hint: 'Durée de consommation (années)',
      },
      {
        key: 'pa',
        label: 'PA (paquet-années)',
        kind: 'readonly',
        hint: 'Auto : (cigarettes/jour × années) ÷ 20',
      },
      { key: 'alcool', label: 'Alcool', kind: 'ouiNon', options: OUI_NON_OPTIONS },
      { key: 'drogue', label: 'Drogue', kind: 'ouiNon', options: OUI_NON_OPTIONS },
      { key: 'activitePhysique', label: 'Activité physique' },
      {
        key: 'poidsKg',
        label: 'Poids (kg)',
        kind: 'readonly',
        hint: 'Dernier poids des paramètres (date/heure de prise)',
      },
      { key: 'tailleCm', label: 'Taille (cm)', kind: 'number' },
      { key: 'tourTaille', label: 'Tour de taille' },
      { key: 'pointure', label: 'Pointure', kind: 'number' },
      {
        key: 'groupeSanguin',
        label: 'Groupe sanguin',
        kind: 'select',
        options: GROUPE_SANGUIN_OPTIONS,
      },
      {
        key: 'imc',
        label: 'IMC',
        kind: 'readonly',
        hint: 'Dernier IMC des paramètres',
      },
    ],
  },
  {
    id: 'familiaux',
    label: 'Familiaux',
    shortLabel: 'Famille',
    description: 'Antécédents familiaux notables',
    fields: [
      { key: 'familDiabete', label: 'Diabète' },
      { key: 'familHta', label: 'HTA' },
      { key: 'familTrombo', label: 'Thromboemboliques' },
      { key: 'familCardioAvc', label: 'Cardio / AVC' },
      { key: 'familDysthyroidie', label: 'Dysthyroïdie' },
      { key: 'familCancer', label: 'Cancer' },
      { key: 'familAutres', label: 'Autres', kind: 'textarea' },
    ],
  },
  {
    id: 'hist-genitale',
    label: 'Hist. vie génitale',
    shortLabel: 'Génitale',
    description: 'Cycles, ménopause et dépistages',
    fields: [
      { key: 'menarches', label: 'Ménarches' },
      { key: 'cyclesReguliers', label: 'Cycles réguliers' },
      { key: 'nbreJoursCycle', label: 'Jours de cycle' },
      { key: 'nbreJoursRegles', label: 'Jours de règles' },
      { key: 'nbreChanges', label: 'Nbre de changes' },
      { key: 'menopause', label: 'Ménopause', kind: 'textarea' },
      { key: 'traitMenopause', label: 'Traitement ménopause', kind: 'textarea' },
      { key: 'dernierFcv', label: 'Dernier FCV' },
      { key: 'derniereMammo', label: 'Dernière mammo' },
    ],
  },
  {
    id: 'medicaux',
    label: 'Médicaux',
    shortLabel: 'Méd.',
    description: 'Pathologies et traitements connus',
    fields: [
      { key: 'medHta', label: 'HTA' },
      { key: 'medDiabete', label: 'Diabète' },
      { key: 'medDyslipidemie', label: 'Dyslipidémie' },
      { key: 'medNotes', label: 'Notes', kind: 'textarea' },
    ],
  },
  {
    id: 'chirurgicaux',
    label: 'Chirurgicaux',
    shortLabel: 'Chir.',
    description: 'Interventions et suites opératoires',
    fields: [
      {
        key: 'chirAppendicectomie',
        label: 'Appendicectomie',
        kind: 'ouiNon',
        options: OUI_NON_OPTIONS,
      },
      { key: 'chirPelvienne', label: 'Chir. pelvienne', kind: 'textarea' },
      { key: 'chirNotes', label: 'Notes', kind: 'textarea' },
    ],
  },
  {
    id: 'allergies',
    label: 'Allergies',
    shortLabel: 'Allergies',
    description: 'À renseigner avec attention — risque clinique',
    accent: 'danger',
    fields: [
      { key: 'allMedicaments', label: 'Médicaments', kind: 'textarea' },
      { key: 'allRespiratoires', label: 'Respiratoires', kind: 'textarea' },
      { key: 'allContact', label: 'Contact', kind: 'textarea' },
      { key: 'allAlimentaires', label: 'Alimentaires', kind: 'textarea' },
    ],
  },
  {
    id: 'transfusion',
    label: 'Transfusion',
    shortLabel: 'Transf.',
    description: 'Antécédents transfusionnels',
    fields: [{ key: 'notesTransfusion', label: 'Notes', kind: 'textarea' }],
  },
  {
    id: 'gyneco',
    label: 'Gynéco.',
    shortLabel: 'Gynéco',
    description: 'Gestité, parité et pathologie gynécologique',
    fields: [
      { key: 'gynGestite', label: 'Gestité' },
      { key: 'gynParite', label: 'Parité' },
      { key: 'gynIst', label: 'IST' },
      { key: 'gynConisation', label: 'Conisation' },
      { key: 'gynKystes', label: 'Kystes' },
      { key: 'gynMyomes', label: 'Myomes' },
      { key: 'gynNotes', label: 'Notes', kind: 'textarea' },
    ],
  },
]

export const ANTECEDENT_FIELD_KEYS = ANTECEDENT_TABS.flatMap((t) =>
  t.fields.map((f) => f.key),
)

export type AntecedentFormState = Record<AntecedentFieldKey, string>

export function emptyAntecedentForm(): AntecedentFormState {
  return Object.fromEntries(
    ANTECEDENT_FIELD_KEYS.map((k) => [k, '']),
  ) as AntecedentFormState
}

/**
 * Indice paquet-années : (cigarettes/jour × années de tabac) / 20
 * Paquets/an ≈ cigarettes/jour × 365 / 20
 */
export function computePaquetAnnees(
  nbrCigarJour: string | number | null | undefined,
  nbrAnneeCigar: string | number | null | undefined,
): string {
  const cig =
    typeof nbrCigarJour === 'number'
      ? nbrCigarJour
      : Number.parseFloat(String(nbrCigarJour ?? '').replace(',', '.'))
  const years =
    typeof nbrAnneeCigar === 'number'
      ? nbrAnneeCigar
      : Number.parseFloat(String(nbrAnneeCigar ?? '').replace(',', '.'))
  if (!Number.isFinite(cig) || !Number.isFinite(years) || cig < 0 || years < 0) {
    return ''
  }
  const pa = Math.round(((cig * years) / 20) * 100) / 100
  return String(pa)
}
