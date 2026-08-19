/**
 * Import référentiels + produits pharmacie depuis le dump MySQL `configpharmacie.sql`.
 * Ordre : conditionnements → formes_galeniques → fournisseurs → produits.
 * `assureur_id` n’est posé que si l’id existe dans `assurances` (évite FK sur base partielle).
 * Doublons `code_cip` : ligne ignorée + log.
 */
import { existsSync, readFileSync } from 'fs'
import { join } from 'path'
import type { PrismaClient } from '@prisma/client'
import { Prisma } from '@prisma/client'

function extractInsertStatement(sql: string, table: string): string | null {
  const marker = `INSERT INTO \`${table}\``
  const start = sql.indexOf(marker)
  if (start === -1) return null
  const semi = sql.indexOf(';', start)
  if (semi === -1) return null
  return sql.slice(start, semi + 1)
}

/** Découpe le contenu après VALUES en lignes `(…)` sans les parenthèses externes. */
function splitValueRows(valuesPart: string): string[] {
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
      // MySQL : \' = apostrophe littérale dans la chaîne
      if (i > 0 && valuesPart[i - 1] === '\\') {
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

function getValuesInner(insertSql: string): string | null {
  const v = insertSql.indexOf('VALUES')
  if (v === -1) return null
  let rest = insertSql.slice(v + 6).trim()
  if (rest.endsWith(';')) rest = rest.slice(0, -1).trim()
  return rest
}

/** Parse une ligne de valeurs MySQL (NULL, nombres, chaînes '…' avec '' échappé). */
function parseMysqlValues(inner: string): (string | null)[] {
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

function boolFromMysql(v: string | null): boolean {
  if (v === null) return false
  return v === '1' || v.toLowerCase() === 'true'
}

function bigIntOrThrow(v: string | null, ctx: string): bigint {
  if (v === null || v === '') throw new Error(`${ctx}: id manquant`)
  return BigInt(v)
}

function intOr(v: string | null, def: number): number {
  if (v === null || v === '') return def
  return Number.parseInt(v, 10)
}

function decimalOr(v: string | null, def: string): Prisma.Decimal {
  if (v === null || v === '') return new Prisma.Decimal(def)
  return new Prisma.Decimal(v)
}

export async function seedPharmacie(prisma: PrismaClient): Promise<void> {
  const sqlPath =
    process.env.PHARMACIE_SEED_SQL ?? join(__dirname, 'configpharmacie.sql')
  if (!existsSync(sqlPath)) {
    console.warn(
      `[seed-pharmacie] Fichier absent : ${sqlPath} — import pharmacie ignoré.`,
    )
    return
  }
  const sql = readFileSync(sqlPath, 'utf8')

  const assurances = await prisma.assurance.findMany({ select: { id: true } })
  const assuranceIds = new Set(assurances.map((a) => a.id))

  // --- conditionnements ---
  const insCond = extractInsertStatement(sql, 'conditionnements')
  if (insCond) {
    const inner = getValuesInner(insCond)
    if (inner) {
      for (const row of splitValueRows(inner)) {
        const f = parseMysqlValues(row)
        if (f.length < 7) continue
        const id = bigIntOrThrow(f[0], 'conditionnement')
        await prisma.conditionnement.upsert({
          where: { id },
          create: {
            id,
            libelle: f[1] ?? '',
            isCommon: boolFromMysql(f[2]),
            rank: intOr(f[3], 100),
            actif: boolFromMysql(f[4]),
            createdAt: f[5] ? new Date(f[5]) : null,
            updatedAt: f[6] ? new Date(f[6]) : null,
          },
          update: {
            libelle: f[1] ?? '',
            isCommon: boolFromMysql(f[2]),
            rank: intOr(f[3], 100),
            actif: boolFromMysql(f[4]),
            createdAt: f[5] ? new Date(f[5]) : null,
            updatedAt: f[6] ? new Date(f[6]) : null,
          },
        })
      }
    }
  }

  // --- formes_galeniques ---
  const insForme = extractInsertStatement(sql, 'formes_galeniques')
  if (insForme) {
    const inner = getValuesInner(insForme)
    if (inner) {
      for (const row of splitValueRows(inner)) {
        const f = parseMysqlValues(row)
        if (f.length < 7) continue
        const id = bigIntOrThrow(f[0], 'forme')
        await prisma.formeGalenique.upsert({
          where: { id },
          create: {
            id,
            libelle: f[1] ?? '',
            isCommon: boolFromMysql(f[2]),
            rank: intOr(f[3], 100),
            actif: boolFromMysql(f[4]),
            createdAt: f[5] ? new Date(f[5]) : null,
            updatedAt: f[6] ? new Date(f[6]) : null,
          },
          update: {
            libelle: f[1] ?? '',
            isCommon: boolFromMysql(f[2]),
            rank: intOr(f[3], 100),
            actif: boolFromMysql(f[4]),
            createdAt: f[5] ? new Date(f[5]) : null,
            updatedAt: f[6] ? new Date(f[6]) : null,
          },
        })
      }
    }
  }

  // --- fournisseurs ---
  const insFour = extractInsertStatement(sql, 'fournisseurs')
  if (insFour) {
    const inner = getValuesInner(insFour)
    if (inner) {
      for (const row of splitValueRows(inner)) {
        const f = parseMysqlValues(row)
        if (f.length < 9) continue
        const id = bigIntOrThrow(f[0], 'fournisseur')
        await prisma.fournisseur.upsert({
          where: { id },
          create: {
            id,
            raisonSociale: f[1] ?? '',
            adresse: f[2],
            telephone1: f[3],
            telephone2: f[4],
            email: f[5],
            actif: boolFromMysql(f[6]),
            createdAt: f[7] ? new Date(f[7]) : null,
            updatedAt: f[8] ? new Date(f[8]) : null,
          },
          update: {
            raisonSociale: f[1] ?? '',
            adresse: f[2],
            telephone1: f[3],
            telephone2: f[4],
            email: f[5],
            actif: boolFromMysql(f[6]),
            createdAt: f[7] ? new Date(f[7]) : null,
            updatedAt: f[8] ? new Date(f[8]) : null,
          },
        })
      }
    }
  }

  // --- produits ---
  const insProd = extractInsertStatement(sql, 'produits')
  if (insProd) {
    const inner = getValuesInner(insProd)
    if (inner) {
      let skippedCip = 0
      for (const row of splitValueRows(inner)) {
        const f = parseMysqlValues(row)
        // id, nom, principe_actif, code_cip, forme_galenique_id, dosage, conditionnement_id,
        // qte_par_conditionnement, prix_achat_ref, prix_vente_ref, hnc, qte_alerte, assureur_id, actif, created_at, updated_at
        if (f.length < 16) continue
        const id = bigIntOrThrow(f[0], 'produit')
        const assureurRaw = f[12]
        const assureurId =
          assureurRaw && assuranceIds.has(BigInt(assureurRaw))
            ? BigInt(assureurRaw)
            : null
        const codeCip = f[3]
        try {
          await prisma.produit.upsert({
            where: { id },
            create: {
              id,
              nom: f[1] ?? '',
              principeActif: f[2],
              codeCip,
              formeGaleniqueId: bigIntOrThrow(f[4], 'forme_galenique_id'),
              dosage: f[5] ?? '',
              conditionnementId: bigIntOrThrow(f[6], 'conditionnement_id'),
              qteParConditionnement: intOr(f[7], 1),
              prixAchatRef: decimalOr(f[8], '0'),
              prixVenteRef: decimalOr(f[9], '0'),
              hnc: f[10] ? decimalOr(f[10], '0') : null,
              qteAlerte: intOr(f[11], 0),
              assureurId,
              actif: boolFromMysql(f[13]),
              createdAt: f[14] ? new Date(f[14]) : null,
              updatedAt: f[15] ? new Date(f[15]) : null,
            },
            update: {
              nom: f[1] ?? '',
              principeActif: f[2],
              codeCip,
              formeGaleniqueId: bigIntOrThrow(f[4], 'forme_galenique_id'),
              dosage: f[5] ?? '',
              conditionnementId: bigIntOrThrow(f[6], 'conditionnement_id'),
              qteParConditionnement: intOr(f[7], 1),
              prixAchatRef: decimalOr(f[8], '0'),
              prixVenteRef: decimalOr(f[9], '0'),
              hnc: f[10] ? decimalOr(f[10], '0') : null,
              qteAlerte: intOr(f[11], 0),
              assureurId,
              actif: boolFromMysql(f[13]),
              createdAt: f[14] ? new Date(f[14]) : null,
              updatedAt: f[15] ? new Date(f[15]) : null,
            },
          })
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e)
          if (
            msg.includes('Unique constraint') &&
            msg.includes('code_cip')
          ) {
            skippedCip++
            console.warn(
              `[seed-pharmacie] code_cip dupliqué ou conflit — produit id=${id} ignoré`,
            )
            continue
          }
          throw e
        }
      }
      if (skippedCip > 0) {
        console.warn(
          `[seed-pharmacie] ${skippedCip} produit(s) ignoré(s) (contrainte code_cip).`,
        )
      }
    }
  }

  console.log('[seed-pharmacie] Import terminé.')
}
