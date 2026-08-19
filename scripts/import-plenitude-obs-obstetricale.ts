/**
 * Import Plenitude `tble_obsobstret` → `observations_obstetricales`.
 * Appariement : même patient + même jour calendaire que la visite (heure la plus proche).
 * Usage :
 *   pnpm db:import-plenitude-obs-obstetricale -- --dry-run
 *   pnpm db:import-plenitude-obs-obstetricale -- --execute
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
  process.env.PLENITUDE_OBSOBSTRET_SQL ??
  join(process.cwd(), 'plenitude', 'tble_obsobstret.sql')

const prisma = new PrismaClient()

type ObsRow = PrismaNS.ObservationObstetricaleCreateManyInput

type VisiteRef = { id: bigint; patientId: bigint; dateVisite: Date }

type RawObs = {
  id: bigint
  patientId: bigint
  refDateTime: Date
  fields: (string | null)[]
}

/** Ordre des colonnes dans INSERT INTO `tble_obsobstret` (…) */
const COL = {
  IDObstetric: 0,
  IDPatient: 1,
  TypeObserv: 2,
  MotifsObser: 3,
  DDR: 4,
  DDG: 5,
  HistoireMal: 6,
  Mvtactif: 7,
  Contraction: 8,
  RessentiDoul: 9,
  ENDObst: 10,
  Perteliquid: 11,
  PuiriVag: 12,
  PuiriNu: 13,
  SigneHTA: 14,
  Cephale: 15,
  ENDcepal: 16,
  OeudMembre: 17,
  OeudMain: 18,
  OeudVisage: 19,
  BarreEpigastriq: 20,
  obnubilation: 21,
  troubVigilance: 22,
  Glasgow: 23,
  HautUterine: 24,
  ConsUterine: 25,
  Malforuterine: 26,
  Speculum: 27,
  Metroagie: 28,
  PerteLiquide: 29,
  Apsecdesleuco: 30,
  Aspectducolvagin: 31,
  ToucCol: 32,
  PresentCol: 33,
  CuldeSac: 34,
  Bishop: 35,
  HypoDiagno1: 36,
  HypoDiagno2: 37,
  HypoDiagno3: 38,
  Dateajout: 39,
  ParleDr: 40,
  noteint: 41,
  notephy: 42,
  Echo_Obstr: 43,
} as const

function trimOrNull(v: string | null): string | null {
  if (v === null) return null
  const t = v.trim()
  return t.length ? t : null
}

function asStr(v: string | null): string | null {
  return trimOrNull(v)
}

function normalizeOuiNon(v: string | null): string | null {
  const t = trimOrNull(v)
  if (!t) return null
  const low = t.toLowerCase()
  if (low === 'oui' || low === 'o' || low === 'yes' || low === '1') return 'Oui'
  if (low === 'non' || low === 'n' || low === 'no' || low === '0') return 'Non'
  return t
}

function parseDate(v: string | null): Date | null {
  if (!v) return null
  const t = v.trim()
  // Formats : "2019-05-14 11:16:35" ou "14/05/2019"
  if (/^\d{2}\/\d{2}\/\d{4}/.test(t)) {
    const [d, m, y] = t.slice(0, 10).split('/').map(Number)
    const dt = new Date(y!, m! - 1, d!)
    return Number.isNaN(dt.getTime()) ? null : dt
  }
  const d = new Date(t)
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
  const inserts = extractAllInsertStatements(sql, 'tble_obsobstret')
  if (inserts.length === 0) {
    throw new Error('INSERT INTO `tble_obsobstret` introuvable')
  }

  const out: RawObs[] = []
  for (const insert of inserts) {
    const inner = getValuesInner(insert)
    if (!inner) continue
    for (const raw of splitValueRows(inner)) {
      const fields = parseMysqlValues(raw)
      if (fields.length < 40) continue
      const idRaw = fields[COL.IDObstetric]
      const patientRaw = fields[COL.IDPatient]
      const ref = parseDate(fields[COL.Dateajout])
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
  const bishop = asStr(f[COL.Bishop])
  return {
    id: raw.id,
    visiteId,
    userId: DEMO_MEDECIN_ID,
    typeObservation: asStr(f[COL.TypeObserv]),
    motifConsult: asStr(f[COL.MotifsObser]),
    ddr: asStr(f[COL.DDR]),
    dateDebutGrossesse: asStr(f[COL.DDG]),
    histMaladie: asStr(f[COL.HistoireMal]),
    mouvementsFoetaux: asStr(f[COL.Mvtactif]),
    contractions: asStr(f[COL.Contraction]),
    ressentiesDouloureuses: normalizeOuiNon(f[COL.RessentiDoul]),
    endRessenties: asStr(f[COL.ENDObst]),
    perteLiquideAmnio: normalizeOuiNon(f[COL.Perteliquid]),
    pruritVaginal: normalizeOuiNon(f[COL.PuiriVag]),
    pruritNu: normalizeOuiNon(f[COL.PuiriNu]),
    signesHta: normalizeOuiNon(f[COL.SigneHTA]),
    glasgow: asStr(f[COL.Glasgow]),
    cephalees: normalizeOuiNon(f[COL.Cephale]),
    endCephalees: asStr(f[COL.ENDcepal]),
    oedemesMi: asStr(f[COL.OeudMembre]),
    oedemesMains: asStr(f[COL.OeudMain]),
    oedemesVisage: asStr(f[COL.OeudVisage]),
    barreEpigastrique: asStr(f[COL.BarreEpigastriq]),
    obnubilation: asStr(f[COL.obnubilation]),
    troublesVigilance: asStr(f[COL.troubVigilance]),
    noteInterrogatoire: asStr(f[COL.noteint]),
    hauteurUterineCm: asStr(f[COL.HautUterine]),
    consistanceUterine: asStr(f[COL.ConsUterine]),
    malformationUterine: asStr(f[COL.Malforuterine]),
    speculum: asStr(f[COL.Speculum]),
    metrorragies: asStr(f[COL.Metroagie]),
    perteLiquideTarnier: asStr(f[COL.PerteLiquide]),
    aspectLeucorrhees: asStr(f[COL.Apsecdesleuco]),
    cdsLateraux: asStr(f[COL.Aspectducolvagin]),
    col: asStr(f[COL.ToucCol]),
    presentation: asStr(f[COL.PresentCol]),
    cdsDouglas: asStr(f[COL.CuldeSac]),
    bishop: bishop && bishop.length > 100 ? bishop.slice(0, 100) : bishop,
    noteToucherVaginal: asStr(f[COL.notephy]),
    echoObstetricale: asStr(f[COL.Echo_Obstr]),
    hypothese1: asStr(f[COL.HypoDiagno1]),
    hypothese2: asStr(f[COL.HypoDiagno2]),
    hypothese3: asStr(f[COL.HypoDiagno3]),
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

  console.log('--- Stats import obs. obstétricale Plenitude ---')
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
      typeObservation: p.typeObservation,
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
  const before = await prisma.observationObstetricale.count()
  console.log('État avant purge :', { observationsObstetricales: before })
  const deleted = await prisma.observationObstetricale.deleteMany({})
  console.log('Purge effectuée :', {
    observationsObstetricales: deleted.count,
  })
}

async function insertObs(rows: ObsRow[]) {
  let inserted = 0
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE)
    const result = await prisma.observationObstetricale.createMany({
      data: batch,
    })
    inserted += result.count
    console.log(
      `Insert batch ${i / BATCH_SIZE + 1} : +${result.count} (total ${inserted})`,
    )
  }

  await prisma.$executeRawUnsafe(`
    SELECT setval(
      pg_get_serial_sequence('observations_obstetricales', 'id'),
      COALESCE((SELECT MAX(id) FROM observations_obstetricales), 1)
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
    throw new Error('Aucune ligne obs. obstétricale mappable')
  }

  if (dryRun) {
    console.log('Dry-run : aucune écriture en base.')
    return
  }

  await ensurePrerequisites()
  await purgeObs()
  const inserted = await insertObs(rows)
  const after = await prisma.observationObstetricale.count()
  console.log(
    `Import terminé : ${inserted} insérés, count observations_obstetricales = ${after}`,
  )
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => void prisma.$disconnect())
