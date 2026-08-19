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

export const observationGynecologiqueUpsertSchema = z.object({
  visiteId: idString,

  typeConsult: optStr(100),
  motifConsult: optText,
  ddr: optStr(50),
  contraception: optStr(255),
  dernierFcv: optStr(100),
  derniereMammo: optStr(100),
  menopause: optStr(255),
  thm: optStr(255),
  histMaladie: optText,

  modeVieSexuelle: optStr(255),
  menorragies: optStr(255),
  metrorragies: optStr(255),
  dysmenorrhees: optStr(255),
  algiesPelviennes: optStr(255),
  dyspareunies: optStr(255),
  prurit: optStr(255),
  noteInterrogatoire: optText,

  seins: optStr(255),
  inspection: optStr(255),
  palpation: optStr(255),
  eruptionGenitale: optStr(255),
  leucorrhees: optStr(255),
  metrorragiesExam: optStr(255),
  col: optStr(255),
  vagin: optStr(255),
  auscultation: optStr(255),
  toucherVaginal: optStr(255),
  culsSacLateraux: optStr(255),
  culSacDouglas: optStr(255),
  notePhysique: optText,

  echoPelvienne: optText,

  hypothese1: optText,
  hypothese2: optText,
  hypothese3: optText,
})

export type ObservationGynecologiqueUpsertInput = z.infer<
  typeof observationGynecologiqueUpsertSchema
>
