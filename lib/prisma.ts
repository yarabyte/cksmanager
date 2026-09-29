import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
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
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    ...(url ? { datasources: { db: { url } } } : {}),
  })
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
