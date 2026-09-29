import { prisma } from '@/lib/prisma'

const SERIAL_TABLES = new Set([
  'caisse_sessions',
  'caisse_postes',
  'users',
  'encaissements',
  'journal_caisse',
  'versements_caisse',
])

/** Aligne la séquence PG après un import / seed avec ids explicites. */
export async function syncPgSerial(table: string) {
  if (!SERIAL_TABLES.has(table)) {
    throw new Error(`Table série inconnue: ${table}`)
  }
  await prisma.$executeRawUnsafe(`
    SELECT setval(
      pg_get_serial_sequence('${table}', 'id'),
      GREATEST(COALESCE((SELECT MAX(id) FROM "${table}"), 1), 1)
    )
  `)
}
