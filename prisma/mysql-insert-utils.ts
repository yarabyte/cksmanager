import { Prisma } from '@prisma/client'

/**
 * Utilitaires pour extraire et parser les `INSERT INTO \`table\`` issus de dumps MySQL (phpMyAdmin).
 * Partagés par les scripts de seed (kits, magasins, …).
 */
/** Fin du statement INSERT : premier `;` hors chaînes MySQL `'...'`. */
function endOfInsertStatement(sql: string, start: number): number {
  let inString = false
  for (let i = start; i < sql.length; i++) {
    const c = sql[i]
    if (c === "'" && inString) {
      if (sql[i + 1] === "'") {
        i++
        continue
      }
      if (i > 0 && sql[i - 1] === '\\') continue
      inString = false
      continue
    }
    if (c === "'" && !inString) {
      inString = true
      continue
    }
    if (!inString && c === ';') return i
  }
  return -1
}

export function extractInsertStatement(sql: string, table: string): string | null {
  const marker = `INSERT INTO \`${table}\``
  const start = sql.indexOf(marker)
  if (start === -1) return null
  const semi = endOfInsertStatement(sql, start)
  if (semi === -1) return null
  return sql.slice(start, semi + 1)
}

/** Tous les `INSERT INTO \`table\`` (dumps phpMyAdmin multi-statements). */
export function extractAllInsertStatements(sql: string, table: string): string[] {
  const marker = `INSERT INTO \`${table}\``
  const out: string[] = []
  let from = 0
  while (from < sql.length) {
    const start = sql.indexOf(marker, from)
    if (start === -1) break
    const semi = endOfInsertStatement(sql, start)
    if (semi === -1) break
    out.push(sql.slice(start, semi + 1))
    from = semi + 1
  }
  return out
}

export function splitValueRows(valuesPart: string): string[] {
  const rows: string[] = []
  let depth = 0
  let start = -1
  let inString = false
  for (let i = 0; i < valuesPart.length; i++) {
    const c = valuesPart[i]
    if (c === "'" && inString) {
      if (valuesPart[i + 1] === "'") {
        i++
        continue
      }
      if (i > 0 && valuesPart[i - 1] === '\\') continue
      inString = false
      continue
    }
    if (c === "'" && !inString) {
      inString = true
      continue
    }
    if (inString) continue
    if (c === '(') {
      if (depth === 0) start = i + 1
      depth++
    } else if (c === ')') {
      depth--
      if (depth === 0 && start !== -1) {
        rows.push(valuesPart.slice(start, i))
        start = -1
      }
    }
  }
  return rows
}

export function getValuesInner(insertSql: string): string | null {
  const v = insertSql.indexOf('VALUES')
  if (v === -1) return null
  let rest = insertSql.slice(v + 6).trim()
  if (rest.endsWith(';')) rest = rest.slice(0, -1).trim()
  return rest
}

export function parseMysqlValues(inner: string): (string | null)[] {
  const out: (string | null)[] = []
  let i = 0
  while (i < inner.length) {
    while (i < inner.length && /\s/.test(inner[i])) i++
    if (i >= inner.length) break
    if (inner.slice(i, i + 4) === 'NULL' && (inner[i + 4] === ',' || inner[i + 4] === undefined)) {
      out.push(null)
      i += 4
      if (inner[i] === ',') i++
      continue
    }
    if (inner[i] === "'") {
      i++
      let buf = ''
      while (i < inner.length) {
        if (inner[i] === '\\' && inner[i + 1] === "'") {
          buf += "'"
          i += 2
          continue
        }
        if (inner[i] === "'" && inner[i + 1] === "'") {
          buf += "'"
          i += 2
          continue
        }
        if (inner[i] === "'") {
          i++
          break
        }
        buf += inner[i]
        i++
      }
      out.push(buf)
      if (inner[i] === ',') i++
      continue
    }
    let j = i
    while (j < inner.length && inner[j] !== ',') j++
    const raw = inner.slice(i, j).trim()
    out.push(raw.length ? raw : null)
    i = j < inner.length && inner[j] === ',' ? j + 1 : j
  }
  return out
}

export function boolFromMysql(v: string | null): boolean {
  if (v === null) return false
  return v === '1' || v.toLowerCase() === 'true'
}

export function bigIntOrThrow(v: string | null, ctx: string): bigint {
  if (v === null || v === '') throw new Error(`${ctx}: id manquant`)
  return BigInt(v)
}

export function intOr(v: string | null, def: number): number {
  if (v === null || v === '') return def
  return Number.parseInt(v, 10)
}

export function decimalOr(v: string | null, def: string): Prisma.Decimal {
  if (v === null || v === '') return new Prisma.Decimal(def)
  return new Prisma.Decimal(v)
}
