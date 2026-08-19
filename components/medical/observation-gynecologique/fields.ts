export type ObsGynecoFieldKey =
  | 'typeConsult'
  | 'motifConsult'
  | 'ddr'
  | 'contraception'
  | 'dernierFcv'
  | 'derniereMammo'
  | 'menopause'
  | 'thm'
  | 'histMaladie'
  | 'modeVieSexuelle'
  | 'menorragies'
  | 'metrorragies'
  | 'dysmenorrhees'
  | 'algiesPelviennes'
  | 'dyspareunies'
  | 'prurit'
  | 'noteInterrogatoire'
  | 'seins'
  | 'inspection'
  | 'palpation'
  | 'eruptionGenitale'
  | 'leucorrhees'
  | 'metrorragiesExam'
  | 'col'
  | 'vagin'
  | 'auscultation'
  | 'toucherVaginal'
  | 'culsSacLateraux'
  | 'culSacDouglas'
  | 'notePhysique'
  | 'echoPelvienne'
  | 'hypothese1'
  | 'hypothese2'
  | 'hypothese3'

export type ObsGynecoFieldKind = 'text' | 'textarea'

export type ObsGynecoFieldDef = {
  key: ObsGynecoFieldKey
  label: string
  kind?: ObsGynecoFieldKind
  hint?: string
}

export type ObsGynecoTabDef = {
  id: string
  label: string
  shortLabel: string
  description: string
  fields: ObsGynecoFieldDef[]
}

export type ObsGynecoFormState = Record<ObsGynecoFieldKey, string>

export function emptyObsGynecoForm(): ObsGynecoFormState {
  return {
    typeConsult: '',
    motifConsult: '',
    ddr: '',
    contraception: '',
    dernierFcv: '',
    derniereMammo: '',
    menopause: '',
    thm: '',
    histMaladie: '',
    modeVieSexuelle: '',
    menorragies: '',
    metrorragies: '',
    dysmenorrhees: '',
    algiesPelviennes: '',
    dyspareunies: '',
    prurit: '',
    noteInterrogatoire: '',
    seins: '',
    inspection: '',
    palpation: '',
    eruptionGenitale: '',
    leucorrhees: '',
    metrorragiesExam: '',
    col: '',
    vagin: '',
    auscultation: '',
    toucherVaginal: '',
    culsSacLateraux: '',
    culSacDouglas: '',
    notePhysique: '',
    echoPelvienne: '',
    hypothese1: '',
    hypothese2: '',
    hypothese3: '',
  }
}

export const OBS_GYNECO_TABS: ObsGynecoTabDef[] = [
  {
    id: 'motifs',
    label: 'Motifs',
    shortLabel: 'Motifs',
    description: 'Motif de consultation et histoire de la maladie',
    fields: [
      { key: 'typeConsult', label: 'Type de consultation' },
      { key: 'motifConsult', label: 'Motif de la consultation', kind: 'textarea' },
      {
        key: 'ddr',
        label: 'Date des dernières règles',
        hint: 'Format libre (ex. 06/07/2026)',
      },
      { key: 'contraception', label: 'Contraception' },
      { key: 'dernierFcv', label: 'Dernier FCV' },
      {
        key: 'derniereMammo',
        label: 'Dernière mammographie',
        hint: 'Format libre (date ou JAMAIS)',
      },
      { key: 'menopause', label: 'Ménopause' },
      { key: 'thm', label: 'THM' },
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
    description: 'Symptômes et mode de vie sexuelle',
    fields: [
      { key: 'modeVieSexuelle', label: 'Mode de vie sexuelle' },
      { key: 'menorragies', label: 'Ménorragies' },
      { key: 'metrorragies', label: 'Métrorragies' },
      { key: 'dysmenorrhees', label: 'Dysménorrhées' },
      { key: 'algiesPelviennes', label: 'Algies pelviennes' },
      { key: 'dyspareunies', label: 'Dyspareunies' },
      { key: 'prurit', label: 'Prurit' },
      { key: 'noteInterrogatoire', label: 'Note', kind: 'textarea' },
    ],
  },
  {
    id: 'examen',
    label: 'Examen physique',
    shortLabel: 'Examen',
    description: 'Examen clinique gynécologique',
    fields: [
      { key: 'seins', label: 'Seins' },
      { key: 'inspection', label: 'Inspection' },
      { key: 'palpation', label: 'Palpation' },
      { key: 'eruptionGenitale', label: 'Éruption génitale' },
      { key: 'leucorrhees', label: 'Leucorrhées' },
      { key: 'metrorragiesExam', label: 'Métrorragies' },
      { key: 'col', label: 'Col' },
      { key: 'vagin', label: 'Vagin' },
      { key: 'auscultation', label: 'Auscultation' },
      { key: 'toucherVaginal', label: 'Toucher vaginal' },
      { key: 'culsSacLateraux', label: 'Culs de sac latéraux' },
      { key: 'culSacDouglas', label: 'Cul de sac de Douglas' },
      { key: 'notePhysique', label: 'Note', kind: 'textarea' },
    ],
  },
  {
    id: 'echo',
    label: 'Échographie pelvienne',
    shortLabel: 'Écho',
    description: 'Compte-rendu échographique',
    fields: [
      {
        key: 'echoPelvienne',
        label: 'Échographie pelvienne',
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
