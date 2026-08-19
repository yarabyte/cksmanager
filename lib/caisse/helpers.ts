import type { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { formatPatientIdentityLine } from '@/lib/formatting'
import type { FeuilleLigneRow, FeuilleTotaux } from '@/lib/types/feuille-circulation'

export const SYSTEM_USER_ID = BigInt(1)

export function num(v: Prisma.Decimal | number | null | undefined): number {
  if (v === null || v === undefined) return 0
  return Number(v)
}

export function round2(n: number): number {
  return Math.round(n * 100) / 100
}

type ResolvedPatient = { label: string; dob: string | null }

export async function resolvePatientLabels(
  patientIds: bigint[],
): Promise<Map<string, ResolvedPatient>> {
  const unique = [...new Set(patientIds.map((id) => id.toString()))]
  if (unique.length === 0) return new Map()
  const patients = await prisma.patient.findMany({
    where: { id: { in: unique.map((id) => BigInt(id)) } },
    select: {
      id: true,
      patName: true,
      patSurname: true,
      sexe: true,
      nomJeuneFille: true,
      patDob: true,
    },
  })
  return new Map(
    patients.map((p) => [
      p.id.toString(),
      {
        label: formatPatientIdentityLine(
          String(p.patName),
          String(p.patSurname),
          Number(p.sexe),
          p.nomJeuneFille != null && String(p.nomJeuneFille).trim() !== ''
            ? String(p.nomJeuneFille)
            : null,
        ),
        dob: p.patDob ? p.patDob.toISOString() : null,
      },
    ]),
  )
}

export async function ensureWallet(patientId: bigint, userId?: bigint) {
  const existing = await prisma.wallet.findUnique({ where: { patientId } })
  if (existing) return existing
  return prisma.wallet.create({
    data: { patientId, userId: userId ?? SYSTEM_USER_ID },
  })
}

export async function computeWalletSolde(walletId: bigint): Promise<number> {
  const agg = await prisma.walletTransaction.aggregate({
    where: { walletId },
    _sum: { montant: true },
  })
  return round2(num(agg._sum.montant))
}

export function computeTotauxFromLignes(lignes: FeuilleLigneRow[]): FeuilleTotaux {
  let totalAssurance = 0
  let totalPatient = 0
  let totalHnc = 0
  let total = 0
  for (const l of lignes) {
    totalAssurance += l.montantAssurance
    totalPatient += l.montantPatient
    totalHnc += l.hnc * l.quantite
    total += l.montantTotal
  }
  return {
    totalAssurance: round2(totalAssurance),
    totalPatient: round2(totalPatient),
    totalHnc: round2(totalHnc),
    total: round2(total),
  }
}

export function ligneToRow(l: {
  id: bigint
  typeLigne: string
  categorieId: bigint
  categorie: { nom: string } | null
  acteId: bigint | null
  acte: { nom: string } | null
  produitId: bigint | null
  produit: { nom: string; dosage: string } | null
  quantite: number
  taux: number
  valeur: Prisma.Decimal
  hnc: Prisma.Decimal
  puSnapshot: Prisma.Decimal | null
  remiseUnitaire: Prisma.Decimal | null
  montantTotal: Prisma.Decimal
  montantAssurance: Prisma.Decimal
  montantPatient: Prisma.Decimal
  imputeAssurance: number | null
  position: number
}): FeuilleLigneRow {
  return {
    id: l.id.toString(),
    typeLigne: l.typeLigne as 'ACTE' | 'PHARMA',
    categorieId: l.categorieId.toString(),
    categorieNom: l.categorie?.nom ?? null,
    acteId: l.acteId ? l.acteId.toString() : null,
    acteNom: l.acte?.nom ?? null,
    produitId: l.produitId ? l.produitId.toString() : null,
    produitNom: l.produit?.nom ?? null,
    produitDosage: l.produit?.dosage ?? null,
    quantite: l.quantite,
    taux: l.taux,
    valeur: num(l.valeur),
    hnc: num(l.hnc),
    puSnapshot: l.puSnapshot != null ? num(l.puSnapshot) : null,
    remiseUnitaire: l.remiseUnitaire != null ? num(l.remiseUnitaire) : null,
    montantTotal: num(l.montantTotal),
    montantAssurance: num(l.montantAssurance),
    montantPatient: num(l.montantPatient),
    imputeAssurance: l.imputeAssurance,
    position: l.position,
  }
}

const ligneInclude = {
  categorie: { select: { nom: true } },
  acte: { select: { nom: true } },
  produit: { select: { nom: true, dosage: true } },
} as const

export async function sumFeuilleMontants(feuilleId: bigint) {
  const agg = await prisma.feuilleCirculationLigne.aggregate({
    where: { feuilleId },
    _sum: { montantPatient: true, montantAssurance: true },
  })
  return {
    montantPatient: round2(num(agg._sum.montantPatient)),
    montantAssurance: round2(num(agg._sum.montantAssurance)),
  }
}

export async function loadFeuilleLignes(feuilleId: bigint) {
  const rows = await prisma.feuilleCirculationLigne.findMany({
    where: { feuilleId },
    orderBy: [{ position: 'asc' }, { id: 'asc' }],
    include: ligneInclude,
  })
  const lignes = rows.map(ligneToRow)
  return { lignes, totaux: computeTotauxFromLignes(lignes) }
}

export async function sumPrescriptionMontants(prescriptionId: bigint) {
  const agg = await prisma.prescriptionLigne.aggregate({
    where: { prescriptionId },
    _sum: { montantPatient: true, montantAssurance: true },
  })
  return {
    montantPatient: round2(num(agg._sum.montantPatient)),
    montantAssurance: round2(num(agg._sum.montantAssurance)),
  }
}

export async function loadPrescriptionLignes(prescriptionId: bigint) {
  const rows = await prisma.prescriptionLigne.findMany({
    where: { prescriptionId },
    orderBy: [{ position: 'asc' }, { id: 'asc' }],
    include: {
      categorie: { select: { nom: true } },
      produit: { select: { nom: true, dosage: true } },
    },
  })
  const lignes = rows.map((l) => ({
    id: l.id.toString(),
    typeLigne: 'PHARMA' as const,
    categorieId: l.categorieId.toString(),
    categorieNom: l.categorie?.nom ?? null,
    acteId: null,
    acteNom: null,
    produitId: l.produitId.toString(),
    produitNom: l.produit?.nom ?? null,
    produitDosage: l.produit?.dosage ?? null,
    quantite: l.quantite,
    taux: l.taux,
    valeur: num(l.valeur),
    hnc: num(l.hnc),
    puSnapshot: l.puSnapshot != null ? num(l.puSnapshot) : null,
    remiseUnitaire: l.remiseUnitaire != null ? num(l.remiseUnitaire) : null,
    montantTotal: num(l.montantTotal),
    montantAssurance: num(l.montantAssurance),
    montantPatient: num(l.montantPatient),
    imputeAssurance: null,
    position: l.position,
  }))
  return { lignes, totaux: computeTotauxFromLignes(lignes) }
}

export async function getFeuillesInConfirmedFactureIds(): Promise<bigint[]> {
  const links = await prisma.factureFeuille.findMany({
    where: { facture: { statut: { in: ['CONFIRMEE', 'PAYEE'] } } },
    select: { feuilleCirculationId: true },
  })
  return links.map((l) => l.feuilleCirculationId)
}

function padNum(n: number, len: number) {
  return String(n).padStart(len, '0')
}

export async function nextRecuNumero(
  tx: Prisma.TransactionClient,
): Promise<string> {
  const p = await tx.parametre.findFirst({ select: { id: true, numeroRecuDepart: true } })
  const seq = p?.numeroRecuDepart ?? 1
  const now = new Date()
  const numero = `REC-${padNum(seq, 4)}/${padNum(now.getMonth() + 1, 2)}/${String(now.getFullYear()).slice(-2)}`
  if (p) {
    await tx.parametre.update({
      where: { id: p.id },
      data: { numeroRecuDepart: seq + 1 },
    })
  }
  return numero
}

export async function nextAvoirNumero(
  tx: Prisma.TransactionClient,
): Promise<string> {
  const p = await tx.parametre.findFirst({ select: { id: true, numeroAvoirDepart: true } })
  const seq = p?.numeroAvoirDepart ?? 1
  const now = new Date()
  const numero = `AVO-${padNum(seq, 4)}/${padNum(now.getMonth() + 1, 2)}/${String(now.getFullYear()).slice(-2)}`
  if (p) {
    await tx.parametre.update({
      where: { id: p.id },
      data: { numeroAvoirDepart: seq + 1 },
    })
  }
  return numero
}

/** Code court utilisateur (max 4 lettres), défaut GENE. */
export function slugUserCode(code: string | null | undefined): string {
  const base = (code ?? 'GENE').trim() || 'GENE'
  const slug = base
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]/g, '')
    .slice(0, 4)
    .toUpperCase()
  return slug || 'GENE'
}

/**
 * Numéro de facture : `{seq}/{mois}/{codeMédecin}/{yy}`
 * ex. 1005/07/GYN/26 — séquence depuis Parametre.numeroFactureDepart.
 */
export async function nextFactureNumero(
  tx: Prisma.TransactionClient,
  medecinCode?: string | null,
): Promise<string> {
  const p = await tx.parametre.findFirst({ select: { id: true, numeroFactureDepart: true } })
  const seq = p?.numeroFactureDepart ?? 1
  const now = new Date()
  const numero = `${padNum(seq, 4)}/${padNum(now.getMonth() + 1, 2)}/${slugUserCode(medecinCode)}/${String(now.getFullYear()).slice(-2)}`
  if (p) {
    await tx.parametre.update({
      where: { id: p.id },
      data: { numeroFactureDepart: seq + 1 },
    })
  }
  return numero
}

export type JournalCaisseWriteInput = {
  sens: 'ENCAISSEMENT' | 'DECAISSEMENT'
  montant: number
  modePaiement?: 'ESPECES' | 'MOBILE_MONEY' | 'PORTEFEUILLE' | null
  libelle: string
  patientId?: bigint | null
  referenceType?: string | null
  referenceId?: bigint | null
  encaissementId?: bigint | null
  versementId?: bigint | null
  sessionId?: bigint | null
  userId?: bigint
}

/** Écrit une ligne dans le journal de caisse (dans une transaction existante). */
export async function writeJournalCaisseEntry(
  tx: Prisma.TransactionClient,
  input: JournalCaisseWriteInput,
) {
  return tx.journalCaisse.create({
    data: {
      sens: input.sens,
      montant: round2(input.montant),
      modePaiement: input.modePaiement ?? null,
      libelle: input.libelle.slice(0, 500),
      patientId: input.patientId ?? null,
      referenceType: input.referenceType ?? null,
      referenceId: input.referenceId ?? null,
      encaissementId: input.encaissementId ?? null,
      versementId: input.versementId ?? null,
      sessionId: input.sessionId ?? null,
      userId: input.userId ?? SYSTEM_USER_ID,
    },
  })
}

export async function maybeMarkVisiteFacturee(
  tx: Prisma.TransactionClient,
  visiteId: bigint,
) {
  const unpaid = await tx.feuilleCirculation.count({
    where: {
      visiteId,
      statut: 'CONFIRMEE',
      statutPaiement: 'IMPAYEE',
    },
  })
  if (unpaid === 0) {
    await tx.visite.update({
      where: { id: visiteId },
      data: { statut: 'FACTUREE' },
    })
  }
}
