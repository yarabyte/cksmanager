import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined }

/**
 * Après `prisma generate` (nouveaux modèles), l’instance Prisma mise en cache par Next en dev
 * peut rester l’ancienne classe sans les nouveaux delegates → `.count` sur `undefined`.
 */
function isStalePrismaClient(c: PrismaClient | undefined): boolean {
  if (c == null) return false
  const x = c as unknown as {
    conditionnement?: unknown
    kitActe?: unknown
    feuilleCirculation?: unknown
    wallet?: unknown
  }
  return (
    x.conditionnement === undefined ||
    x.kitActe === undefined ||
    x.feuilleCirculation === undefined ||
    x.wallet === undefined
  )
}

if (process.env.NODE_ENV !== 'production' && isStalePrismaClient(globalForPrisma.prisma)) {
  void globalForPrisma.prisma!.$disconnect().catch(() => {})
  globalForPrisma.prisma = undefined
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
