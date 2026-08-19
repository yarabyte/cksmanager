/**
 * Seed de référence (étape1 + utilisateurs). Sur base déjà alimentée, l’exécution
 * SQL brute peut échouer (doublons) : utiliser `prisma migrate reset` ou importer
 * uniquement les comptes (SEED_USER_PASSWORD) via le bloc utilisateurs.
 *
 * Visites : import tabulaire (motifs + patients) prévu en phase 2 (voir `schema.prisma`).
 */
import { readFileSync } from 'fs'
import { join } from 'path'
import { hash } from 'bcrypt'
import { PrismaClient } from '@prisma/client'
import { SEED_USER_ROWS } from './seed-user-import'
import { seedPharmacie } from './seed-pharmacie'
import { seedMagasins } from './seed-magasins'
import { seedKits } from './seed-kits'
import { seedDemoUsers } from './seed-demo-users'

const prisma = new PrismaClient()

/**
 * Découpe le script SQL sur `;` uniquement hors des littéraux '…'
 * (PostgreSQL : apostrophe doublée '' dans une chaîne).
 */
function splitSqlStatements(sql: string): string[] {
  const out: string[] = []
  let cur = ''
  let i = 0
  let inString = false
  while (i < sql.length) {
    const c = sql[i]
    if (!inString) {
      if (c === "'") {
        inString = true
        cur += c
        i++
        continue
      }
      if (c === ';') {
        const t = cur.trim()
        if (t.length > 0 && !t.startsWith('--')) out.push(t)
        cur = ''
        i++
        continue
      }
      cur += c
      i++
      continue
    }
    if (c === "'" && sql[i + 1] === "'") {
      cur += "''"
      i += 2
      continue
    }
    cur += c
    if (c === "'") {
      inString = false
    }
    i++
  }
  const t = cur.trim()
  if (t.length > 0 && !t.startsWith('--')) out.push(t)
  return out
}

/** Exécute le SQL issu de etape1 (ordre FK respecté). */
async function main() {
  const sqlPath = join(__dirname, 'seed-data.sql')
  const sql = readFileSync(sqlPath, 'utf8')
  const parts = splitSqlStatements(sql)

  for (const stmt of parts) {
    await prisma.$executeRawUnsafe(stmt)
  }

  /**
   * Comptes utilisateurs (dump Laravel) : mot de passe unique re-haché.
   * Définir `SEED_USER_PASSWORD` dans l’environnement (ex. .env) avant `pnpm db:seed`.
   */
  const seedUserPassword = process.env.SEED_USER_PASSWORD
  if (seedUserPassword) {
    const passwordHash = await hash(seedUserPassword, 10)
    for (const row of SEED_USER_ROWS) {
      await prisma.user.upsert({
        where: { id: row.id },
        create: {
          id: row.id,
          name: row.name,
          email: row.email,
          code: row.code,
          emailVerifiedAt: null,
          password: passwordHash,
          telephone: row.telephone,
          photo: row.photo,
          specialite: row.specialite,
          numeroOrdre: row.numeroOrdre,
          role: row.role,
          titre: row.titre,
          actif: row.actif,
          rememberToken: row.rememberToken,
          createdAt: row.createdAt,
          updatedAt: row.updatedAt,
        },
        update: {
          name: row.name,
          email: row.email,
          code: row.code,
          password: passwordHash,
          telephone: row.telephone,
          photo: row.photo,
          specialite: row.specialite,
          numeroOrdre: row.numeroOrdre,
          role: row.role,
          titre: row.titre,
          actif: row.actif,
          rememberToken: row.rememberToken,
          createdAt: row.createdAt,
          updatedAt: row.updatedAt,
        },
      })
    }
  } else {
    console.warn(
      '[seed] SEED_USER_PASSWORD non défini — import utilisateurs (bcrypt) ignoré.',
    )
  }

  await seedPharmacie(prisma)
  await seedMagasins(prisma)
  await seedKits(prisma)
  await seedDemoUsers(prisma)

  // Synchronise les séquences PostgreSQL après INSERT avec ids explicites
  const syncSeq = async (table: string) => {
    await prisma.$executeRawUnsafe(`
      SELECT setval(
        pg_get_serial_sequence('${table}', 'id'),
        COALESCE((SELECT MAX(id) FROM "${table}"), 1)
      )
    `)
  }

  await syncSeq('categorie_actes')
  await syncSeq('assurances')
  await syncSeq('patients')
  await syncSeq('actes')
  await syncSeq('assurance_patient')
  await syncSeq('assurance_patient_couvertures')
  await syncSeq('assurance_valeurs')
  await syncSeq('parametres')
  await syncSeq('users')
  await syncSeq('conditionnements')
  await syncSeq('formes_galeniques')
  await syncSeq('fournisseurs')
  await syncSeq('produits')
  await syncSeq('magasins')
  await syncSeq('kit_actes')
  await syncSeq('kit_acte_lignes')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
