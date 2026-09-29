import { PrismaClient } from '@prisma/client'
import { syncAllPgSerials } from '@/lib/db/sync-all-pg-serials'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
  serialsSynced?: Promise<void>
}

function datasourceUrl(): string | undefined {
  const url = process.env.DATABASE_URL
  if (!url) return undefined
  if (/[?&]connection_limit=/.test(url)) return url
  const sep = url.includes('?') ? '&' : '?'
  return `${url}${sep}connection_limit=5`
}

function createPrismaClient() {
  const url = datasourceUrl()
  const base = new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    ...(url ? { datasources: { db: { url } } } : {}),
  })

  const writeOps = new Set([
    'create',
    'createMany',
    'createManyAndReturn',
    'upsert',
  ])

  const extended = base.$extends({
    query: {
      async $allOperations({ operation, args, query }) {
        if (writeOps.has(operation)) {
          if (!globalForPrisma.serialsSynced) {
            globalForPrisma.serialsSynced = syncAllPgSerials(base).catch((err) => {
              globalForPrisma.serialsSynced = undefined
              console.error('[prisma] sync serial sequences failed:', err)
            })
          }
          await globalForPrisma.serialsSynced
        }
        return query(args)
      },
    },
  })

  return extended as unknown as PrismaClient
}

/**
 * Un seul client par process. Ne pas recréer / `$disconnect` au HMR :
 * Turbopack garderait d’anciennes instances (trop de connexions PG)
 * ou un moteur déjà coupé (« Engine is not yet connected »).
 */
export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}
