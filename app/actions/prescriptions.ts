"use server"

import { Prisma } from "@prisma/client"
import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { formatPatientIdentityLine } from "@/lib/formatting"
import {
  endOfDayDouala,
  parseDoualaIsoDate,
  shiftDoualaDays,
  startOfDayDouala,
  startOfWeekDouala,
  zonedDateTimeToUtc,
} from "@/lib/timezone"
import {
  computeLigne,
  normalizeDecimal,
} from "@/lib/feuille-circulation/calcul"
import {
  ensurePatientNonAssureLink,
  findNonAssureAssurance,
  isNonAssureAssuranceName,
} from "@/lib/assurance/non-assure"
import { requireUser, requireUserId } from "@/lib/auth/session"
import {
  prescriptionCreateSchema,
  prescriptionUpdateSchema,
  type PrescriptionLigneInput,
} from "@/lib/validations/prescription"
import type {
  PrescriptionDetail,
  PrescriptionFilters,
  PrescriptionLigneRow,
  PrescriptionProduitOption,
  PrescriptionStats,
  PrescriptionTotaux,
  PrescriptionListRow,
  VisitePrescriptionContext,
} from "@/lib/types/prescription"

function num(v: Prisma.Decimal | number | null | undefined): number {
  if (v === null || v === undefined) return 0
  return Number(v)
}

function numOrNull(v: Prisma.Decimal | number | null | undefined): number | null {
  if (v === null || v === undefined) return null
  return Number(v)
}

function isPharmacieCategory(nom: string | null | undefined): boolean {
  if (!nom) return false
  const n = nom.toLowerCase()
  return n === "pharmacie" || n.includes("pharm")
}

type ResolvedPatient = { label: string; dob: string | null }

async function resolvePatientLabels(
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
          p.nomJeuneFille != null && String(p.nomJeuneFille).trim() !== ""
            ? String(p.nomJeuneFille)
            : null,
        ),
        dob: p.patDob ? p.patDob.toISOString() : null,
      },
    ]),
  )
}

type Affiliation = {
  id: string
  assuranceId: string
  assuranceNom: string
  tauxCouverture: number
  dateDebut: Date | null
  dateFin: Date | null
  expiree: boolean
  couvertures: Map<string, number>
  valeurs: Map<string, number>
}

async function loadAffiliation(patientId: bigint): Promise<Affiliation | null> {
  const ap = await prisma.assurancePatient.findFirst({
    where: { patientId },
    include: {
      assurance: { include: { assuranceValeurs: true } },
      couvertures: true,
    },
  })
  if (!ap) return null

  const now = new Date()
  const expiree =
    (ap.dateDebut != null && ap.dateDebut > now) ||
    (ap.dateFin != null && ap.dateFin < now)

  const valeurs = new Map<string, number>()
  for (const v of ap.assurance.assuranceValeurs) {
    if (!valeurs.has(v.codeBase)) valeurs.set(v.codeBase, Number(v.valeurUnitaire))
  }

  const couvertures = new Map<string, number>()
  for (const c of ap.couvertures) {
    couvertures.set(c.categorieId.toString(), Number(c.tauxCouverture))
  }

  return {
    id: ap.id.toString(),
    assuranceId: ap.assuranceId.toString(),
    assuranceNom: ap.assurance.nom,
    tauxCouverture: Number(ap.tauxCouverture),
    dateDebut: ap.dateDebut,
    dateFin: ap.dateFin,
    expiree,
    couvertures,
    valeurs,
  }
}

function affiliationFromNonAssureAssurance(assurance: {
  id: bigint
  nom: string
  assuranceValeurs: { codeBase: string; valeurUnitaire: unknown }[]
}): Affiliation {
  const valeurs = new Map<string, number>()
  for (const v of assurance.assuranceValeurs) {
    if (!valeurs.has(v.codeBase)) valeurs.set(v.codeBase, Number(v.valeurUnitaire))
  }
  return {
    id: "0",
    assuranceId: assurance.id.toString(),
    assuranceNom: assurance.nom,
    tauxCouverture: 0,
    dateDebut: null,
    dateFin: null,
    expiree: false,
    couvertures: new Map(),
    valeurs,
  }
}

async function resolveAffiliationForPrescription(patientId: bigint): Promise<{
  affiliation: Affiliation
  priseEnChargePatient: boolean
  affiliationExpiree: boolean
}> {
  let real = await loadAffiliation(patientId)

  if (!real) {
    await ensurePatientNonAssureLink(patientId)
    real = await loadAffiliation(patientId)
  }

  if (real?.expiree) {
    return {
      affiliation: real,
      priseEnChargePatient: false,
      affiliationExpiree: true,
    }
  }

  if (real) {
    return {
      affiliation: real,
      priseEnChargePatient: isNonAssureAssuranceName(real.assuranceNom),
      affiliationExpiree: false,
    }
  }

  const nonAssure = await findNonAssureAssurance()
  if (nonAssure) {
    return {
      affiliation: affiliationFromNonAssureAssurance(nonAssure),
      priseEnChargePatient: true,
      affiliationExpiree: false,
    }
  }

  throw new Error(
    'Assurance "Non assure" introuvable dans le referentiel. Configurez-la avant de creer une prescription.',
  )
}

function affiliationToContext(a: Affiliation) {
  return {
    id: a.id,
    assuranceId: a.assuranceId,
    assuranceNom: a.assuranceNom,
    tauxCouverture: a.tauxCouverture,
    dateDebut: a.dateDebut ? a.dateDebut.toISOString() : null,
    dateFin: a.dateFin ? a.dateFin.toISOString() : null,
    expiree: a.expiree,
    couvertures: Object.fromEntries(a.couvertures),
    valeurs: Object.fromEntries(a.valeurs),
  }
}

function buildDateFilter(
  periode?: string,
  dateFrom?: string,
  dateTo?: string,
): { gte?: Date; lte?: Date } | undefined {
  const now = new Date()
  if (periode === "custom" && dateFrom) {
    const from = parseDoualaIsoDate(dateFrom)
    const toDate = dateTo ? parseDoualaIsoDate(dateTo) : from
    if (from && toDate) {
      const gte = startOfDayDouala(from)
      const lte = endOfDayDouala(toDate)
      return { gte, lte: lte < gte ? endOfDayDouala(from) : lte }
    }
    return undefined
  }
  if (periode === "today") return { gte: startOfDayDouala(now), lte: endOfDayDouala(now) }
  if (periode === "yesterday") {
    const y = shiftDoualaDays(now, -1)
    return { gte: startOfDayDouala(y), lte: endOfDayDouala(y) }
  }
  if (periode === "week") return { gte: startOfWeekDouala(now), lte: endOfDayDouala(now) }
  if (periode === "month") {
    const p = startOfDayDouala(now)
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Africa/Douala",
      year: "numeric",
      month: "2-digit",
    }).formatToParts(p)
    const year = Number(parts.find((x) => x.type === "year")?.value)
    const month = Number(parts.find((x) => x.type === "month")?.value)
    return {
      gte: zonedDateTimeToUtc(year, month, 1, 0, 0, 0, 0),
      lte: endOfDayDouala(now),
    }
  }
  return undefined
}

function findPharmacieCategorieId(
  categories: { id: bigint; nom: string }[],
): bigint {
  const categorie = categories.find((c) => isPharmacieCategory(c.nom))
  if (!categorie) {
    throw new Error('Categorie "Pharmacie" introuvable.')
  }
  return categorie.id
}

type PrescriptionLigneCreateData = {
  categorieId: bigint
  produitId: bigint
  quantite: number
  taux: number
  valeur: number
  hnc: number
  puSnapshot: number | null
  remiseUnitaire: number | null
  montantTotal: number
  montantAssurance: number
  montantPatient: number
  position: number
  userId: bigint
}

function resolveHncSaisi(
  raw: unknown,
  defaultHnc: number | null | undefined,
): number | null {
  const parsed = normalizeDecimal(raw)
  const fallback = defaultHnc != null && Number(defaultHnc) > 0 ? Number(defaultHnc) : null
  if (parsed === null || parsed === 0) return fallback
  return parsed
}

async function buildPrescriptionLignesData(
  lignes: PrescriptionLigneInput[],
  affiliation: Affiliation,
  userId: bigint,
): Promise<PrescriptionLigneCreateData[]> {
  const produitIds = [...new Set(lignes.map((l) => BigInt(l.produitId)))]

  const [categories, produits] = await Promise.all([
    prisma.categorieActe.findMany({ orderBy: { nom: "asc" } }),
    prisma.produit.findMany({ where: { id: { in: produitIds } } }),
  ])

  const categorieId = findPharmacieCategorieId(categories)
  const taux =
    affiliation.couvertures.get(categorieId.toString()) ??
    affiliation.tauxCouverture ??
    0

  const produitMap = new Map(produits.map((p) => [p.id.toString(), p]))

  return lignes.map((ligne, idx) => {
    const produit = produitMap.get(ligne.produitId)
    if (!produit) {
      throw new Error(`Ligne #${idx + 1} : produit introuvable.`)
    }
    const puSaisi = normalizeDecimal(ligne.prixUnitaire)
    const pu = puSaisi ?? Number(produit.prixVenteRef)
    const remise = normalizeDecimal(ligne.remiseUnitaire) ?? 0
    const produitHnc = produit.hnc != null ? Number(produit.hnc) : null
    const hncSaisi = resolveHncSaisi(ligne.hnc, produitHnc)

    const r = computeLigne({
      typeLigne: "PHARMA",
      quantite: ligne.quantite,
      taux,
      hncSaisi,
      pu,
      remise,
      produitHnc,
    })

    return {
      categorieId,
      produitId: produit.id,
      quantite: Math.max(1, Math.trunc(ligne.quantite || 1)),
      taux,
      valeur: r.valeur,
      hnc: r.hnc,
      puSnapshot: r.puSnapshot,
      remiseUnitaire: r.remiseUnitaire,
      montantTotal: r.montantTotal,
      montantAssurance: r.montantAssurance,
      montantPatient: r.montantPatient,
      position: ligne.position ?? idx,
      userId,
    }
  })
}

function ligneToRow(l: {
  id: bigint
  categorieId: bigint
  categorie: { nom: string } | null
  produitId: bigint
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
  position: number
}): PrescriptionLigneRow {
  return {
    id: l.id.toString(),
    categorieId: l.categorieId.toString(),
    categorieNom: l.categorie?.nom ?? null,
    produitId: l.produitId.toString(),
    produitNom: l.produit?.nom ?? null,
    produitDosage: l.produit?.dosage ?? null,
    quantite: l.quantite,
    taux: l.taux,
    valeur: num(l.valeur),
    hnc: num(l.hnc),
    puSnapshot: numOrNull(l.puSnapshot),
    remiseUnitaire: numOrNull(l.remiseUnitaire),
    montantTotal: num(l.montantTotal),
    montantAssurance: num(l.montantAssurance),
    montantPatient: num(l.montantPatient),
    position: l.position,
  }
}

function computeTotaux(lignes: PrescriptionLigneRow[]): PrescriptionTotaux {
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
    totalAssurance: Math.round(totalAssurance * 100) / 100,
    totalPatient: Math.round(totalPatient * 100) / 100,
    totalHnc: Math.round(totalHnc * 100) / 100,
    total: Math.round(total * 100) / 100,
  }
}

function slugPrefix(code: string | null | undefined): string {
  const base = (code ?? "GENE").trim() || "GENE"
  const slug = base
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]/g, "")
    .slice(0, 4)
    .toUpperCase()
  return slug || "GENE"
}

async function buildPrescriptionNumero(
  medecinCode: string | null,
  offset: number,
): Promise<string> {
  const now = new Date()
  const year = now.getFullYear()
  const startOfYear = new Date(year, 0, 1)
  const endOfYear = new Date(year, 11, 31, 23, 59, 59, 999)

  const depart = Number(
    (await prisma.parametre.findFirst({ select: { numeroFactureDepart: true } }))
      ?.numeroFactureDepart ?? 1,
  )
  const countThisYear = await prisma.prescription.count({
    where: { createdAt: { gte: startOfYear, lte: endOfYear } },
  })

  const seq = String(depart + countThisYear + offset).padStart(4, "0")
  const mois = String(now.getMonth() + 1).padStart(2, "0")
  const annee = String(year).slice(-2)
  return `PRSC-${seq}/${mois}/${slugPrefix(medecinCode)}/${annee}`
}

type ActionResult<T = { id: string }> =
  | ({ ok: true } & T)
  | { ok: false; error: string }

export async function listProduitsForPrescription(
  q?: string,
): Promise<PrescriptionProduitOption[]> {
  const term = q?.trim()
  const rows = await prisma.produit.findMany({
    where: {
      actif: true,
      ...(term ? { nom: { contains: term, mode: "insensitive" } } : {}),
    },
    orderBy: { nom: "asc" },
    take: 100,
    select: { id: true, nom: true, dosage: true, prixVenteRef: true, hnc: true },
  })
  return rows.map((p) => ({
    id: p.id.toString(),
    nom: p.nom,
    dosage: p.dosage,
    prixVenteRef: num(p.prixVenteRef),
    hnc: numOrNull(p.hnc),
  }))
}

export async function getVisitePrescriptionContext(
  visiteId: string,
): Promise<VisitePrescriptionContext | null> {
  const v = await prisma.visite.findUnique({
    where: { id: BigInt(visiteId) },
    include: { medecin: { select: { id: true, name: true, titre: true } } },
  })
  if (!v) return null

  const labels = await resolvePatientLabels([v.patientId])
  const resolved = await resolveAffiliationForPrescription(v.patientId)
  const categories = await prisma.categorieActe.findMany({ orderBy: { nom: "asc" } })
  const pharmacieCategorieId = findPharmacieCategorieId(categories)
  const pharmacieCoverage =
    resolved.affiliation.couvertures.get(pharmacieCategorieId.toString()) ??
    resolved.affiliation.tauxCouverture ??
    0

  return {
    visiteId: v.id.toString(),
    dateVisite: v.dateVisite.toISOString(),
    patientId: v.patientId.toString(),
    patientLabel: labels.get(v.patientId.toString())?.label ?? null,
    patientDob: labels.get(v.patientId.toString())?.dob ?? null,
    medecinId: v.medecin.id.toString(),
    medecinNom: `${v.medecin.titre ? `${v.medecin.titre} ` : ""}${v.medecin.name}`,
    affiliation: resolved.affiliationExpiree
      ? null
      : affiliationToContext(resolved.affiliation),
    pharmacieCoverage,
    priseEnChargePatient: resolved.priseEnChargePatient,
    affiliationExpiree: resolved.affiliationExpiree,
  }
}

export async function listPrescriptions(
  filters: PrescriptionFilters = {},
): Promise<PrescriptionListRow[]> {
  const dateFilter = buildDateFilter(filters.periode, filters.dateFrom, filters.dateTo)

  const rows = await prisma.prescription.findMany({
    where: {
      ...(filters.statut ? { statut: filters.statut } : {}),
      ...(filters.visiteId ? { visiteId: BigInt(filters.visiteId) } : {}),
      ...(filters.medecinId ? { medecinId: BigInt(filters.medecinId) } : {}),
      ...(dateFilter ? { createdAt: dateFilter } : {}),
      ...(filters.patientId ? { visite: { patientId: BigInt(filters.patientId) } } : {}),
    },
    include: {
      visite: {
        select: {
          id: true,
          patientId: true,
          dateVisite: true,
        },
      },
      medecin: { select: { id: true, name: true, titre: true } },
      lignes: {
        select: { montantAssurance: true, montantPatient: true, montantTotal: true },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 500,
  })

  const labels = await resolvePatientLabels(rows.map((r) => r.visite.patientId))

  return rows.map((r) => {
    let totalAssurance = 0
    let totalPatient = 0
    let total = 0
    for (const l of r.lignes) {
      totalAssurance += num(l.montantAssurance)
      totalPatient += num(l.montantPatient)
      total += num(l.montantTotal)
    }
    return {
      id: r.id.toString(),
      numero: r.numero,
      libelle: r.libelle,
      statut: r.statut as PrescriptionListRow["statut"],
      statutPaiement: r.statutPaiement as PrescriptionListRow["statutPaiement"],
      visiteId: r.visite.id.toString(),
      patientId: r.visite.patientId.toString(),
      patientLabel: labels.get(r.visite.patientId.toString())?.label ?? null,
      patientDob: labels.get(r.visite.patientId.toString())?.dob ?? null,
      dateVisite: r.visite.dateVisite.toISOString(),
      createdAt: r.createdAt ? r.createdAt.toISOString() : null,
      confirmedAt: r.confirmedAt ? r.confirmedAt.toISOString() : null,
      medecinId: r.medecin.id.toString(),
      medecinNom: `${r.medecin.titre ? `${r.medecin.titre} ` : ""}${r.medecin.name}`,
      nbLignes: r.lignes.length,
      totalAssurance,
      totalPatient,
      total,
    }
  })
}

export async function getPrescriptionStats(): Promise<PrescriptionStats> {
  const now = new Date()
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const endOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    23,
    59,
    59,
    999,
  )

  const [total, brouillon, confirmees, impayees, today, patientAgg] =
    await Promise.all([
      prisma.prescription.count(),
      prisma.prescription.count({ where: { statut: "BROUILLON" } }),
      prisma.prescription.count({ where: { statut: "CONFIRMEE" } }),
      prisma.prescription.count({ where: { statutPaiement: "IMPAYEE" } }),
      prisma.prescription.count({
        where: { createdAt: { gte: startOfToday, lte: endOfToday } },
      }),
      prisma.prescriptionLigne.aggregate({
        where: { prescription: { statutPaiement: "IMPAYEE" } },
        _sum: { montantPatient: true },
      }),
    ])

  return {
    total,
    brouillon,
    confirmees,
    impayees,
    today,
    totalPatientEnCours: num(patientAgg._sum.montantPatient),
  }
}

export async function getPrescriptionById(
  id: string,
): Promise<PrescriptionDetail | null> {
  const p = await prisma.prescription.findUnique({
    where: { id: BigInt(id) },
    include: {
      visite: {
        select: {
          id: true,
          patientId: true,
          dateVisite: true,
          medecin: { select: { id: true, name: true, titre: true, numeroOrdre: true } },
        },
      },
      lignes: {
        orderBy: [{ position: "asc" }, { id: "asc" }],
        include: {
          categorie: { select: { nom: true } },
          produit: { select: { nom: true, dosage: true } },
        },
      },
    },
  })
  if (!p) return null

  const labels = await resolvePatientLabels([p.visite.patientId])
  const lignes = p.lignes.map(ligneToRow)
  const medecin = p.visite.medecin
  const medecinNom = medecin
    ? `${medecin.titre ? `${medecin.titre} ` : ""}${medecin.name}`
    : null

  return {
    id: p.id.toString(),
    numero: p.numero,
    libelle: p.libelle,
    statut: p.statut as PrescriptionDetail["statut"],
    statutPaiement: p.statutPaiement as PrescriptionDetail["statutPaiement"],
    paidAt: p.paidAt ? p.paidAt.toISOString() : null,
    createdAt: p.createdAt ? p.createdAt.toISOString() : null,
    updatedAt: p.updatedAt ? p.updatedAt.toISOString() : null,
    confirmedAt: p.confirmedAt ? p.confirmedAt.toISOString() : null,
    medecinId: p.medecinId.toString(),
    userId: p.userId.toString(),
    visite: {
      id: p.visite.id.toString(),
      dateVisite: p.visite.dateVisite.toISOString(),
      patientId: p.visite.patientId.toString(),
      patientLabel: labels.get(p.visite.patientId.toString())?.label ?? null,
      patientDob: labels.get(p.visite.patientId.toString())?.dob ?? null,
      medecinNom,
      medecinNumeroOrdre: medecin?.numeroOrdre ?? null,
    },
    lignes,
    totaux: computeTotaux(lignes),
  }
}

export async function createPrescription(data: unknown): Promise<ActionResult> {
  let parsed
  try {
    parsed = prescriptionCreateSchema.parse(data)
  } catch {
    return { ok: false, error: "Donnees invalides." }
  }

  try {
    const user = await requireUser()
    if (!user.roles.includes("Médecin")) {
      return { ok: false, error: "Seul un medecin peut creer une prescription." }
    }

    const userId = user.id
    const visite = await prisma.visite.findUnique({
      where: { id: BigInt(parsed.visiteId) },
      include: { medecin: { select: { id: true, code: true } } },
    })
    if (!visite) return { ok: false, error: "Visite introuvable." }

    const creator = await prisma.user.findUnique({
      where: { id: userId },
      select: { code: true },
    })

    const resolved = await resolveAffiliationForPrescription(visite.patientId)
    if (resolved.affiliationExpiree) {
      return {
        ok: false,
        error: "Creation impossible : l'affiliation assurance est expiree ou pas encore active.",
      }
    }

    const lignesData = await buildPrescriptionLignesData(
      parsed.lignes,
      resolved.affiliation,
      userId,
    )

    const created = await prisma.$transaction(async (tx) => {
      let lastErr: unknown = null
      for (let attempt = 0; attempt < 5; attempt++) {
        const numero = await buildPrescriptionNumero(creator?.code ?? null, attempt)
        try {
          return await tx.prescription.create({
            data: {
              visiteId: visite.id,
              numero,
              libelle: parsed.libelle ?? null,
              statut: "BROUILLON",
              statutPaiement: "IMPAYEE",
              medecinId: userId,
              userId,
              lignes: {
                create: lignesData.map((l) => ({
                  categorieId: l.categorieId,
                  produitId: l.produitId,
                  quantite: l.quantite,
                  taux: l.taux,
                  valeur: l.valeur,
                  hnc: l.hnc,
                  puSnapshot: l.puSnapshot,
                  remiseUnitaire: l.remiseUnitaire,
                  montantTotal: l.montantTotal,
                  montantAssurance: l.montantAssurance,
                  montantPatient: l.montantPatient,
                  position: l.position,
                  userId: l.userId,
                })),
              },
            },
          })
        } catch (e) {
          if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
            lastErr = e
            continue
          }
          throw e
        }
      }
      throw lastErr ?? new Error("Impossible de generer un numero unique.")
    })

    revalidatePath("/prescriptions")
    revalidatePath(`/visites/${parsed.visiteId}`)
    revalidatePath(`/patients/${visite.patientId.toString()}`)
    return { ok: true, id: created.id.toString() }
  } catch (e) {
    console.error("createPrescription error", e)
    const message = e instanceof Error ? e.message : "Erreur lors de la creation."
    return { ok: false, error: message }
  }
}

export async function updatePrescription(data: unknown): Promise<ActionResult> {
  let parsed
  try {
    parsed = prescriptionUpdateSchema.parse(data)
  } catch {
    return { ok: false, error: "Donnees invalides." }
  }

  try {
    const userId = await requireUserId()
    const prescription = await prisma.prescription.findUnique({
      where: { id: BigInt(parsed.id) },
      include: { visite: { select: { patientId: true } } },
    })
    if (!prescription) return { ok: false, error: "Prescription introuvable." }
    if (prescription.statut !== "BROUILLON") {
      return { ok: false, error: "Modification impossible : la prescription est confirmee." }
    }

    const resolved = await resolveAffiliationForPrescription(
      prescription.visite.patientId,
    )
    if (resolved.affiliationExpiree) {
      return {
        ok: false,
        error: "Mise a jour impossible : l'affiliation assurance est expiree ou pas encore active.",
      }
    }

    const lignesData = await buildPrescriptionLignesData(
      parsed.lignes,
      resolved.affiliation,
      userId,
    )

    await prisma.$transaction(async (tx) => {
      await tx.prescriptionLigne.deleteMany({
        where: { prescriptionId: prescription.id },
      })
      await tx.prescription.update({
        where: { id: prescription.id },
        data: {
          libelle: parsed.libelle ?? null,
          lignes: {
            create: lignesData.map((l) => ({
              categorieId: l.categorieId,
              produitId: l.produitId,
              quantite: l.quantite,
              taux: l.taux,
              valeur: l.valeur,
              hnc: l.hnc,
              puSnapshot: l.puSnapshot,
              remiseUnitaire: l.remiseUnitaire,
              montantTotal: l.montantTotal,
              montantAssurance: l.montantAssurance,
              montantPatient: l.montantPatient,
              position: l.position,
              userId: l.userId,
            })),
          },
        },
      })
    })

    revalidatePath("/prescriptions")
    revalidatePath(`/prescriptions/${parsed.id}`)
    return { ok: true, id: parsed.id }
  } catch (e) {
    console.error("updatePrescription error", e)
    const message = e instanceof Error ? e.message : "Erreur lors de la mise a jour."
    return { ok: false, error: message }
  }
}

export async function confirmPrescription(id: string): Promise<ActionResult> {
  try {
    const user = await requireUser()
    const prescription = await prisma.prescription.findUnique({
      where: { id: BigInt(id) },
      include: {
        _count: { select: { lignes: true } },
      },
    })
    if (!prescription) return { ok: false, error: "Prescription introuvable." }
    if (prescription.statut === "CONFIRMEE") {
      return { ok: false, error: "La prescription est deja confirmee." }
    }
    if (!user.roles.includes("Médecin")) {
      return { ok: false, error: "Seul un medecin peut valider une prescription." }
    }
    if (prescription.userId !== user.id) {
      return {
        ok: false,
        error: "Seul le medecin auteur de la prescription peut la valider.",
      }
    }
    if (prescription._count.lignes === 0) {
      return { ok: false, error: "Impossible de confirmer une prescription sans ligne." }
    }

    await prisma.prescription.update({
      where: { id: BigInt(id) },
      data: { statut: "CONFIRMEE", confirmedAt: new Date() },
    })

    revalidatePath("/prescriptions")
    revalidatePath(`/prescriptions/${id}`)
    return { ok: true, id }
  } catch (e) {
    console.error("confirmPrescription error", e)
    return { ok: false, error: "Erreur lors de la confirmation." }
  }
}

export async function deletePrescription(id: string): Promise<ActionResult> {
  try {
    const prescription = await prisma.prescription.findUnique({
      where: { id: BigInt(id) },
      include: { visite: { select: { patientId: true } } },
    })
    if (!prescription) return { ok: false, error: "Prescription introuvable." }
    if (prescription.statut !== "BROUILLON") {
      return { ok: false, error: "Suppression impossible : la prescription est confirmee." }
    }

    await prisma.prescription.delete({ where: { id: prescription.id } })

    revalidatePath("/prescriptions")
    revalidatePath(`/visites/${prescription.visiteId.toString()}`)
    revalidatePath(`/patients/${prescription.visite.patientId.toString()}`)
    return { ok: true, id }
  } catch (e) {
    console.error("deletePrescription error", e)
    return { ok: false, error: "Erreur lors de la suppression." }
  }
}
