/**
 * Supprime toutes les visites, factures, feuilles de circulation et encaissements liés.
 * Usage : pnpm exec tsx scripts/purge-visites-facturation.ts
 */
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function countAll() {
  return {
    visites: await prisma.visite.count(),
    feuilles: await prisma.feuilleCirculation.count(),
    lignesFeuilles: await prisma.feuilleCirculationLigne.count(),
    factures: await prisma.facture.count(),
    factureFeuilles: await prisma.factureFeuille.count(),
    bordereauFactures: await prisma.bordereauFacture.count(),
    bordereaux: await prisma.bordereauAssureur.count(),
    encaissements: await prisma.encaissement.count(),
    journalEncaissements: await prisma.journalCaisse.count({
      where: { encaissementId: { not: null } },
    }),
    walletTransactions: await prisma.walletTransaction.count(),
    sortiesPharmacie: await prisma.sortiePharmacie.count(),
    retoursPharmacie: await prisma.retourPharmacie.count(),
  }
}

async function main() {
  const before = await countAll()
  console.log("État avant purge :", before)

  const deleted = await prisma.$transaction(async (tx) => {
    const journalEnc = await tx.journalCaisse.deleteMany({
      where: {
        OR: [
          { encaissementId: { not: null } },
          { referenceType: "WalletTransaction" },
          { referenceType: "Encaissement" },
        ],
      },
    })

    const retourLignes = await tx.retourPharmacieLigne.deleteMany({})
    const retours = await tx.retourPharmacie.deleteMany({})
    const sortieLignes = await tx.sortiePharmacieLigne.deleteMany({})
    const sorties = await tx.sortiePharmacie.deleteMany({})

    const enc = await tx.encaissement.deleteMany({})
    const wt = await tx.walletTransaction.deleteMany({})

    const bf = await tx.bordereauFacture.deleteMany({})
    const bordereaux = await tx.bordereauAssureur.deleteMany({})
    const ff = await tx.factureFeuille.deleteMany({})
    const factures = await tx.facture.deleteMany({})
    const feuilles = await tx.feuilleCirculation.deleteMany({})
    const visites = await tx.visite.deleteMany({})

    return {
      journalEncaissements: journalEnc.count,
      retourLignes: retourLignes.count,
      retours: retours.count,
      sortieLignes: sortieLignes.count,
      sorties: sorties.count,
      encaissements: enc.count,
      walletTransactions: wt.count,
      bordereauFactures: bf.count,
      bordereaux: bordereaux.count,
      factureFeuilles: ff.count,
      factures: factures.count,
      feuilles: feuilles.count,
      visites: visites.count,
    }
  })

  console.log("Supprimé :", deleted)

  const after = await countAll()
  console.log("État après purge :", after)
  console.log("Purge terminée.")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => void prisma.$disconnect())
