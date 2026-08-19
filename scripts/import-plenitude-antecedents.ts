/**
 * Import Plenitude `tble_antecedants` → `antecedents_patient`.
 * Appariement : même patient + même jour calendaire que la visite (heure la plus proche).
 * Usage :
 *   pnpm db:import-plenitude-antecedents -- --dry-run
 *   pnpm db:import-plenitude-antecedents -- --execute
 */
import { existsSync, readFileSync } from 'fs'
import { join } from 'path'
import { Prisma, PrismaClient, type Prisma as PrismaNS } from '@prisma/client'
import {
  extractAllInsertStatements,
  getValuesInner,
  parseMysqlValues,
  splitValueRows,
} from '../prisma/mysql-insert-utils'

const BATCH_SIZE = 200
const DEMO_MEDECIN_ID = 9002n
const SQL_PATH =
  process.env.PLENITUDE_ANTECEDANTS_SQL ??
  join(process.cwd(), 'plenitude', 'tble_antecedants.sql')

const prisma = new PrismaClient()

type AntecedentRow = PrismaNS.AntecedentPatientCreateManyInput

type VisiteRef = { id: bigint; patientId: bigint; dateVisite: Date }

type RawAntecedent = {
  id: bigint
  patientId: bigint
  refDateTime: Date
  fields: (string | null)[]
}

/** Ordre des colonnes dans INSERT INTO `tble_antecedants` (…) */
const COL = {
  IDAntecedant: 0,
  IDPatient: 1,
  PatMStatut: 2,
  NbrCigarJour: 3,
  NbrAnneeCigar: 4,
  Patalcool: 5,
  Patdrogue: 6,
  ActPhysiq: 7,
  PatPoid: 8,
  PatTaille: 9,
  PatTourT: 10,
  PatPointure: 11,
  PatGoupeSanguin: 12,
  FamiltDiabet: 13,
  FamilHTA: 14,
  FamilTrombo: 15,
  FamilCardioAVC: 16,
  FamilDystroid: 17,
  FamilCancer: 18,
  FamilAutres: 19,
  HistMenarche: 20,
  HistCycleR: 21,
  HistNbreJCycle: 22,
  HistNbreJRegle: 23,
  HistNbreJChange: 24,
  HistMenaup: 25,
  HistTraitMenaup: 26,
  HistDFCV: 27,
  HistDMamo: 28,
  MedHTA: 29,
  MedDiabete: 30,
  MedDyslipidemie: 31,
  Mednote: 32,
  ChirAppendic: 33,
  Chirpelvienne: 34,
  ChirNotes: 35,
  AllMed: 36,
  AllRes: 37,
  AllContact: 38,
  AllAliment: 39,
  Notes: 40,
  GynGestite: 41,
  GynParite: 42,
  GynIST: 43,
  GynConisation: 44,
  GynKystes: 45,
  GynMyomes: 46,
  GynNotes: 47,
  RefName: 48,
  RefDateTime: 49,
  IMC: 50,
  PA: 51,
} as const

function trimOrNull(v: string | null): string | null {
  if (v === null) return null
  const t = v.trim()
  return t.length ? t : null
}

function parseDate(v: string | null): Date | null {
  if (!v) return null
  const d = new Date(v)
  return Number.isNaN(d.getTime()) ? null : d
}

function parseNumber(v: string | null): number | null {
  const t = trimOrNull(v)
  if (!t) return null
  const n = Number.parseFloat(t.replace(',', '.'))
  return Number.isFinite(n) ? n : null
}

function optionalInt(v: string | null): number | null {
  const n = parseNumber(v)
  if (n === null || n < 0) return null
  return Math.round(n)
}

function optionalDecimal(v: string | null, scale = 2): Prisma.Decimal | null {
  let n = parseNumber(v)
  if (n === null || n <= 0) return null
  // Taille parfois en mètres
  if (scale === 1 && n > 0 && n <= 3) n = n * 100
  if (n > 9999) return null
  return new Prisma.Decimal(n.toFixed(scale))
}

function dayKey(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function visitIndexKey(patientId: bigint, day: string): string {
  return `${patientId.toString()}|${day}`
}

function loadRawAntecedents(): RawAntecedent[] {
  if (!existsSync(SQL_PATH)) {
    throw new Error(`Fichier introuvable : ${SQL_PATH}`)
  }
  const sql = readFileSync(SQL_PATH, 'utf8')
  const inserts = extractAllInsertStatements(sql, 'tble_antecedants')
  if (inserts.length === 0) {
    throw new Error('INSERT INTO `tble_antecedants` introuvable')
  }

  const out: RawAntecedent[] = []
  for (const insert of inserts) {
    const inner = getValuesInner(insert)
    if (!inner) continue
    for (const raw of splitValueRows(inner)) {
      const fields = parseMysqlValues(raw)
      if (fields.length < 50) continue
      const idRaw = fields[COL.IDAntecedant]
      const patientRaw = fields[COL.IDPatient]
      const ref = parseDate(fields[COL.RefDateTime])
      if (!idRaw || !patientRaw || !ref) continue
      out.push({
        id: BigInt(idRaw),
        patientId: BigInt(patientRaw),
        refDateTime: ref,
        fields,
      })
    }
  }
  return out
}

function pickClosestVisite(candidates: VisiteRef[], ref: Date): VisiteRef {
  let best = candidates[0]!
  let bestDelta = Math.abs(best.dateVisite.getTime() - ref.getTime())
  for (let i = 1; i < candidates.length; i++) {
    const v = candidates[i]!
    const delta = Math.abs(v.dateVisite.getTime() - ref.getTime())
    if (delta < bestDelta) {
      best = v
      bestDelta = delta
    }
  }
  return best
}

function mapRow(raw: RawAntecedent, visiteId: bigint): AntecedentRow {
  const f = raw.fields
  return {
    id: raw.id,
    visiteId,
    userId: DEMO_MEDECIN_ID,
    situationMatrimoniale: trimOrNull(f[COL.PatMStatut]),
    nbrCigarJour: optionalInt(f[COL.NbrCigarJour]),
    nbrAnneeCigar: optionalInt(f[COL.NbrAnneeCigar]),
    alcool: trimOrNull(f[COL.Patalcool]),
    drogue: trimOrNull(f[COL.Patdrogue]),
    activitePhysique: trimOrNull(f[COL.ActPhysiq]),
    poidsKg: optionalDecimal(f[COL.PatPoid], 2),
    tailleCm: optionalDecimal(f[COL.PatTaille], 1),
    tourTaille: trimOrNull(f[COL.PatTourT]),
    pointure: optionalInt(f[COL.PatPointure]),
    groupeSanguin: trimOrNull(f[COL.PatGoupeSanguin]),
    imc: trimOrNull(f[COL.IMC]),
    pa: trimOrNull(f[COL.PA]),
    familDiabete: trimOrNull(f[COL.FamiltDiabet]),
    familHta: trimOrNull(f[COL.FamilHTA]),
    familTrombo: trimOrNull(f[COL.FamilTrombo]),
    familCardioAvc: trimOrNull(f[COL.FamilCardioAVC]),
    familDysthyroidie: trimOrNull(f[COL.FamilDystroid]),
    familCancer: trimOrNull(f[COL.FamilCancer]),
    familAutres: trimOrNull(f[COL.FamilAutres]),
    menarches: trimOrNull(f[COL.HistMenarche]),
    cyclesReguliers: trimOrNull(f[COL.HistCycleR]),
    nbreJoursCycle: trimOrNull(f[COL.HistNbreJCycle]),
    nbreJoursRegles: trimOrNull(f[COL.HistNbreJRegle]),
    nbreChanges: trimOrNull(f[COL.HistNbreJChange]),
    menopause: trimOrNull(f[COL.HistMenaup]),
    traitMenopause: trimOrNull(f[COL.HistTraitMenaup]),
    dernierFcv: trimOrNull(f[COL.HistDFCV]),
    derniereMammo: trimOrNull(f[COL.HistDMamo]),
    medHta: trimOrNull(f[COL.MedHTA]),
    medDiabete: trimOrNull(f[COL.MedDiabete]),
    medDyslipidemie: trimOrNull(f[COL.MedDyslipidemie]),
    medNotes: trimOrNull(f[COL.Mednote]),
    chirAppendicectomie: trimOrNull(f[COL.ChirAppendic]),
    chirPelvienne: trimOrNull(f[COL.Chirpelvienne]),
    chirNotes: trimOrNull(f[COL.ChirNotes]),
    allMedicaments: trimOrNull(f[COL.AllMed]),
    allRespiratoires: trimOrNull(f[COL.AllRes]),
    allContact: trimOrNull(f[COL.AllContact]),
    allAlimentaires: trimOrNull(f[COL.AllAliment]),
    notesTransfusion: trimOrNull(f[COL.Notes]),
    gynGestite: trimOrNull(f[COL.GynGestite]),
    gynParite: trimOrNull(f[COL.GynParite]),
    gynIst: trimOrNull(f[COL.GynIST]),
    gynConisation: trimOrNull(f[COL.GynConisation]),
    gynKystes: trimOrNull(f[COL.GynKystes]),
    gynMyomes: trimOrNull(f[COL.GynMyomes]),
    gynNotes: trimOrNull(f[COL.GynNotes]),
    createdAt: raw.refDateTime,
    updatedAt: raw.refDateTime,
  }
}

async function buildMappedAntecedents(): Promise<{
  rows: AntecedentRow[]
  skippedNoVisit: number
  skippedDuplicateVisite: number
  totalRaw: number
}> {
  const raws = loadRawAntecedents()
  const visites = await prisma.visite.findMany({
    select: { id: true, patientId: true, dateVisite: true },
  })

  const byPatientDay = new Map<string, VisiteRef[]>()
  for (const v of visites) {
    const key = visitIndexKey(v.patientId, dayKey(v.dateVisite))
    const list = byPatientDay.get(key)
    if (list) list.push(v)
    else byPatientDay.set(key, [v])
  }

  type Candidate = {
    row: AntecedentRow
    deltaMs: number
  }

  const byVisite = new Map<string, Candidate>()
  let skippedNoVisit = 0

  for (const raw of raws) {
    const day = dayKey(raw.refDateTime)
    const candidates = byPatientDay.get(visitIndexKey(raw.patientId, day))
    if (!candidates || candidates.length === 0) {
      skippedNoVisit++
      continue
    }

    const visite = pickClosestVisite(candidates, raw.refDateTime)
    const deltaMs = Math.abs(visite.dateVisite.getTime() - raw.refDateTime.getTime())
    const row = mapRow(raw, visite.id)
    const key = visite.id.toString()
    const prev = byVisite.get(key)
    if (!prev || deltaMs < prev.deltaMs) {
      byVisite.set(key, { row, deltaMs })
    }
  }

  const rows = [...byVisite.values()].map((c) => c.row)
  const skippedDuplicateVisite = raws.length - skippedNoVisit - rows.length

  return {
    rows,
    skippedNoVisit,
    skippedDuplicateVisite: Math.max(0, skippedDuplicateVisite),
    totalRaw: raws.length,
  }
}

function printStats(
  rows: AntecedentRow[],
  skippedNoVisit: number,
  skippedDuplicateVisite: number,
  totalRaw: number,
) {
  const ids = rows.map((p) => p.id as bigint)
  const minId = ids.length ? ids.reduce((a, b) => (a < b ? a : b)) : 0n
  const maxId = ids.length ? ids.reduce((a, b) => (a > b ? a : b)) : 0n

  console.log('--- Stats import antécédents Plenitude ---')
  console.log({
    source: SQL_PATH,
    totalRaw,
    mapped: rows.length,
    skippedNoVisit,
    skippedDuplicateVisite,
    userId: DEMO_MEDECIN_ID.toString(),
    idMin: minId.toString(),
    idMax: maxId.toString(),
  })
  console.log('Échantillon (3 premières lignes) :')
  for (const p of rows.slice(0, 3)) {
    console.log({
      id: (p.id as bigint).toString(),
      visiteId: (p.visiteId as bigint).toString(),
      situationMatrimoniale: p.situationMatrimoniale,
      groupeSanguin: p.groupeSanguin,
      allMedicaments: p.allMedicaments?.slice(0, 40),
    })
  }
}

async function ensurePrerequisites() {
  const medecin = await prisma.user.findUnique({
    where: { id: DEMO_MEDECIN_ID },
    select: { id: true, email: true, name: true },
  })
  if (!medecin) {
    throw new Error(
      `User médecin démo id=${DEMO_MEDECIN_ID} introuvable. Relancer le seed démo (medecin@cks.cm).`,
    )
  }
  console.log(`Prérequis OK : médecin ${medecin.email} (${medecin.name})`)
}

async function purgeAntecedents() {
  const before = await prisma.antecedentPatient.count()
  console.log('État avant purge :', { antecedentsPatient: before })
  const deleted = await prisma.antecedentPatient.deleteMany({})
  console.log('Purge effectuée :', { antecedentsPatient: deleted.count })
}

async function insertAntecedents(rows: AntecedentRow[]) {
  let inserted = 0
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE)
    const result = await prisma.antecedentPatient.createMany({ data: batch })
    inserted += result.count
    console.log(`Insert batch ${i / BATCH_SIZE + 1} : +${result.count} (total ${inserted})`)
  }

  await prisma.$executeRawUnsafe(`
    SELECT setval(
      pg_get_serial_sequence('antecedents_patient', 'id'),
      COALESCE((SELECT MAX(id) FROM antecedents_patient), 1)
    )
  `)

  return inserted
}

async function main() {
  const args = process.argv.slice(2)
  const dryRun = args.includes('--dry-run')
  const execute = args.includes('--execute')

  if (!dryRun && !execute) {
    console.error('Usage : --dry-run | --execute')
    process.exit(1)
  }
  if (dryRun && execute) {
    console.error('Choisir un seul mode : --dry-run ou --execute')
    process.exit(1)
  }

  const { rows, skippedNoVisit, skippedDuplicateVisite, totalRaw } =
    await buildMappedAntecedents()

  printStats(rows, skippedNoVisit, skippedDuplicateVisite, totalRaw)

  if (rows.length === 0) {
    if (dryRun) {
      console.log('Dry-run : aucune ligne mappable.')
      return
    }
    throw new Error('Aucune ligne antécédent mappable')
  }

  if (dryRun) {
    console.log('Dry-run : aucune écriture en base.')
    return
  }

  await ensurePrerequisites()
  await purgeAntecedents()
  const inserted = await insertAntecedents(rows)
  const after = await prisma.antecedentPatient.count()
  console.log(`Import terminé : ${inserted} insérés, count antecedents_patient = ${after}`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => void prisma.$disconnect())
