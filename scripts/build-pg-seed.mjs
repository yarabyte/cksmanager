/**
 * Convertit les INSERT MySQL de prisma/etape1.sql en SQL PostgreSQL.
 * Ordre respecté pour les clés étrangères.
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')
const src = fs.readFileSync(path.join(root, 'prisma', 'etape1.sql'), 'utf8')

/** Premier index du `;` qui termine le statement (ignore les `;` dans les chaînes '…'). */
function findStatementEnd(sql, fromIndex) {
  let i = fromIndex
  let inString = false
  while (i < sql.length) {
    const c = sql[i]
    if (!inString) {
      if (c === "'") {
        inString = true
        i++
        continue
      }
      if (c === ';') return i
      i++
      continue
    }
    // Chaîne style MySQL : \' échappé, ou '' (SQL standard)
    if (c === '\\' && sql[i + 1] === "'") {
      i += 2
      continue
    }
    if (c === "'" && sql[i + 1] === "'") {
      i += 2
      continue
    }
    if (c === "'") {
      inString = false
      i++
      continue
    }
    i++
  }
  return -1
}

function extractInsert(table) {
  const marker = 'INSERT INTO `' + table + '`'
  const start = src.indexOf(marker)
  if (start === -1) throw new Error('INSERT manquant pour table: ' + table)
  const end = findStatementEnd(src, start)
  if (end === -1) throw new Error('Fin de statement introuvable: ' + table)
  let stmt = src.slice(start, end + 1)
  stmt = stmt.replace(/INSERT INTO `(\w+)`/g, 'INSERT INTO "$1"')
  stmt = stmt.replace(/`([a-zA-Z0-9_]+)`/g, '"$1"')
  // MySQL \' → PostgreSQL ''
  stmt = stmt.replace(/\\'/g, "''")
  return stmt.trim()
}

const ORDER = [
  'categorie_actes',
  'assurances',
  'patients',
  'actes',
  'assurance_patient',
  'assurance_patient_couvertures',
  'assurance_valeurs',
  'parametres',
]

const out = []
for (const t of ORDER) {
  out.push(extractInsert(t))
}

const header = `-- Généré par scripts/build-pg-seed.mjs
SET session_replication_role = 'replica';
`
const footer = `
SET session_replication_role = 'origin';
`

fs.writeFileSync(
  path.join(root, 'prisma', 'seed-data.sql'),
  header + out.join('\n\n') + footer,
)
console.log('Wrote prisma/seed-data.sql (tables:', ORDER.join(', '), ')')
