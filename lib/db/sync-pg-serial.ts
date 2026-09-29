import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'

const SERIAL_TABLES = new Set([
  'caisse_sessions',
  'caisse_postes',
  'users',
  'encaissements',
  'journal_caisse',
  'versements_caisse',
])

function assertSerialTable(table: string) {
  if (!SERIAL_TABLES.has(table)) {
    throw new Error(`Table série inconnue: ${table}`)
  }
}

/** Aligne la séquence PG après un import / seed avec ids explicites. */
export async function syncPgSerial(table: string) {
  assertSerialTable(table)
  await prisma.$executeRawUnsafe(`
    SELECT setval(
      COALESCE(
        pg_get_serial_sequence('"${table}"', 'id'),
        pg_get_serial_sequence('${table}', 'id'),
        '${table}_id_seq'
      )::regclass,
      GREATEST(COALESCE((SELECT MAX(id) FROM "${table}"), 1), 1),
      true
    )
  `)
}

export async function nextPgSerialId(table: string): Promise<bigint> {
  assertSerialTable(table)
  const rows = await prisma.$queryRawUnsafe<Array<{ next_id: bigint | number | string }>>(
    `SELECT COALESCE(MAX(id), 0) + 1 AS next_id FROM "${table}"`,
  )
  const raw = rows[0]?.next_id ?? 1
  return BigInt(raw)
}

export function isPrismaIdCollision(error: unknown): boolean {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== 'P2002') {
    return false
  }
  const target = error.meta?.target
  if (Array.isArray(target)) {
    return target.includes('id') || target.some((t) => String(t).includes('pkey'))
  }
  if (typeof target === 'string') {
    return target === 'id' || target.includes('pkey')
  }
  return true
}
