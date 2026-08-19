import { z } from 'zod'

const idString = z.string().regex(/^\d+$/)

function emptyToNull(v: unknown) {
  if (v === undefined) return undefined
  if (v === null) return null
  if (typeof v === 'string' && v.trim() === '') return null
  return v
}

const optStr = (max: number) =>
  z.preprocess(emptyToNull, z.string().max(max).nullable().optional())

const optText = z.preprocess(emptyToNull, z.string().nullable().optional())

const optInt = z.preprocess(emptyToNull, z.coerce.number().int().nullable().optional())

const optDecimal = z.preprocess(
  emptyToNull,
  z.coerce.number().nullable().optional(),
)

export const antecedentPatientUpsertSchema = z.object({
  visiteId: idString,

  situationMatrimoniale: optStr(100),
  nbrCigarJour: optInt,
  nbrAnneeCigar: optInt,
  alcool: optStr(100),
  drogue: optStr(100),
  activitePhysique: optStr(100),
  poidsKg: optDecimal,
  tailleCm: optDecimal,
  tourTaille: optStr(50),
  pointure: optInt,
  groupeSanguin: optStr(50),
  imc: optStr(20),
  pa: optStr(20),

  familDiabete: optStr(255),
  familHta: optStr(255),
  familTrombo: optStr(255),
  familCardioAvc: optStr(255),
  familDysthyroidie: optStr(255),
  familCancer: optStr(255),
  familAutres: optStr(255),

  menarches: optStr(100),
  cyclesReguliers: optStr(50),
  nbreJoursCycle: optStr(50),
  nbreJoursRegles: optStr(50),
  nbreChanges: optStr(50),
  menopause: optText,
  traitMenopause: optText,
  dernierFcv: optStr(100),
  derniereMammo: optStr(100),

  medHta: optStr(255),
  medDiabete: optStr(255),
  medDyslipidemie: optStr(255),
  medNotes: optText,

  chirAppendicectomie: optStr(100),
  chirPelvienne: optText,
  chirNotes: optText,

  allMedicaments: optText,
  allRespiratoires: optText,
  allContact: optText,
  allAlimentaires: optText,

  notesTransfusion: optText,

  gynGestite: optStr(100),
  gynParite: optStr(100),
  gynIst: optStr(255),
  gynConisation: optStr(255),
  gynKystes: optStr(255),
  gynMyomes: optStr(255),
  gynNotes: optText,
})

export type AntecedentPatientUpsertInput = z.infer<
  typeof antecedentPatientUpsertSchema
>
