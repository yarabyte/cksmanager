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

export const observationObstetricaleUpsertSchema = z.object({
  visiteId: idString,

  typeObservation: optStr(100),
  motifConsult: optText,
  ddr: optStr(50),
  dateDebutGrossesse: optStr(50),
  histMaladie: optText,

  mouvementsFoetaux: optStr(255),
  contractions: optStr(255),
  ressentiesDouloureuses: optStr(20),
  endRessenties: optStr(20),
  perteLiquideAmnio: optStr(20),
  pruritVaginal: optStr(20),
  pruritNu: optStr(20),
  signesHta: optStr(20),
  glasgow: optStr(50),
  cephalees: optStr(20),
  endCephalees: optStr(20),
  oedemesMi: optStr(255),
  oedemesMains: optStr(255),
  oedemesVisage: optStr(255),
  barreEpigastrique: optStr(255),
  obnubilation: optStr(255),
  troublesVigilance: optStr(255),
  noteInterrogatoire: optText,

  hauteurUterineCm: optStr(50),
  consistanceUterine: optStr(255),
  malformationUterine: optStr(255),
  speculum: optStr(255),
  metrorragies: optStr(255),
  perteLiquideTarnier: optStr(255),
  aspectLeucorrhees: optStr(255),
  cdsLateraux: optStr(255),

  col: optStr(255),
  presentation: optStr(255),
  cdsDouglas: optStr(255),
  bishop: optStr(20),
  noteToucherVaginal: optText,

  echoObstetricale: optText,

  hypothese1: optText,
  hypothese2: optText,
  hypothese3: optText,
})

export type ObservationObstetricaleUpsertInput = z.infer<
  typeof observationObstetricaleUpsertSchema
>
