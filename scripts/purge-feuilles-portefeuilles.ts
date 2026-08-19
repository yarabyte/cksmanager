/**
 * Supprime toutes les feuilles de circulation et vide tous les portefeuilles patients.
 * Usage : pnpm exec tsx scripts/purge-feuilles-portefeuilles.ts
 */
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const before = {
    feuilles: await prisma.feuilleCirculation.count(),
    lignes: await prisma.feuilleCirculationLigne.count(),
    wallets: await prisma.wallet.count(),
    transactions: await prisma.walletTransaction.count(),
    encaissements: await prisma.encaissement.count(),
    journalEncaissements: await prisma.journalCaisse.count({
      where: { encaissementId: { not: null } },
    }),
  }

  console.log('État avant purge :', before)

  await prisma.$transaction(async (tx) => {
    // Journal lié aux encaissements portefeuille / feuilles
    const journalEnc = await tx.journalCaisse.deleteMany({
      where: {
        OR: [
          { encaissementId: { not: null } },
          { referenceType: 'WalletTransaction' },
          { referenceType: 'Encaissement' },
        ],
      },
    })

    // Encaissements (tous passent par wallet_transaction)
    const enc = await tx.encaissement.deleteMany({})

    // Portefeuilles : supprimer les mouvements (les wallets restent, solde = 0)
    const wt = await tx.walletTransaction.deleteMany({})

    // Liens facture ↔ feuille puis feuilles (lignes en cascade)
    const ff = await tx.factureFeuille.deleteMany({})
    const feuilles = await tx.feuilleCirculation.deleteMany({})

    // Factures marquées payées sans encaissement restant
    const factures = await tx.facture.updateMany({
      where: { statut: 'PAYEE' },
      data: { statut: 'CONFIRMEE', paidAt: null },
    })

    console.log('Supprimé / mis à jour :', {
      journalEncaissements: journalEnc.count,
      encaissements: enc.count,
      walletTransactions: wt.count,
      factureFeuilles: ff.count,
      feuilles: feuilles.count,
      facturesRemisesEnConfirmee: factures.count,
    })
  })

  const after = {
    feuilles: await prisma.feuilleCirculation.count(),
    lignes: await prisma.feuilleCirculationLigne.count(),
    wallets: await prisma.wallet.count(),
    transactions: await prisma.walletTransaction.count(),
    encaissements: await prisma.encaissement.count(),
  }

  console.log('État après purge :', after)
  console.log('Purge terminée.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => void prisma.$disconnect())
