/**
 * Import kits depuis `kits.sql` (MySQL) : kit_actes → kit_acte_lignes.
 * `acte_id` / `produit_id` : null si absent en base (évite FK).
 * La colonne `magasin_id` du dump MySQL est ignorée.
 */
import { existsSync, readFileSync } from 'fs'
import { join } from 'path'
import type { PrismaClient } from '@prisma/client'
import {
  bigIntOrThrow,
  boolFromMysql,
  decimalOr,
  extractInsertStatement,
  getValuesInner,
  intOr,
  parseMysqlValues,
  splitValueRows,
} from './mysql-insert-utils'

export async function seedKits(prisma: PrismaClient): Promise<void> {
  const sqlPath = process.env.KITS_SEED_SQL ?? join(__dirname, 'kits.sql')
  if (!existsSync(sqlPath)) {
    console.warn(`[seed-kits] Fichier absent : ${sqlPath} — import kits ignoré.`)
    return
  }
  const sql = readFileSync(sqlPath, 'utf8')

  const users = await prisma.user.findMany({ select: { id: true } })
  const userIds = new Set(users.map((u) => u.id))
  const firstUser = users[0]?.id ?? null

  const actes = await prisma.acte.findMany({ select: { id: true } })
  const acteIds = new Set(actes.map((a) => a.id))

  const produits = await prisma.produit.findMany({ select: { id: true } })
  const produitIds = new Set(produits.map((p) => p.id))

  const insKits = extractInsertStatement(sql, 'kit_actes')
  if (insKits) {
    const inner = getValuesInner(insKits)
    if (inner) {
      for (const row of splitValueRows(inner)) {
        const f = parseMysqlValues(row)
        if (f.length < 7) continue
        const id = bigIntOrThrow(f[0], 'kit_acte')
        const userIdRaw = f[3]
        const userId =
          userIdRaw && userIds.has(BigInt(userIdRaw))
            ? BigInt(userIdRaw)
            : firstUser
        if (userId === null) {
          console.warn(`[seed-kits] kit_acte id=${id} : aucun utilisateur, ignoré.`)
          continue
        }
        await prisma.kitActe.upsert({
          where: { id },
          create: {
            id,
            nom: f[1] ?? '',
            description: f[2],
            userId,
            actif: boolFromMysql(f[4]),
            createdAt: f[5] ? new Date(f[5]) : null,
            updatedAt: f[6] ? new Date(f[6]) : null,
          },
          update: {
            nom: f[1] ?? '',
            description: f[2],
            userId,
            actif: boolFromMysql(f[4]),
            createdAt: f[5] ? new Date(f[5]) : null,
            updatedAt: f[6] ? new Date(f[6]) : null,
          },
        })
      }
    }
  }

  const insLignes = extractInsertStatement(sql, 'kit_acte_lignes')
  if (insLignes) {
    const inner = getValuesInner(insLignes)
    if (inner) {
      let skipped = 0
      for (const row of splitValueRows(inner)) {
        const f = parseMysqlValues(row)
        if (f.length < 11) continue
        const id = bigIntOrThrow(f[0], 'ligne')
        const kitActeId = bigIntOrThrow(f[1], 'kit_acte_id')
        const typeLigne = (f[2] ?? '').toUpperCase()
        if (typeLigne !== 'ACTE' && typeLigne !== 'PHARMA') {
          skipped++
          continue
        }
        const acteRaw = f[3]
        const acteId =
          acteRaw && acteIds.has(BigInt(acteRaw)) ? BigInt(acteRaw) : null
        const quantite = intOr(f[4], 1)
        const produitRaw = f[5]
        const produitId =
          produitRaw && produitIds.has(BigInt(produitRaw)) ? BigInt(produitRaw) : null
        const remise = decimalOr(f[7], '0')
        const position = intOr(f[8], 0)
        try {
          await prisma.kitActeLigne.upsert({
            where: { id },
            create: {
              id,
              kitActeId,
              typeLigne,
              acteId,
              quantite,
              produitId,
              remiseUnitaire: remise,
              position,
              createdAt: f[9] ? new Date(f[9]) : null,
              updatedAt: f[10] ? new Date(f[10]) : null,
            },
            update: {
              kitActeId,
              typeLigne,
              acteId,
              quantite,
              produitId,
              remiseUnitaire: remise,
              position,
              createdAt: f[9] ? new Date(f[9]) : null,
              updatedAt: f[10] ? new Date(f[10]) : null,
            },
          })
        } catch (e) {
          skipped++
          const msg = e instanceof Error ? e.message : String(e)
          if (msg.includes('Foreign key') || msg.includes('violates')) {
            console.warn(`[seed-kits] ligne id=${id} ignorée (FK): ${msg}`)
            continue
          }
          throw e
        }
      }
      if (skipped > 0) {
        console.warn(`[seed-kits] ${skipped} ligne(s) ignorée(s) ou filtrée(s).`)
      }
    }
  }

  console.log('[seed-kits] Import terminé.')
}
