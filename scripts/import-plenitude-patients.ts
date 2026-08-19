/**
 * Import Plenitude `tble_patient` → `patients`.
 * Usage :
 *   pnpm db:import-plenitude-patients -- --dry-run
 *   pnpm db:import-plenitude-patients -- --execute
 */
import { existsSync, readFileSync } from 'fs'
import { join } from 'path'
import { PrismaClient, type Prisma } from '@prisma/client'
import {
  extractAllInsertStatements,
  getValuesInner,
  parseMysqlValues,
  splitValueRows,
} from '../prisma/mysql-insert-utils'

const BATCH_SIZE = 200
const SQL_PATH =
  process.env.PLENITUDE_PATIENT_SQL ??
  join(process.cwd(), 'plenitude', 'tble_patient.sql')

const prisma = new PrismaClient()

type PatientRow = Prisma.PatientCreateManyInput

/** Ordre des colonnes dans INSERT INTO `tble_patient` (…) */
const COL = {
  PatientID: 0,
  PatPhoto: 1,
  PatName: 2,
  PatSurname: 3,
  PatEmail: 4,
  PatDOB: 5,
  PatLieuNaiss: 6,
  PatCNI: 7,
  PatAdress: 8,
  PatNum1: 9,
  PatNum2: 10,
  PatProfession: 11,
  MedecinRef: 12,
  PatNote: 13,
  RefName: 14,
  RefDateTime: 15,
  civilite: 16,
  AssurancePat: 17,
  PourAssPat: 18,
  rref: 19,
  sexe: 20,
  matass: 21,
  steass: 22,
  npassp: 23,
  telpassp: 24,
} as const

function trimOrNull(v: string | null): string | null {
  if (v === null) return null
  const t = v.trim()
  return t.length ? t : null
}

function trunc(v: string, max: number): string {
  return v.length <= max ? v : v.slice(0, max)
}

function requiredText(v: string | null, max: number, fallback = '-'): string {
  const t = trimOrNull(v)
  return trunc(t ?? fallback, max)
}

function mapCivilite(raw: string | null): { value: number; usedDefault: boolean } {
  const t = trimOrNull(raw)?.toLowerCase()
  if (!t) return { value: 2, usedDefault: true }
  if (t === 'monsieur' || t === 'm.' || t === 'm') return { value: 1, usedDefault: false }
  if (t === 'madame' || t === 'mme' || t === 'mme.') return { value: 2, usedDefault: false }
  if (t === 'enfant') return { value: 3, usedDefault: false }
  return { value: 2, usedDefault: true }
}

function mapSexe(raw: string | null): { value: number; usedDefault: boolean } {
  if (raw === null || raw === '') return { value: 2, usedDefault: true }
  const n = Number.parseInt(raw, 10)
  if (n === 1 || n === 2) return { value: n, usedDefault: false }
  return { value: 2, usedDefault: true }
}

function phoneToString(v: string | null): string | null {
  if (v === null || v === '') return null
  return String(v).trim()
}

function parseDate(v: string | null): Date | null {
  if (!v) return null
  const d = new Date(v)
  return Number.isNaN(d.getTime()) ? null : d
}

function mapRow(fields: (string | null)[]): {
  row: PatientRow
  civiliteDefault: boolean
  sexeDefault: boolean
} | null {
  if (fields.length < 21) return null
  const idRaw = fields[COL.PatientID]
  if (!idRaw) return null

  const dob = parseDate(fields[COL.PatDOB])
  if (!dob) return null

  const civilite = mapCivilite(fields[COL.civilite])
  const sexe = mapSexe(fields[COL.sexe])
  const refDt = parseDate(fields[COL.RefDateTime])
  const patNum1 = phoneToString(fields[COL.PatNum1]) ?? '-'

  const emailRaw = trimOrNull(fields[COL.PatEmail])
  const cniRaw = trimOrNull(fields[COL.PatCNI])
  const professionRaw = trimOrNull(fields[COL.PatProfession])
  const patNum2 = phoneToString(fields[COL.PatNum2])

  return {
    civiliteDefault: civilite.usedDefault,
    sexeDefault: sexe.usedDefault,
    row: {
      id: BigInt(idRaw),
      civilite: civilite.value,
      patName: requiredText(fields[COL.PatName], 100),
      patSurname: requiredText(fields[COL.PatSurname], 100),
      nomJeuneFille: null,
      patEmail: emailRaw ? trunc(emailRaw, 40) : null,
      patDob: dob,
      patLieuNaiss: requiredText(fields[COL.PatLieuNaiss], 50),
      patCni: cniRaw ? trunc(cniRaw, 20) : null,
      patAdress: requiredText(fields[COL.PatAdress], 200),
      patNum1: trunc(patNum1, 20),
      patNum2: patNum2 ? trunc(patNum2, 20) : null,
      patProfession: professionRaw ? trunc(professionRaw, 100) : null,
      sexe: sexe.value,
      createdAt: refDt,
      updatedAt: refDt,
    },
  }
}

function loadMappedPatients(): {
  patients: PatientRow[]
  skipped: number
  civiliteDefaults: number
  sexeDefaults: number
} {
  if (!existsSync(SQL_PATH)) {
    throw new Error(`Fichier introuvable : ${SQL_PATH}`)
  }
  const sql = readFileSync(SQL_PATH, 'utf8')
  const inserts = extractAllInsertStatements(sql, 'tble_patient')
  if (inserts.length === 0) {
    throw new Error('INSERT INTO `tble_patient` introuvable')
  }

  const patients: PatientRow[] = []
  let skipped = 0
  let civiliteDefaults = 0
  let sexeDefaults = 0

  for (const insert of inserts) {
    const inner = getValuesInner(insert)
    if (!inner) continue
    for (const raw of splitValueRows(inner)) {
      const mapped = mapRow(parseMysqlValues(raw))
      if (!mapped) {
        skipped++
        continue
      }
      if (mapped.civiliteDefault) civiliteDefaults++
      if (mapped.sexeDefault) sexeDefaults++
      patients.push(mapped.row)
    }
  }

  return { patients, skipped, civiliteDefaults, sexeDefaults }
}

function printStats(
  patients: PatientRow[],
  skipped: number,
  civiliteDefaults: number,
  sexeDefaults: number,
) {
  const ids = patients.map((p) => p.id as bigint)
  const minId = ids.reduce((a, b) => (a < b ? a : b), ids[0]!)
  const maxId = ids.reduce((a, b) => (a > b ? a : b), ids[0]!)

  console.log('--- Stats import patients Plenitude ---')
  console.log({
    source: SQL_PATH,
    mapped: patients.length,
    skipped,
    civiliteDefaults,
    sexeDefaults,
    idMin: minId.toString(),
    idMax: maxId.toString(),
  })
  console.log('Échantillon (3 premières lignes) :')
  for (const p of patients.slice(0, 3)) {
    console.log({
      id: (p.id as bigint).toString(),
      civilite: p.civilite,
      sexe: p.sexe,
      patName: p.patName,
      patSurname: p.patSurname,
      patDob: p.patDob,
      patNum1: p.patNum1,
      createdAt: p.createdAt,
    })
  }
}

async function purgePatients() {
  const before = {
    patients: await prisma.patient.count(),
    wallets: await prisma.wallet.count(),
    walletTransactions: await prisma.walletTransaction.count(),
    assurancePatients: await prisma.assurancePatient.count(),
    encaissements: await prisma.encaissement.count(),
  }
  console.log('État avant purge :', before)

  const deleted = await prisma.$transaction(async (tx) => {
    const journalEnc = await tx.journalCaisse.deleteMany({
      where: {
        OR: [
          { encaissementId: { not: null } },
          { referenceType: 'WalletTransaction' },
          { referenceType: 'Encaissement' },
        ],
      },
    })
    const encaissements = await tx.encaissement.deleteMany({})
    const walletTransactions = await tx.walletTransaction.deleteMany({})
    const wallets = await tx.wallet.deleteMany({})
    const assurancePatients = await tx.assurancePatient.deleteMany({})
    const patients = await tx.patient.deleteMany({})
    return {
      journalEncaissements: journalEnc.count,
      encaissements: encaissements.count,
      walletTransactions: walletTransactions.count,
      wallets: wallets.count,
      assurancePatients: assurancePatients.count,
      patients: patients.count,
    }
  })

  console.log('Purge effectuée :', deleted)
}

async function insertPatients(patients: PatientRow[]) {
  let inserted = 0
  for (let i = 0; i < patients.length; i += BATCH_SIZE) {
    const batch = patients.slice(i, i + BATCH_SIZE)
    const result = await prisma.patient.createMany({ data: batch })
    inserted += result.count
    console.log(`Insert batch ${i / BATCH_SIZE + 1} : +${result.count} (total ${inserted})`)
  }

  await prisma.$executeRawUnsafe(`
    SELECT setval(
      pg_get_serial_sequence('patients', 'id'),
      COALESCE((SELECT MAX(id) FROM patients), 1)
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

  const { patients, skipped, civiliteDefaults, sexeDefaults } = loadMappedPatients()
  if (patients.length === 0) {
    throw new Error('Aucune ligne patient mappable')
  }
  printStats(patients, skipped, civiliteDefaults, sexeDefaults)

  if (dryRun) {
    console.log('Dry-run : aucune écriture en base.')
    return
  }

  await purgePatients()
  const inserted = await insertPatients(patients)
  const after = await prisma.patient.count()
  console.log(`Import terminé : ${inserted} insérés, count patients = ${after}`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => void prisma.$disconnect())
