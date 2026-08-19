/**
 * Import référentiels de configuration depuis un dump PostgreSQL TablePlus.
 * Préserve patients / visites / params / antécédents Plenitude.
 *
 * Usage :
 *   pnpm db:import-config-dump -- --dry-run
 *   pnpm db:import-config-dump -- --execute
 *
 * Source : CONFIG_DUMP_SQL ou chemin par défaut vers la sauvegarde.
 */
import { existsSync, readFileSync } from 'fs'
import { join } from 'path'
import { Prisma, PrismaClient } from '@prisma/client'
import {
  loadPgTableRows,
  pgBigInt,
  pgBool,
  pgDate,
  pgFloat,
  pgInt,
  pgJson,
  type PgRow,
} from '../prisma/pg-insert-utils'

const BATCH_SIZE = 200
const DEFAULT_DUMP = join(
  '/Users/shakemill/Documents/sauvegarde projets/cksmanager',
  '_prisma_migrations',
)
const SQL_PATH = process.env.CONFIG_DUMP_SQL ?? DEFAULT_DUMP

const prisma = new PrismaClient()

const CONFIG_TABLES = [
  'caisse_postes',
  'conditionnements',
  'formes_galeniques',
  'fournisseurs',
  'magasins',
  'pharmacies',
  'users',
  'categorie_actes',
  'assurances',
  'actes',
  'assurance_valeurs',
  'produits',
  'kit_actes',
  'kit_acte_lignes',
  'parametres',
] as const

type ConfigTable = (typeof CONFIG_TABLES)[number]

function requireId(row: PgRow): bigint {
  const id = pgBigInt(row.id)
  if (id == null) throw new Error('Ligne sans id')
  return id
}

async function countConfig() {
  return {
    caissePostes: await prisma.caissePoste.count(),
    conditionnements: await prisma.conditionnement.count(),
    formesGaleniques: await prisma.formeGalenique.count(),
    fournisseurs: await prisma.fournisseur.count(),
    magasins: await prisma.magasin.count(),
    pharmacies: await prisma.pharmacie.count(),
    users: await prisma.user.count(),
    categorieActes: await prisma.categorieActe.count(),
    assurances: await prisma.assurance.count(),
    actes: await prisma.acte.count(),
    assuranceValeurs: await prisma.assuranceValeur.count(),
    produits: await prisma.produit.count(),
    kitActes: await prisma.kitActe.count(),
    kitActeLignes: await prisma.kitActeLigne.count(),
    parametres: await prisma.parametre.count(),
    // cliniques (ne doivent pas bouger)
    patients: await prisma.patient.count(),
    visites: await prisma.visite.count(),
    parametresPatient: await prisma.parametrePatient.count(),
    antecedentsPatient: await prisma.antecedentPatient.count(),
  }
}

async function resetSequence(table: string) {
  await prisma.$executeRawUnsafe(`
    SELECT setval(
      pg_get_serial_sequence('${table}', 'id'),
      COALESCE((SELECT MAX(id) FROM ${table}), 1)
    )
  `)
}

async function createManyBatches<T extends object>(
  label: string,
  data: T[],
  insert: (batch: T[]) => Promise<{ count: number }>,
) {
  let inserted = 0
  for (let i = 0; i < data.length; i += BATCH_SIZE) {
    const batch = data.slice(i, i + BATCH_SIZE)
    const result = await insert(batch)
    inserted += result.count
    console.log(`  ${label} batch ${Math.floor(i / BATCH_SIZE) + 1} : +${result.count}`)
  }
  return inserted
}

function mapCaissePostes(rows: PgRow[]) {
  return rows.map((r) => ({
    id: requireId(r),
    nom: r.nom ?? '',
    description: r.description,
    actif: pgBool(r.actif),
    createdAt: pgDate(r.created_at),
    updatedAt: pgDate(r.updated_at),
  }))
}

function mapConditionnements(rows: PgRow[]) {
  return rows.map((r) => ({
    id: requireId(r),
    libelle: r.libelle ?? '',
    isCommon: pgBool(r.is_common),
    rank: pgInt(r.rank) ?? 100,
    actif: pgBool(r.actif),
    createdAt: pgDate(r.created_at),
    updatedAt: pgDate(r.updated_at),
  }))
}

function mapFormes(rows: PgRow[]) {
  return rows.map((r) => ({
    id: requireId(r),
    libelle: r.libelle ?? '',
    isCommon: pgBool(r.is_common),
    rank: pgInt(r.rank) ?? 100,
    actif: pgBool(r.actif),
    createdAt: pgDate(r.created_at),
    updatedAt: pgDate(r.updated_at),
  }))
}

function mapFournisseurs(rows: PgRow[]) {
  return rows.map((r) => ({
    id: requireId(r),
    raisonSociale: r.raison_sociale ?? '',
    adresse: r.adresse,
    telephone1: r.telephone1,
    telephone2: r.telephone2,
    email: r.email,
    actif: pgBool(r.actif),
    createdAt: pgDate(r.created_at),
    updatedAt: pgDate(r.updated_at),
  }))
}

function mapMagasins(rows: PgRow[]) {
  return rows.map((r) => ({
    id: requireId(r),
    nom: r.nom ?? '',
    emplacement: r.emplacement,
    description: r.description,
    actif: pgBool(r.actif),
    createdAt: pgDate(r.created_at),
    updatedAt: pgDate(r.updated_at),
  }))
}

function mapPharmacies(rows: PgRow[]) {
  return rows.map((r) => ({
    id: requireId(r),
    nom: r.nom ?? '',
    magasinId: pgBigInt(r.magasin_id)!,
    actif: pgBool(r.actif),
    createdAt: pgDate(r.created_at),
    updatedAt: pgDate(r.updated_at),
  }))
}

function mapUsers(rows: PgRow[]) {
  return rows.map((r) => ({
    id: requireId(r),
    name: r.name ?? '',
    email: r.email ?? '',
    code: r.code,
    emailVerifiedAt: pgDate(r.email_verified_at),
    password: r.password ?? '',
    telephone: r.telephone,
    photo: r.photo,
    specialite: r.specialite,
    numeroOrdre: r.numero_ordre,
    role: r.role,
    titre: r.titre,
    actif: pgBool(r.actif),
    rememberToken: r.remember_token,
    caissePosteId: pgBigInt(r.caisse_poste_id),
    pharmacieId: pgBigInt(r.pharmacie_id),
    createdAt: pgDate(r.created_at),
    updatedAt: pgDate(r.updated_at),
  }))
}

function mapCategories(rows: PgRow[]) {
  return rows.map((r) => ({
    id: requireId(r),
    nom: r.nom ?? '',
    createdAt: pgDate(r.created_at),
    updatedAt: pgDate(r.updated_at),
  }))
}

function mapAssurances(rows: PgRow[]) {
  return rows.map((r) => ({
    id: requireId(r),
    nom: r.nom ?? '',
    code: r.code,
    type: r.type,
    description: r.description,
    promoteurUserId: pgBigInt(r.promoteur_user_id),
    createdAt: pgDate(r.created_at),
    updatedAt: pgDate(r.updated_at),
  }))
}

function mapActes(rows: PgRow[]) {
  return rows.map((r) => ({
    id: requireId(r),
    nom: r.nom ?? '',
    categorieId: pgBigInt(r.categorie_id)!,
    assureurId: pgBigInt(r.assureur_id),
    codeBase: r.code_base,
    coefficient: pgFloat(r.coefficient) ?? 1,
    valeurFixe: pgFloat(r.valeur_fixe),
    prixHnc:
      r.prix_hnc != null ? new Prisma.Decimal(r.prix_hnc) : null,
    imputeAssurance: pgInt(r.impute_assurance),
    typeActe: r.type_acte,
    createdAt: pgDate(r.created_at),
    updatedAt: pgDate(r.updated_at),
  }))
}

function mapAssuranceValeurs(rows: PgRow[]) {
  return rows.map((r) => ({
    id: requireId(r),
    assuranceId: pgBigInt(r.assurance_id)!,
    codeBase: r.code_base ?? '',
    valeurUnitaire: pgFloat(r.valeur_unitaire) ?? 0,
    dateDebut: pgDate(r.date_debut),
    dateFin: pgDate(r.date_fin),
    createdAt: pgDate(r.created_at),
    updatedAt: pgDate(r.updated_at),
  }))
}

function mapProduits(rows: PgRow[]) {
  return rows.map((r) => ({
    id: requireId(r),
    nom: r.nom ?? '',
    principeActif: r.principe_actif,
    codeCip: r.code_cip,
    formeGaleniqueId: pgBigInt(r.forme_galenique_id)!,
    dosage: r.dosage ?? '',
    conditionnementId: pgBigInt(r.conditionnement_id)!,
    qteParConditionnement: pgInt(r.qte_par_conditionnement) ?? 1,
    prixAchatRef: new Prisma.Decimal(r.prix_achat_ref ?? '0'),
    prixVenteRef: new Prisma.Decimal(r.prix_vente_ref ?? '0'),
    hnc: r.hnc != null ? new Prisma.Decimal(r.hnc) : null,
    qteAlerte: pgInt(r.qte_alerte) ?? 0,
    assureurId: pgBigInt(r.assureur_id),
    sitePharma: r.site_pharma ?? 'CKS',
    actif: pgBool(r.actif),
    createdAt: pgDate(r.created_at),
    updatedAt: pgDate(r.updated_at),
  }))
}

function mapKitActes(rows: PgRow[]) {
  return rows.map((r) => ({
    id: requireId(r),
    nom: r.nom ?? '',
    description: r.description,
    userId: pgBigInt(r.user_id)!,
    actif: pgBool(r.actif),
    createdAt: pgDate(r.created_at),
    updatedAt: pgDate(r.updated_at),
  }))
}

function mapKitLignes(rows: PgRow[]) {
  return rows.map((r) => ({
    id: requireId(r),
    kitActeId: pgBigInt(r.kit_acte_id)!,
    typeLigne: r.type_ligne ?? 'ACTE',
    acteId: pgBigInt(r.acte_id),
    produitId: pgBigInt(r.produit_id),
    quantite: pgInt(r.quantite) ?? 1,
    remiseUnitaire: new Prisma.Decimal(r.remise_unitaire ?? '0'),
    position: pgInt(r.position) ?? 0,
    createdAt: pgDate(r.created_at),
    updatedAt: pgDate(r.updated_at),
  }))
}

function mapParametres(rows: PgRow[]) {
  return rows.map((r) => ({
    id: requireId(r),
    nomClinique: r.nom_clinique,
    logo: r.logo,
    adresse: r.adresse,
    telephone: r.telephone,
    email: r.email,
    numeroFactureDepart: pgInt(r.numero_facture_depart) ?? 1,
    numeroRecuDepart: pgInt(r.numero_recu_depart) ?? 1,
    numeroVersementDepart: pgInt(r.numero_versement_depart) ?? 1,
    numeroAvoirDepart: pgInt(r.numero_avoir_depart) ?? 1,
    niu: r.niu,
    registreCommerce: r.registre_commerce,
    noteBasPage1: r.note_bas_page_1,
    noteBasPage2: r.note_bas_page_2,
    whatsappRapportCaisse1: r.whatsapp_rapport_caisse_1,
    whatsappRapportCaisse2: r.whatsapp_rapport_caisse_2,
    rolePermissions: pgJson(r.role_permissions) as Prisma.InputJsonValue | null,
    createdAt: pgDate(r.created_at),
    updatedAt: pgDate(r.updated_at),
  }))
}

function loadAll(sql: string) {
  const raw: Record<ConfigTable, PgRow[]> = {} as Record<ConfigTable, PgRow[]>
  for (const t of CONFIG_TABLES) {
    raw[t] = loadPgTableRows(sql, t)
  }
  return {
    raw,
    caissePostes: mapCaissePostes(raw.caisse_postes),
    conditionnements: mapConditionnements(raw.conditionnements),
    formes: mapFormes(raw.formes_galeniques),
    fournisseurs: mapFournisseurs(raw.fournisseurs),
    magasins: mapMagasins(raw.magasins),
    pharmacies: mapPharmacies(raw.pharmacies),
    users: mapUsers(raw.users),
    categories: mapCategories(raw.categorie_actes),
    assurances: mapAssurances(raw.assurances),
    actes: mapActes(raw.actes),
    assuranceValeurs: mapAssuranceValeurs(raw.assurance_valeurs),
    produits: mapProduits(raw.produits),
    kitActes: mapKitActes(raw.kit_actes),
    kitLignes: mapKitLignes(raw.kit_acte_lignes),
    parametres: mapParametres(raw.parametres),
  }
}

async function collectReferencedUserIds(): Promise<Set<string>> {
  const ids = new Set<string>()
  const add = (id: bigint | null | undefined) => {
    if (id != null) ids.add(id.toString())
  }

  const [
    visites,
    params,
    antecedents,
    kits,
    feuilles,
    prescriptions,
    factures,
    encaissements,
    sessions,
    versements,
    journal,
    wallets,
    walletTx,
    assurances,
  ] = await Promise.all([
    prisma.visite.findMany({ select: { userId: true, medecinId: true } }),
    prisma.parametrePatient.findMany({ select: { userId: true } }),
    prisma.antecedentPatient.findMany({ select: { userId: true } }),
    prisma.kitActe.findMany({ select: { userId: true } }),
    prisma.feuilleCirculation.findMany({ select: { userId: true } }),
    prisma.prescription.findMany({
      select: { userId: true, medecinId: true },
    }),
    prisma.facture.findMany({ select: { userId: true } }),
    prisma.encaissement.findMany({ select: { userId: true } }),
    prisma.caisseSession.findMany({ select: { userId: true } }),
    prisma.versementCaisse.findMany({ select: { userId: true } }),
    prisma.journalCaisse.findMany({ select: { userId: true } }),
    prisma.wallet.findMany({ select: { userId: true } }),
    prisma.walletTransaction.findMany({ select: { userId: true } }),
    prisma.assurance.findMany({ select: { promoteurUserId: true } }),
  ])

  for (const v of visites) {
    add(v.userId)
    add(v.medecinId)
  }
  for (const r of params) add(r.userId)
  for (const r of antecedents) add(r.userId)
  for (const r of kits) add(r.userId)
  for (const r of feuilles) add(r.userId)
  for (const r of prescriptions) {
    add(r.userId)
    add(r.medecinId)
  }
  for (const r of factures) add(r.userId)
  for (const r of encaissements) add(r.userId)
  for (const r of sessions) add(r.userId)
  for (const r of versements) add(r.userId)
  for (const r of journal) add(r.userId)
  for (const r of wallets) add(r.userId)
  for (const r of walletTx) add(r.userId)
  for (const r of assurances) add(r.promoteurUserId)

  return ids
}

async function purgeBlockingAndConfig(dumpUserIds: Set<string>) {
  console.log('Purge des dépendances opérationnelles bloquantes…')

  // Stock / pharmacie ops
  await prisma.retourPharmacieLigne.deleteMany({})
  await prisma.retourPharmacie.deleteMany({})
  await prisma.sortiePharmacieLigne.deleteMany({})
  await prisma.sortiePharmacie.deleteMany({})
  await prisma.transfertLigne.deleteMany({})
  await prisma.transfertMagasin.deleteMany({})
  await prisma.mouvementStock.deleteMany({})
  await prisma.stockLot.deleteMany({})
  await prisma.approvisionnementLigne.deleteMany({})
  await prisma.approvisionnement.deleteMany({})

  // Lignes qui référencent actes / produits / catégories
  await prisma.kitActeLigne.deleteMany({})
  await prisma.kitActe.deleteMany({})
  await prisma.feuilleCirculationLigne.deleteMany({})
  await prisma.prescriptionLigne.deleteMany({})
  await prisma.assurancePatientCouverture.deleteMany({})
  await prisma.assurancePatient.deleteMany({})
  await prisma.assuranceValeur.deleteMany({})

  // Nullifier FKs optionnelles avant purge parents
  await prisma.acte.updateMany({ data: { assureurId: null } })
  await prisma.produit.updateMany({ data: { assureurId: null } })
  await prisma.assurance.updateMany({ data: { promoteurUserId: null } })
  await prisma.user.updateMany({
    data: { caissePosteId: null, pharmacieId: null },
  })
  await prisma.facture.updateMany({ data: { assuranceId: null } })

  // Config enfants → parents
  await prisma.acte.deleteMany({})
  await prisma.produit.deleteMany({})
  await prisma.assurance.deleteMany({})
  await prisma.categorieActe.deleteMany({})
  await prisma.pharmacie.deleteMany({})
  await prisma.magasin.deleteMany({})
  await prisma.formeGalenique.deleteMany({})
  await prisma.conditionnement.deleteMany({})
  await prisma.fournisseur.deleteMany({})
  await prisma.parametre.deleteMany({})

  // Sessions caisse liées aux postes
  await prisma.journalCaisse.deleteMany({})
  await prisma.versementCaisse.deleteMany({})
  await prisma.encaissement.updateMany({ data: { sessionId: null } })
  await prisma.walletTransaction.updateMany({ data: { sessionId: null } }).catch(() => undefined)
  await prisma.caisseSession.deleteMany({})
  await prisma.caissePoste.deleteMany({})

  // Users : supprimer ceux non référencés cliniquement et non présents dans le dump
  // (les users du dump seront upsert / recréés)
  const referenced = await collectReferencedUserIds()
  const allUsers = await prisma.user.findMany({ select: { id: true } })
  const toDelete = allUsers
    .filter((u) => {
      const id = u.id.toString()
      if (referenced.has(id)) return false
      // On supprime aussi les users dump existants pour createMany propre
      // sauf s'ils sont référencés
      return true
    })
    .map((u) => u.id)

  if (toDelete.length) {
    await prisma.user.deleteMany({ where: { id: { in: toDelete } } })
  }

  // Users dump déjà présents (référencés) : on les mettra à jour via upsert
  const remaining = await prisma.user.findMany({ select: { id: true } })
  console.log('Purge terminée.', {
    usersRemaining: remaining.length,
    dumpUserIds: dumpUserIds.size,
    referencedUsers: referenced.size,
  })

  return { referenced, remainingIds: new Set(remaining.map((u) => u.id.toString())) }
}

async function importData(
  data: ReturnType<typeof loadAll>,
  remainingUserIds: Set<string>,
) {
  console.log('Insert config…')

  await createManyBatches('caisse_postes', data.caissePostes, (batch) =>
    prisma.caissePoste.createMany({ data: batch }),
  )
  await createManyBatches('conditionnements', data.conditionnements, (batch) =>
    prisma.conditionnement.createMany({ data: batch }),
  )
  await createManyBatches('formes_galeniques', data.formes, (batch) =>
    prisma.formeGalenique.createMany({ data: batch }),
  )
  await createManyBatches('fournisseurs', data.fournisseurs, (batch) =>
    prisma.fournisseur.createMany({ data: batch }),
  )
  await createManyBatches('magasins', data.magasins, (batch) =>
    prisma.magasin.createMany({ data: batch }),
  )
  await createManyBatches('pharmacies', data.pharmacies, (batch) =>
    prisma.pharmacie.createMany({ data: batch }),
  )

  // Users : upsert si déjà référencé, sinon createMany
  const toCreate = data.users.filter((u) => !remainingUserIds.has(u.id.toString()))
  const toUpdate = data.users.filter((u) => remainingUserIds.has(u.id.toString()))

  if (toCreate.length) {
    await createManyBatches('users(create)', toCreate, (batch) =>
      prisma.user.createMany({ data: batch }),
    )
  }
  for (const u of toUpdate) {
    const { id, ...rest } = u
    await prisma.user.update({ where: { id }, data: rest })
  }
  console.log(`  users : ${toCreate.length} créés, ${toUpdate.length} mis à jour`)

  await createManyBatches('categorie_actes', data.categories, (batch) =>
    prisma.categorieActe.createMany({ data: batch }),
  )
  await createManyBatches('assurances', data.assurances, (batch) =>
    prisma.assurance.createMany({ data: batch }),
  )
  await createManyBatches('actes', data.actes, (batch) =>
    prisma.acte.createMany({ data: batch }),
  )
  await createManyBatches('assurance_valeurs', data.assuranceValeurs, (batch) =>
    prisma.assuranceValeur.createMany({ data: batch }),
  )
  await createManyBatches('produits', data.produits, (batch) =>
    prisma.produit.createMany({ data: batch }),
  )
  await createManyBatches('kit_actes', data.kitActes, (batch) =>
    prisma.kitActe.createMany({ data: batch }),
  )
  await createManyBatches('kit_acte_lignes', data.kitLignes, (batch) =>
    prisma.kitActeLigne.createMany({ data: batch }),
  )
  await createManyBatches('parametres', data.parametres, (batch) =>
    prisma.parametre.createMany({ data: batch }),
  )

  for (const t of CONFIG_TABLES) {
    await resetSequence(t)
  }
}

function printStats(data: ReturnType<typeof loadAll>) {
  console.log('--- Stats import config dump ---')
  console.log({
    source: SQL_PATH,
    caisse_postes: data.caissePostes.length,
    conditionnements: data.conditionnements.length,
    formes_galeniques: data.formes.length,
    fournisseurs: data.fournisseurs.length,
    magasins: data.magasins.length,
    pharmacies: data.pharmacies.length,
    users: data.users.length,
    categorie_actes: data.categories.length,
    assurances: data.assurances.length,
    actes: data.actes.length,
    assurance_valeurs: data.assuranceValeurs.length,
    produits: data.produits.length,
    kit_actes: data.kitActes.length,
    kit_acte_lignes: data.kitLignes.length,
    parametres: data.parametres.length,
  })
  console.log('Échantillon users :')
  for (const u of data.users.slice(0, 3)) {
    console.log({
      id: u.id.toString(),
      email: u.email,
      role: u.role,
      passwordPrefix: u.password.slice(0, 7),
    })
  }
  console.log('Échantillon actes :')
  for (const a of data.actes.slice(0, 3)) {
    console.log({ id: a.id.toString(), nom: a.nom, typeActe: a.typeActe })
  }
}

async function main() {
  const args = process.argv.slice(2)
  const dryRun = args.includes('--dry-run')
  const execute = args.includes('--execute')

  if (!dryRun && !execute) {
    console.error('Usage : --dry-run | --execute')
    process.exit(1)
  }
  if (dryRun && execute) {
    console.error('Choisir un seul mode : --dry-run ou --execute')
    process.exit(1)
  }

  if (!existsSync(SQL_PATH)) {
    throw new Error(`Dump introuvable : ${SQL_PATH}`)
  }

  const sql = readFileSync(SQL_PATH, 'utf8')
  const data = loadAll(sql)
  printStats(data)

  const before = await countConfig()
  console.log('État actuel DB :', before)

  if (
    data.actes.length === 0 ||
    data.users.length === 0 ||
    data.categories.length === 0
  ) {
    throw new Error('Parse incomplet : actes/users/catégories manquants')
  }

  if (dryRun) {
    console.log('Dry-run : aucune écriture en base.')
    return
  }

  const dumpUserIds = new Set(data.users.map((u) => u.id.toString()))
  const { remainingIds } = await purgeBlockingAndConfig(dumpUserIds)
  await importData(data, remainingIds)

  const after = await countConfig()
  console.log('État après import :', after)
  console.log('Import config terminé.')

  if (
    after.patients !== before.patients ||
    after.visites !== before.visites ||
    after.parametresPatient !== before.parametresPatient ||
    after.antecedentsPatient !== before.antecedentsPatient
  ) {
    console.warn('ATTENTION : compteurs cliniques ont changé !', {
      before: {
        patients: before.patients,
        visites: before.visites,
        parametresPatient: before.parametresPatient,
        antecedentsPatient: before.antecedentsPatient,
      },
      after: {
        patients: after.patients,
        visites: after.visites,
        parametresPatient: after.parametresPatient,
        antecedentsPatient: after.antecedentsPatient,
      },
    })
  } else {
    console.log('Clinique préservée : patients/visites/params/antécédents inchangés.')
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => void prisma.$disconnect())
