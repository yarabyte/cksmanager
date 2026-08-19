/**
 * Référentiel magasins depuis `magasin.sql` (dump MySQL).
 * Variable d’environnement : `MAGASIN_SEED_SQL` (chemin absolu ou relatif), sinon `prisma/magasin.sql`.
 */
import { existsSync, readFileSync } from 'fs'
import { join } from 'path'
import type { PrismaClient } from '@prisma/client'
import {
  bigIntOrThrow,
  boolFromMysql,
  extractInsertStatement,
  getValuesInner,
  parseMysqlValues,
  splitValueRows,
} from './mysql-insert-utils'

export async function seedMagasins(prisma: PrismaClient): Promise<void> {
  const sqlPath = process.env.MAGASIN_SEED_SQL ?? join(__dirname, 'magasin.sql')
  if (!existsSync(sqlPath)) {
    console.warn(`[seed-magasins] Fichier absent : ${sqlPath} — import magasins ignoré.`)
    return
  }
  const sql = readFileSync(sqlPath, 'utf8')
  const ins = extractInsertStatement(sql, 'magasins')
  if (!ins) {
    console.warn('[seed-magasins] Aucun INSERT INTO `magasins` dans le fichier.')
    return
  }
  const inner = getValuesInner(ins)
  if (!inner) return

  for (const row of splitValueRows(inner)) {
    const f = parseMysqlValues(row)
    if (f.length < 7) continue
    const id = bigIntOrThrow(f[0], 'magasin')
    const nom = f[1] ?? ''
    const emplacement = f[2]
    const description = f[3]
    const actif = boolFromMysql(f[4])
    const createdAt = f[5] ? new Date(f[5]) : null
    const updatedAt = f[6] ? new Date(f[6]) : null

    await prisma.magasin.upsert({
      where: { id },
      create: {
        id,
        nom,
        emplacement,
        description,
        actif,
        createdAt,
        updatedAt,
      },
      update: {
        nom,
        emplacement,
        description,
        actif,
        createdAt,
        updatedAt,
      },
    })
  }

  console.log('[seed-magasins] Import terminé.')
}
