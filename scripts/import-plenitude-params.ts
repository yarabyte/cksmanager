/**
 * Import Plenitude `tble_param` → `parametres_patient`.
 * Appariement : même patient + même jour calendaire que la visite (heure la plus proche).
 * Usage :
 *   pnpm db:import-plenitude-params -- --dry-run
 *   pnpm db:import-plenitude-params -- --execute
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
import { computeImc } from '../lib/medical/imc'
import {
  BANDELETTE_NITRITE_VALUES,
  BANDELETTE_PH_VALUES,
  BANDELETTE_QUALI_VALUES,
  BANDELETTE_SUCRE_VALUES,
} from '../lib/medical/bandelette'

const BATCH_SIZE = 200
const DEMO_MEDECIN_ID = 9002n
const SQL_PATH =
  process.env.PLENITUDE_PARAM_SQL ??
  join(process.cwd(), 'plenitude', 'tble_param.sql')

const prisma = new PrismaClient()

type ParamRow = PrismaNS.ParametrePatientCreateManyInput

type VisiteRef = { id: bigint; patientId: bigint; dateVisite: Date }

type RawParam = {
  id: bigint
  patientId: bigint
  refDateTime: Date
  fields: (string | null)[]
}

/** Ordre des colonnes dans INSERT INTO `tble_param` (…) */
const COL = {
  IDParam: 0,
  IDPatient: 1,
  StatutVisite: 2,
  PatPoids: 3,
  PatTaille: 4,
  PatPAS: 5,
  PatPAD: 6,
  PatPOUL: 7,
  PatTemp: 8,
  BUNitrite: 9,
  BUSang: 10,
  BULeuco: 11,
  BUProteine: 12,
  BUCetone: 13,
  BUPH: 14,
  sucre: 15,
  RefName: 16,
  RefDateTime: 17,
  IMC: 18,
  pcranien: 19,
  pbrachial: 20,
  frespiratoire: 21,
  sao2: 22,
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

function dayKey(d: Date): string {
  // Jour calendaire local (aligné sur les timestamps MySQL importés sans TZ explicite)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function visitIndexKey(patientId: bigint, day: string): string {
  return `${patientId.toString()}|${day}`
}

function normalizeBp(raw: string | null): number | null {
  const n = parseNumber(raw)
  if (n === null || n <= 0) return null
  const rounded = Math.round(n)
  if (rounded <= 30) return rounded * 10
  return rounded
}

function mapNitrite(raw: string | null): (typeof BANDELETTE_NITRITE_VALUES)[number] {
  const t = (trimOrNull(raw) ?? '').toLowerCase()
  if (!t || ['-', '0', '_', '--', '.', 'negatif', 'négatif', 'n'].includes(t)) {
    return 'negatif'
  }
  if (['+', 'positif', 'x', 'xx', 'xxx', 'pos'].includes(t)) return 'positif'
  return 'negatif'
}

function mapQuali(raw: string | null): (typeof BANDELETTE_QUALI_VALUES)[number] {
  const t = (trimOrNull(raw) ?? '').toLowerCase()
  if (!t || ['-', '0', '_', '--', '.', 'negatif', 'négatif', 'n', 'normal', 'ok', ''].includes(t)) {
    return 'negatif'
  }
  if (t === 'trace' || t === 'traces' || t === 'x') return 'trace'
  if (t === '+' || t === 'xx' || t === 'plus') return 'plus'
  if (t === 'xxx' || t === '++' || t === 'plus_plus' || t.startsWith('*')) return 'plus_plus'
  if (t === '++++' || t === 'plus_plus_plus') return 'plus_plus_plus'
  if (t === '+++') return 'plus_plus_plus'
  return 'negatif'
}

function mapPh(raw: string | null): (typeof BANDELETTE_PH_VALUES)[number] {
  const t = trimOrNull(raw)?.replace(',', '.')
  if (t && (BANDELETTE_PH_VALUES as readonly string[]).includes(t)) {
    return t as (typeof BANDELETTE_PH_VALUES)[number]
  }
  return '7'
}

function mapSucre(
  raw: string | null,
): (typeof BANDELETTE_SUCRE_VALUES)[number] | null {
  const t = (trimOrNull(raw) ?? '').toLowerCase()
  if (!t) return null
  if (['-', '0', '_', '--', '.', 'negatif', 'négatif'].includes(t)) return 'negatif'
  if (t === 'trace' || t === 'traces' || t === 'x') return 'trace'
  if (t === '+' || t.includes('50') || t === 'xx') return 'plus'
  if (t.includes('100') || t === 'xxx' || t === '++') return 'plus_plus'
  if ((BANDELETTE_SUCRE_VALUES as readonly string[]).includes(t)) {
    return t as (typeof BANDELETTE_SUCRE_VALUES)[number]
  }
  return null
}

/** Decimal(5,1) / Decimal(4,1) Postgres : max abs < 10^(precision-scale). */
const IMC_MAX = 999.9
const TEMP_MAX = 99.9
const TAILLE_MAX = 300
const POIDS_MAX = 500

function mapVitals(fields: (string | null)[]): {
  poidsKg: number
  tailleCm: number
  imc: number
  pas: number
  pad: number
  pouls: number
  temperatureC: number
} | null {
  const poidsKg = parseNumber(fields[COL.PatPoids])
  let tailleCm = parseNumber(fields[COL.PatTaille])
  const pouls = parseNumber(fields[COL.PatPOUL])
  const temperatureC = parseNumber(fields[COL.PatTemp])
  const pas = normalizeBp(fields[COL.PatPAS])
  const pad = normalizeBp(fields[COL.PatPAD])

  // Taille parfois saisie en mètres (ex. 1.65 → 165)
  if (tailleCm !== null && tailleCm > 0 && tailleCm <= 3) {
    tailleCm = tailleCm * 100
  }

  if (
    poidsKg === null ||
    poidsKg <= 0 ||
    poidsKg > POIDS_MAX ||
    tailleCm === null ||
    tailleCm < 30 ||
    tailleCm > TAILLE_MAX ||
    pouls === null ||
    pouls <= 0 ||
    pouls > 300 ||
    temperatureC === null ||
    temperatureC <= 0 ||
    temperatureC > TEMP_MAX ||
    pas === null ||
    pad === null
  ) {
    return null
  }

  let imc = parseNumber(fields[COL.IMC])
  // IMC legacy souvent faux (ex. 840000) → recalcul
  if (imc === null || imc <= 0 || imc > IMC_MAX) {
    imc = computeImc(poidsKg, tailleCm)
  }
  if (imc <= 0 || imc > IMC_MAX) {
    return null
  }

  return {
    poidsKg: Math.round(poidsKg * 100) / 100,
    tailleCm: Math.round(tailleCm * 10) / 10,
    imc: Math.round(imc * 10) / 10,
    pas: Math.round(pas),
    pad: Math.round(pad),
    pouls: Math.round(pouls),
    temperatureC: Math.round(temperatureC * 10) / 10,
  }
}

function optionalDecimal(v: string | null): Prisma.Decimal | null {
  const n = parseNumber(v)
  if (n === null || n <= 0 || n > IMC_MAX) return null
  return new Prisma.Decimal(n.toFixed(1))
}

function optionalInt(v: string | null): number | null {
  const n = parseNumber(v)
  if (n === null || n < 0) return null
  return Math.round(n)
}

function loadRawParams(): RawParam[] {
  if (!existsSync(SQL_PATH)) {
    throw new Error(`Fichier introuvable : ${SQL_PATH}`)
  }
  const sql = readFileSync(SQL_PATH, 'utf8')
  const inserts = extractAllInsertStatements(sql, 'tble_param')
  if (inserts.length === 0) {
    throw new Error('INSERT INTO `tble_param` introuvable')
  }

  const out: RawParam[] = []
  for (const insert of inserts) {
    const inner = getValuesInner(insert)
    if (!inner) continue
    for (const raw of splitValueRows(inner)) {
      const fields = parseMysqlValues(raw)
      if (fields.length < 18) continue
      const idRaw = fields[COL.IDParam]
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

async function buildMappedParams(): Promise<{
  params: ParamRow[]
  skippedNoVisit: number
  skippedBadValues: number
  skippedDuplicateVisite: number
}> {
  const raws = loadRawParams()
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
    row: ParamRow
    refDateTime: Date
    visiteDate: Date
    deltaMs: number
  }

  const byVisite = new Map<string, Candidate>()
  let skippedNoVisit = 0
  let skippedBadValues = 0

  for (const raw of raws) {
    const vitals = mapVitals(raw.fields)
    if (!vitals) {
      skippedBadValues++
      continue
    }

    const day = dayKey(raw.refDateTime)
    const candidates = byPatientDay.get(visitIndexKey(raw.patientId, day))
    if (!candidates || candidates.length === 0) {
      skippedNoVisit++
      continue
    }

    const visite = pickClosestVisite(candidates, raw.refDateTime)
    const deltaMs = Math.abs(visite.dateVisite.getTime() - raw.refDateTime.getTime())

    const row: ParamRow = {
      id: raw.id,
      visiteId: visite.id,
      userId: DEMO_MEDECIN_ID,
      poidsKg: new Prisma.Decimal(vitals.poidsKg.toFixed(2)),
      tailleCm: new Prisma.Decimal(vitals.tailleCm.toFixed(1)),
      imc: new Prisma.Decimal(vitals.imc.toFixed(1)),
      pas: vitals.pas,
      pad: vitals.pad,
      pouls: vitals.pouls,
      temperatureC: new Prisma.Decimal(vitals.temperatureC.toFixed(1)),
      nitrite: mapNitrite(raw.fields[COL.BUNitrite]),
      sang: mapQuali(raw.fields[COL.BUSang]),
      leucocytes: mapQuali(raw.fields[COL.BULeuco]),
      proteine: mapQuali(raw.fields[COL.BUProteine]),
      cetones: mapQuali(raw.fields[COL.BUCetone]),
      ph: mapPh(raw.fields[COL.BUPH]),
      sucre: mapSucre(raw.fields[COL.sucre]),
      perimetreCranien: optionalDecimal(raw.fields[COL.pcranien]),
      perimetreBrachial: optionalDecimal(raw.fields[COL.pbrachial]),
      frequenceRespiratoire: optionalInt(raw.fields[COL.frespiratoire]),
      sao2: optionalInt(raw.fields[COL.sao2]),
      createdAt: raw.refDateTime,
      updatedAt: raw.refDateTime,
    }

    const key = visite.id.toString()
    const prev = byVisite.get(key)
    if (!prev || deltaMs < prev.deltaMs) {
      byVisite.set(key, {
        row,
        refDateTime: raw.refDateTime,
        visiteDate: visite.dateVisite,
        deltaMs,
      })
    }
  }

  const params = [...byVisite.values()].map((c) => c.row)
  const skippedDuplicateVisite = raws.length - skippedNoVisit - skippedBadValues - params.length

  return {
    params,
    skippedNoVisit,
    skippedBadValues,
    skippedDuplicateVisite: Math.max(0, skippedDuplicateVisite),
  }
}

function printStats(
  params: ParamRow[],
  skippedNoVisit: number,
  skippedBadValues: number,
  skippedDuplicateVisite: number,
) {
  const ids = params.map((p) => p.id as bigint)
  const minId = ids.length ? ids.reduce((a, b) => (a < b ? a : b)) : 0n
  const maxId = ids.length ? ids.reduce((a, b) => (a > b ? a : b)) : 0n

  console.log('--- Stats import paramètres Plenitude ---')
  console.log({
    source: SQL_PATH,
    mapped: params.length,
    skippedNoVisit,
    skippedBadValues,
    skippedDuplicateVisite,
    userId: DEMO_MEDECIN_ID.toString(),
    idMin: minId.toString(),
    idMax: maxId.toString(),
  })
  console.log('Échantillon (3 premières lignes) :')
  for (const p of params.slice(0, 3)) {
    console.log({
      id: (p.id as bigint).toString(),
      visiteId: (p.visiteId as bigint).toString(),
      poidsKg: p.poidsKg?.toString(),
      tailleCm: p.tailleCm?.toString(),
      pas: p.pas,
      pad: p.pad,
      temperatureC: p.temperatureC?.toString(),
      nitrite: p.nitrite,
      ph: p.ph,
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

async function purgeParams() {
  const before = await prisma.parametrePatient.count()
  console.log('État avant purge :', { parametresPatient: before })
  const deleted = await prisma.parametrePatient.deleteMany({})
  console.log('Purge effectuée :', { parametresPatient: deleted.count })
}

async function insertParams(params: ParamRow[]) {
  let inserted = 0
  for (let i = 0; i < params.length; i += BATCH_SIZE) {
    const batch = params.slice(i, i + BATCH_SIZE)
    const result = await prisma.parametrePatient.createMany({ data: batch })
    inserted += result.count
    console.log(`Insert batch ${i / BATCH_SIZE + 1} : +${result.count} (total ${inserted})`)
  }

  await prisma.$executeRawUnsafe(`
    SELECT setval(
      pg_get_serial_sequence('parametres_patient', 'id'),
      COALESCE((SELECT MAX(id) FROM parametres_patient), 1)
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

  const { params, skippedNoVisit, skippedBadValues, skippedDuplicateVisite } =
    await buildMappedParams()

  printStats(params, skippedNoVisit, skippedBadValues, skippedDuplicateVisite)

  if (params.length === 0) {
    if (dryRun) {
      console.log('Dry-run : aucune ligne mappable.')
      return
    }
    throw new Error('Aucune ligne paramètre mappable')
  }

  if (dryRun) {
    console.log('Dry-run : aucune écriture en base.')
    return
  }

  await ensurePrerequisites()
  await purgeParams()
  const inserted = await insertParams(params)
  const after = await prisma.parametrePatient.count()
  console.log(`Import terminé : ${inserted} insérés, count parametres_patient = ${after}`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => void prisma.$disconnect())
