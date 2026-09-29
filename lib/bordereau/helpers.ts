import type { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { isNonAssureAssuranceName } from '@/lib/assurance/non-assure'
import { round2 } from '@/lib/caisse/helpers'
import type {
  BordereauStatut,
  FactureSuiviAssureurStatut,
  BordereauFactureStatut,
} from '@/lib/types/bordereau'

function padNum(n: number, len: number) {
  return String(n).padStart(len, '0')
}

type Db = Prisma.TransactionClient | typeof prisma

/** Code court dérivé du nom (fallback si `assurance.code` est vide). */
export function assuranceCodeFromNom(nom: string): string {
  const slug = nom
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '')
    .slice(0, 12)
  return slug || 'ASS'
}

export function resolveAssuranceCode(code: string | null | undefined, nom: string): string {
  const c = code?.trim().toUpperCase()
  if (c) return c.replace(/[^A-Z0-9]+/g, '').slice(0, 12) || assuranceCodeFromNom(nom)
  return assuranceCodeFromNom(nom)
}

function startOfDay(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))
}

/**
 * Assurance patient active à la date de visite, hors « Non assuré ».
 * Priorité : couverture en cours (dateDebut/dateFin), sinon première affiliation réelle.
 */
export async function resolveActiveAssuranceId(
  patientId: bigint,
  dateVisite: Date,
  tx?: Prisma.TransactionClient,
): Promise<bigint | null> {
  const db: Db = tx ?? prisma
  const aps = await db.assurancePatient.findMany({
    where: { patientId },
    include: { assurance: { select: { id: true, nom: true } } },
    orderBy: { id: 'asc' },
  })

  const day = startOfDay(dateVisite)
  const candidates = aps.filter((ap) => !isNonAssureAssuranceName(ap.assurance.nom))
  if (candidates.length === 0) return null

  const active = candidates.find((ap) => {
    if (ap.dateDebut && startOfDay(ap.dateDebut) > day) return false
    if (ap.dateFin && startOfDay(ap.dateFin) < day) return false
    return true
  })

  return (active ?? candidates[0]).assurance.id
}

/** Assure que la facture a un `assuranceId` (backfill à la volée). */
export async function ensureFactureAssuranceId(
  factureId: bigint,
  tx?: Prisma.TransactionClient,
): Promise<bigint | null> {
  const db: Db = tx ?? prisma
  const f = await db.facture.findUnique({
    where: { id: factureId },
    select: {
      assuranceId: true,
      patientId: true,
      visite: { select: { dateVisite: true } },
    },
  })
  if (!f) return null
  if (f.assuranceId) return f.assuranceId

  const assuranceId = await resolveActiveAssuranceId(f.patientId, f.visite.dateVisite, tx)
  if (!assuranceId) return null

  await db.facture.update({
    where: { id: factureId },
    data: { assuranceId },
  })
  return assuranceId
}

export async function nextBordereauNumero(
  assuranceId: bigint,
  tx: Prisma.TransactionClient,
): Promise<string> {
  const assurance = await tx.assurance.findUnique({
    where: { id: assuranceId },
    select: { nom: true, code: true },
  })
  if (!assurance) throw new Error('Assureur introuvable.')

  const code = resolveAssuranceCode(assurance.code, assurance.nom)
  const year = new Date().getFullYear()
  const prefix = `BA-${code}-${year}-`

  const last = await tx.bordereauAssureur.findFirst({
    where: { numero: { startsWith: prefix } },
    orderBy: { numero: 'desc' },
    select: { numero: true },
  })

  let seq = 1
  if (last?.numero) {
    const part = last.numero.slice(prefix.length)
    const n = parseInt(part, 10)
    if (!Number.isNaN(n)) seq = n + 1
  }

  return `${prefix}${padNum(seq, 4)}`
}

export function suiviAssureurFromBordereau(
  bordereauStatut: BordereauStatut | null | undefined,
): FactureSuiviAssureurStatut {
  if (!bordereauStatut) return 'A_DEPOSER'
  if (bordereauStatut === 'BROUILLON') return 'EN_BORDEREAU'
  if (bordereauStatut === 'DEPOSE') return 'DEPOSE'
  return 'PAYE'
}

/** Suivi assureur dérivé du statut de la ligne BordereauFacture. */
export function suiviAssureurFromBordereauFacture(
  lineStatut: BordereauFactureStatut | string | null | undefined,
): FactureSuiviAssureurStatut {
  if (!lineStatut) return 'A_DEPOSER'
  if (lineStatut === 'EN_BORDEREAU') return 'EN_BORDEREAU'
  if (lineStatut === 'DEPOSE') return 'DEPOSE'
  if (lineStatut === 'PAYE') return 'PAYE'
  return 'A_DEPOSER'
}

/**
 * Agrège le statut global du bordereau à partir des lignes.
 * — BROUILLON : aucune facture déposée
 * — PARTIEL : certaines déposées/payées, d'autres encore en bordereau
 * — DEPOSE : toutes déposées (aucune encore « en bordereau », pas toutes payées)
 * — PAYE : toutes payées
 */
export function deriveBordereauStatutFromLines(
  lineStatuts: Array<BordereauFactureStatut | string>,
): BordereauStatut {
  if (lineStatuts.length === 0) return 'BROUILLON'
  if (lineStatuts.every((s) => s === 'PAYE')) return 'PAYE'
  if (lineStatuts.every((s) => s === 'EN_BORDEREAU')) return 'BROUILLON'
  if (lineStatuts.some((s) => s === 'EN_BORDEREAU')) return 'PARTIEL'
  return 'DEPOSE'
}

export { round2 }
