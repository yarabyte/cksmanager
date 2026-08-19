/**
 * Import Plenitude `tble_visitemed` → `visites`.
 * Usage :
 *   pnpm db:import-plenitude-visites -- --dry-run
 *   pnpm db:import-plenitude-visites -- --execute
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
const MOTIF_ID = 1n
const DEMO_MEDECIN_ID = 9002n
const SQL_PATH =
  process.env.PLENITUDE_VISITE_SQL ??
  join(process.cwd(), 'plenitude', 'tble_visitemed.sql')

const prisma = new PrismaClient()

type VisiteRow = Prisma.VisiteCreateManyInput

/** Ordre des colonnes dans INSERT INTO `tble_visitemed` (…) */
const COL = {
  Idvisite: 0,
  PatientID: 1,
  Motif: 2,
  Par: 3,
  dateheure: 4,
  StatutV: 5,
  Medecin: 6,
  rref: 7,
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

function commentairesFromMotif(raw: string | null): string | null {
  const t = trimOrNull(raw)
  if (!t) return null
  if (/^\d+$/.test(t)) return null
  return t
}

function mapRow(fields: (string | null)[]): VisiteRow | null {
  if (fields.length < 6) return null
  const idRaw = fields[COL.Idvisite]
  const patientRaw = fields[COL.PatientID]
  if (!idRaw || !patientRaw) return null

  const dateVisite = parseDate(fields[COL.dateheure])
  if (!dateVisite) return null

  return {
    id: BigInt(idRaw),
    patientId: BigInt(patientRaw),
    motifId: MOTIF_ID,
    userId: DEMO_MEDECIN_ID,
    medecinId: DEMO_MEDECIN_ID,
    dateVisite,
    commentaires: commentairesFromMotif(fields[COL.Motif]),
    statut: 'TERMINEE',
    createdAt: dateVisite,
    updatedAt: dateVisite,
  }
}

function loadMappedVisites(): { visites: VisiteRow[]; skipped: number } {
  if (!existsSync(SQL_PATH)) {
    throw new Error(`Fichier introuvable : ${SQL_PATH}`)
  }
  const sql = readFileSync(SQL_PATH, 'utf8')
  const inserts = extractAllInsertStatements(sql, 'tble_visitemed')
  if (inserts.length === 0) {
    throw new Error('INSERT INTO `tble_visitemed` introuvable')
  }

  const visites: VisiteRow[] = []
  let skipped = 0

  for (const insert of inserts) {
    const inner = getValuesInner(insert)
    if (!inner) continue
    for (const raw of splitValueRows(inner)) {
      const mapped = mapRow(parseMysqlValues(raw))
      if (!mapped) {
        skipped++
        continue
      }
      visites.push(mapped)
    }
  }

  return { visites, skipped }
}

async function countOrphanPatients(visites: VisiteRow[]): Promise<number> {
  const patientIds = [...new Set(visites.map((v) => v.patientId as bigint))]
  if (patientIds.length === 0) return 0
  const existing = await prisma.patient.findMany({
    where: { id: { in: patientIds } },
    select: { id: true },
  })
  const existingSet = new Set(existing.map((p) => p.id))
  return patientIds.filter((id) => !existingSet.has(id)).length
}

async function printStats(visites: VisiteRow[], skipped: number) {
  const ids = visites.map((v) => v.id as bigint)
  const minId = ids.reduce((a, b) => (a < b ? a : b), ids[0]!)
  const maxId = ids.reduce((a, b) => (a > b ? a : b), ids[0]!)
  const withCommentaires = visites.filter((v) => v.commentaires).length
  const orphanPatientIds = await countOrphanPatients(visites)

  console.log('--- Stats import visites Plenitude ---')
  console.log({
    source: SQL_PATH,
    mapped: visites.length,
    skipped,
    statut: 'TERMINEE',
    motifId: MOTIF_ID.toString(),
    userId: DEMO_MEDECIN_ID.toString(),
    medecinId: DEMO_MEDECIN_ID.toString(),
    withCommentaires,
    orphanPatientIds,
    idMin: minId.toString(),
    idMax: maxId.toString(),
  })
  console.log('Échantillon (3 premières lignes) :')
  for (const v of visites.slice(0, 3)) {
    console.log({
      id: (v.id as bigint).toString(),
      patientId: (v.patientId as bigint).toString(),
      motifId: (v.motifId as bigint).toString(),
      statut: v.statut,
      dateVisite: v.dateVisite,
      commentaires: v.commentaires,
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

  await prisma.motif.upsert({
    where: { id: MOTIF_ID },
    create: {
      id: MOTIF_ID,
      libelle: 'Consultation',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    update: { libelle: 'Consultation' },
  })

  console.log(`Prérequis OK : motif ${MOTIF_ID}, médecin ${medecin.email} (${medecin.name})`)
}

async function purgeVisites() {
  const before = {
    visites: await prisma.visite.count(),
    feuilles: await prisma.feuilleCirculation.count(),
    prescriptions: await prisma.prescription.count(),
    parametresPatient: await prisma.parametrePatient.count(),
    factures: await prisma.facture.count(),
  }
  console.log('État avant purge :', before)

  const deleted = await prisma.$transaction(
    async (tx) => {
      const journalEnc = await tx.journalCaisse.deleteMany({
        where: {
          OR: [
            { encaissementId: { not: null } },
            { referenceType: 'WalletTransaction' },
            { referenceType: 'Encaissement' },
          ],
        },
      })

      const retourLignes = await tx.retourPharmacieLigne.deleteMany({})
      const retours = await tx.retourPharmacie.deleteMany({})
      const sortieLignes = await tx.sortiePharmacieLigne.deleteMany({})
      const sorties = await tx.sortiePharmacie.deleteMany({})

      const encaissements = await tx.encaissement.deleteMany({})
      const walletTransactions = await tx.walletTransaction.deleteMany({})

      const bordereauFactures = await tx.bordereauFacture.deleteMany({})
      const bordereaux = await tx.bordereauAssureur.deleteMany({})
      const factureFeuilles = await tx.factureFeuille.deleteMany({})
      const factures = await tx.facture.deleteMany({})
      const avoirs = await tx.avoirFeuilleCirculation.deleteMany({})
      const feuilles = await tx.feuilleCirculation.deleteMany({})
      const prescriptions = await tx.prescription.deleteMany({})
      const parametresPatient = await tx.parametrePatient.deleteMany({})
      const visites = await tx.visite.deleteMany({})

      return {
        journalEncaissements: journalEnc.count,
        retourLignes: retourLignes.count,
        retours: retours.count,
        sortieLignes: sortieLignes.count,
        sorties: sorties.count,
        encaissements: encaissements.count,
        walletTransactions: walletTransactions.count,
        bordereauFactures: bordereauFactures.count,
        bordereaux: bordereaux.count,
        factureFeuilles: factureFeuilles.count,
        factures: factures.count,
        avoirs: avoirs.count,
        feuilles: feuilles.count,
        prescriptions: prescriptions.count,
        parametresPatient: parametresPatient.count,
        visites: visites.count,
      }
    },
    { timeout: 120_000 },
  )

  console.log('Purge effectuée :', deleted)
}

async function insertVisites(visites: VisiteRow[]) {
  let inserted = 0
  for (let i = 0; i < visites.length; i += BATCH_SIZE) {
    const batch = visites.slice(i, i + BATCH_SIZE)
    const result = await prisma.visite.createMany({ data: batch })
    inserted += result.count
    console.log(`Insert batch ${i / BATCH_SIZE + 1} : +${result.count} (total ${inserted})`)
  }

  await prisma.$executeRawUnsafe(`
    SELECT setval(
      pg_get_serial_sequence('visites', 'id'),
      COALESCE((SELECT MAX(id) FROM visites), 1)
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

  const { visites, skipped } = loadMappedVisites()
  if (visites.length === 0) {
    throw new Error('Aucune ligne visite mappable')
  }
  await printStats(visites, skipped)

  if (dryRun) {
    console.log('Dry-run : aucune écriture en base.')
    return
  }

  await ensurePrerequisites()
  await purgeVisites()
  const inserted = await insertVisites(visites)
  const after = await prisma.visite.count()
  console.log(`Import terminé : ${inserted} insérés, count visites = ${after}`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => void prisma.$disconnect())
