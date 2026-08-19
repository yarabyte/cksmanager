/**
 * Utilitaires pour extraire et parser les `INSERT INTO "public"."table"` issus de dumps PostgreSQL (TablePlus).
 */

/** Fin du statement INSERT : premier `;` hors chaînes `'...'`. */
function endOfInsertStatement(sql: string, start: number): number {
  let inString = false
  for (let i = start; i < sql.length; i++) {
    const c = sql[i]
    if (c === "'" && inString) {
      if (sql[i + 1] === "'") {
        i++
        continue
      }
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

/** Tous les `INSERT INTO "public"."table"` (multi-statements possibles). */
export function extractAllPgInsertStatements(sql: string, table: string): string[] {
  const marker = `INSERT INTO "public"."${table}"`
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

export function getPgValuesInner(insertSql: string): string | null {
  const v = insertSql.indexOf('VALUES')
  if (v === -1) return null
  let rest = insertSql.slice(v + 6).trim()
  if (rest.endsWith(';')) rest = rest.slice(0, -1).trim()
  return rest
}

/** Colonnes listées dans INSERT INTO … ("a", "b") */
export function getPgInsertColumns(insertSql: string): string[] {
  const open = insertSql.indexOf('(')
  const close = insertSql.indexOf(')', open)
  if (open === -1 || close === -1) return []
  const inner = insertSql.slice(open + 1, close)
  return inner
    .split(',')
    .map((c) => c.trim().replace(/^"|"$/g, ''))
    .filter(Boolean)
}

export function splitPgValueRows(valuesPart: string): string[] {
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

export function parsePgValues(inner: string): (string | null)[] {
  const out: (string | null)[] = []
  let i = 0
  while (i < inner.length) {
    while (i < inner.length && /\s/.test(inner[i]!)) i++
    if (i >= inner.length) break
    if (
      inner.slice(i, i + 4).toUpperCase() === 'NULL' &&
      (inner[i + 4] === ',' || inner[i + 4] === undefined || /\s/.test(inner[i + 4]!))
    ) {
      out.push(null)
      i += 4
      while (i < inner.length && /\s/.test(inner[i]!)) i++
      if (inner[i] === ',') i++
      continue
    }
    if (inner[i] === "'") {
      i++
      let buf = ''
      while (i < inner.length) {
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
      while (i < inner.length && /\s/.test(inner[i]!)) i++
      if (inner[i] === ',') i++
      continue
    }
    // nombre / true / false / json nu
    let j = i
    while (j < inner.length && inner[j] !== ',') j++
    const token = inner.slice(i, j).trim()
    out.push(token.length ? token : null)
    i = j
    if (inner[i] === ',') i++
  }
  return out
}

export type PgRow = Record<string, string | null>

export function loadPgTableRows(sql: string, table: string): PgRow[] {
  const inserts = extractAllPgInsertStatements(sql, table)
  const rows: PgRow[] = []
  for (const insert of inserts) {
    const cols = getPgInsertColumns(insert)
    const inner = getPgValuesInner(insert)
    if (!inner || cols.length === 0) continue
    for (const raw of splitPgValueRows(inner)) {
      const vals = parsePgValues(raw)
      if (vals.length < cols.length) continue
      const row: PgRow = {}
      for (let i = 0; i < cols.length; i++) {
        row[cols[i]!] = vals[i] ?? null
      }
      rows.push(row)
    }
  }
  return rows
}

export function pgBool(v: string | null, defaultValue = true): boolean {
  if (v == null) return defaultValue
  const t = v.trim().toLowerCase()
  if (t === 't' || t === 'true' || t === '1') return true
  if (t === 'f' || t === 'false' || t === '0') return false
  return defaultValue
}

export function pgBigInt(v: string | null): bigint | null {
  if (v == null || v.trim() === '') return null
  try {
    return BigInt(v)
  } catch {
    return null
  }
}

export function pgInt(v: string | null): number | null {
  if (v == null || v.trim() === '') return null
  const n = Number.parseInt(v, 10)
  return Number.isFinite(n) ? n : null
}

export function pgFloat(v: string | null): number | null {
  if (v == null || v.trim() === '') return null
  const n = Number.parseFloat(v)
  return Number.isFinite(n) ? n : null
}

export function pgDate(v: string | null): Date | null {
  if (v == null || v.trim() === '') return null
  const d = new Date(v.includes('T') || v.includes(' ') ? v.replace(' ', 'T') : v)
  return Number.isNaN(d.getTime()) ? null : d
}

export function pgJson(v: string | null): unknown | null {
  if (v == null || v.trim() === '') return null
  try {
    return JSON.parse(v)
  } catch {
    return null
  }
}
