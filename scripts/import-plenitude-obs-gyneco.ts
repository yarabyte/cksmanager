/**
 * Import Plenitude `tble_obsgyneco` → `observations_gynecologiques`.
 * Appariement : même patient + même jour calendaire que la visite (heure la plus proche).
 * Usage :
 *   pnpm db:import-plenitude-obs-gyneco -- --dry-run
 *   pnpm db:import-plenitude-obs-gyneco -- --execute
 */
import { existsSync, readFileSync } from 'fs'
import { join } from 'path'
import { PrismaClient, type Prisma as PrismaNS } from '@prisma/client'
import {
  extractAllInsertStatements,
  getValuesInner,
  parseMysqlValues,
  splitValueRows,
} from '../prisma/mysql-insert-utils'

const BATCH_SIZE = 200
const DEMO_MEDECIN_ID = 9002n
const SQL_PATH =
  process.env.PLENITUDE_OBSGYNECO_SQL ??
  join(process.cwd(), 'plenitude', 'tble_obsgyneco.sql')

const prisma = new PrismaClient()

type ObsRow = PrismaNS.ObservationGynecologiqueCreateManyInput

type VisiteRef = { id: bigint; patientId: bigint; dateVisite: Date }

type RawObs = {
  id: bigint
  patientId: bigint
  refDateTime: Date
  fields: (string | null)[]
}

/** Ordre des colonnes dans INSERT INTO `tble_obsgyneco` (…) */
const COL = {
  IDObserv: 0,
  IDPatient: 1,
  TypeConsult: 2,
  MotifConsult: 3,
  DDR: 4,
  Contraception: 5,
  DernierFCV: 6,
  DMamo: 7,
  Menopause: 8,
  THM: 9,
  HistMaladie: 10,
  ModevieSex: 11,
  Menoragie: 12,
  Metroragie: 13,
  Dysmenore: 14,
  AlergiePel: 15,
  Dyspareunies: 16,
  Prurit: 17,
  Sein: 18,
  InspectionAbd: 19,
  PalpationAbd: 20,
  Eruption: 21,
  SpecLeucorrhes: 22,
  SpecMetrorragies: 23,
  SpecCol: 24,
  SpecVagin: 25,
  ColVag: 26,
  CulsVag: 27,
  CuldVag: 28,
  HyppoDurgence1: 29,
  HyppoDurgence2: 30,
  HyppoDurgence3: 31,
  DateEnregis: 32,
  Par: 33,
  noteint: 34,
  notephy: 35,
  auscultation: 36,
  Echo_Pelv: 37,
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

function dayKey(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function visitIndexKey(patientId: bigint, day: string): string {
  return `${patientId.toString()}|${day}`
}

function loadRawObs(): RawObs[] {
  if (!existsSync(SQL_PATH)) {
    throw new Error(`Fichier introuvable : ${SQL_PATH}`)
  }
  const sql = readFileSync(SQL_PATH, 'utf8')
  const inserts = extractAllInsertStatements(sql, 'tble_obsgyneco')
  if (inserts.length === 0) {
    throw new Error('INSERT INTO `tble_obsgyneco` introuvable')
  }

  const out: RawObs[] = []
  for (const insert of inserts) {
    const inner = getValuesInner(insert)
    if (!inner) continue
    for (const raw of splitValueRows(inner)) {
      const fields = parseMysqlValues(raw)
      if (fields.length < 33) continue
      const idRaw = fields[COL.IDObserv]
      const patientRaw = fields[COL.IDPatient]
      const ref = parseDate(fields[COL.DateEnregis])
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

function mapRow(raw: RawObs, visiteId: bigint): ObsRow {
  const f = raw.fields
  return {
    id: raw.id,
    visiteId,
    userId: DEMO_MEDECIN_ID,
    typeConsult: trimOrNull(f[COL.TypeConsult]),
    motifConsult: trimOrNull(f[COL.MotifConsult]),
    ddr: trimOrNull(f[COL.DDR]),
    contraception: trimOrNull(f[COL.Contraception]),
    dernierFcv: trimOrNull(f[COL.DernierFCV]),
    derniereMammo: trimOrNull(f[COL.DMamo]),
    menopause: trimOrNull(f[COL.Menopause]),
    thm: trimOrNull(f[COL.THM]),
    histMaladie: trimOrNull(f[COL.HistMaladie]),
    modeVieSexuelle: trimOrNull(f[COL.ModevieSex]),
    menorragies: trimOrNull(f[COL.Menoragie]),
    metrorragies: trimOrNull(f[COL.Metroragie]),
    dysmenorrhees: trimOrNull(f[COL.Dysmenore]),
    algiesPelviennes: trimOrNull(f[COL.AlergiePel]),
    dyspareunies: trimOrNull(f[COL.Dyspareunies]),
    prurit: trimOrNull(f[COL.Prurit]),
    noteInterrogatoire: trimOrNull(f[COL.noteint]),
    seins: trimOrNull(f[COL.Sein]),
    inspection: trimOrNull(f[COL.InspectionAbd]),
    palpation: trimOrNull(f[COL.PalpationAbd]),
    eruptionGenitale: trimOrNull(f[COL.Eruption]),
    leucorrhees: trimOrNull(f[COL.SpecLeucorrhes]),
    metrorragiesExam: trimOrNull(f[COL.SpecMetrorragies]),
    col: trimOrNull(f[COL.SpecCol]),
    vagin: trimOrNull(f[COL.SpecVagin]),
    auscultation: trimOrNull(f[COL.auscultation]),
    toucherVaginal: trimOrNull(f[COL.ColVag]),
    culsSacLateraux: trimOrNull(f[COL.CulsVag]),
    culSacDouglas: trimOrNull(f[COL.CuldVag]),
    notePhysique: trimOrNull(f[COL.notephy]),
    echoPelvienne: trimOrNull(f[COL.Echo_Pelv]),
    hypothese1: trimOrNull(f[COL.HyppoDurgence1]),
    hypothese2: trimOrNull(f[COL.HyppoDurgence2]),
    hypothese3: trimOrNull(f[COL.HyppoDurgence3]),
    createdAt: raw.refDateTime,
    updatedAt: raw.refDateTime,
  }
}

async function buildMappedObs(): Promise<{
  rows: ObsRow[]
  skippedNoVisit: number
  skippedDuplicateVisite: number
  totalRaw: number
}> {
  const raws = loadRawObs()
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
    row: ObsRow
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
    const deltaMs = Math.abs(
      visite.dateVisite.getTime() - raw.refDateTime.getTime(),
    )
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
  rows: ObsRow[],
  skippedNoVisit: number,
  skippedDuplicateVisite: number,
  totalRaw: number,
) {
  const ids = rows.map((p) => p.id as bigint)
  const minId = ids.length ? ids.reduce((a, b) => (a < b ? a : b)) : 0n
  const maxId = ids.length ? ids.reduce((a, b) => (a > b ? a : b)) : 0n

  console.log('--- Stats import obs. gynéco Plenitude ---')
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
      typeConsult: p.typeConsult,
      motifConsult: p.motifConsult?.slice(0, 40),
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

async function purgeObs() {
  const before = await prisma.observationGynecologique.count()
  console.log('État avant purge :', { observationsGynecologiques: before })
  const deleted = await prisma.observationGynecologique.deleteMany({})
  console.log('Purge effectuée :', {
    observationsGynecologiques: deleted.count,
  })
}

async function insertObs(rows: ObsRow[]) {
  let inserted = 0
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE)
    const result = await prisma.observationGynecologique.createMany({
      data: batch,
    })
    inserted += result.count
    console.log(
      `Insert batch ${i / BATCH_SIZE + 1} : +${result.count} (total ${inserted})`,
    )
  }

  await prisma.$executeRawUnsafe(`
    SELECT setval(
      pg_get_serial_sequence('observations_gynecologiques', 'id'),
      COALESCE((SELECT MAX(id) FROM observations_gynecologiques), 1)
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
    await buildMappedObs()

  printStats(rows, skippedNoVisit, skippedDuplicateVisite, totalRaw)

  if (rows.length === 0) {
    if (dryRun) {
      console.log('Dry-run : aucune ligne mappable.')
      return
    }
    throw new Error('Aucune ligne obs. gynéco mappable')
  }

  if (dryRun) {
    console.log('Dry-run : aucune écriture en base.')
    return
  }

  await ensurePrerequisites()
  await purgeObs()
  const inserted = await insertObs(rows)
  const after = await prisma.observationGynecologique.count()
  console.log(
    `Import terminé : ${inserted} insérés, count observations_gynecologiques = ${after}`,
  )
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => void prisma.$disconnect())
