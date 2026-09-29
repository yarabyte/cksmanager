import type { Prisma } from '@prisma/client'
import { nextFactureNumero, round2 } from '@/lib/caisse/helpers'
import { resolveActiveAssuranceId } from '@/lib/bordereau/helpers'

async function sumFeuilleInTx(tx: Prisma.TransactionClient, feuilleId: bigint) {
  const agg = await tx.feuilleCirculationLigne.aggregate({
    where: { feuilleId },
    _sum: { montantPatient: true, montantAssurance: true },
  })
  return {
    montantPatient: round2(Number(agg._sum.montantPatient ?? 0)),
    montantAssurance: round2(Number(agg._sum.montantAssurance ?? 0)),
  }
}

async function sumPrescriptionInTx(
  tx: Prisma.TransactionClient,
  prescriptionId: bigint,
) {
  const agg = await tx.prescriptionLigne.aggregate({
    where: { prescriptionId },
    _sum: { montantPatient: true, montantAssurance: true },
  })
  return {
    montantPatient: round2(Number(agg._sum.montantPatient ?? 0)),
    montantAssurance: round2(Number(agg._sum.montantAssurance ?? 0)),
  }
}

async function enqueueBac(
  tx: Prisma.TransactionClient,
  factureId: bigint,
  encaissementId: bigint,
  userId: bigint,
) {
  const existing = await tx.bacFacture.findUnique({
    where: { encaissementId },
    select: { id: true },
  })
  if (existing) return existing.id

  const row = await tx.bacFacture.create({
    data: {
      factureId,
      encaissementId,
      userId,
      statut: 'PENDING',
    },
  })
  return row.id
}

/**
 * Après encaissement caisse : assure une Facture (création si besoin) et
 * l'ajoute au bac d'impression (PENDING).
 */
export async function ensureFactureAndEnqueueBac(
  tx: Prisma.TransactionClient,
  input: {
    type: 'FEUILLE' | 'PRESCRIPTION' | 'FACTURE'
    sourceId: bigint
    encaissementId: bigint
    userId: bigint
  },
): Promise<bigint> {
  const now = new Date()

  if (input.type === 'FACTURE') {
    await enqueueBac(tx, input.sourceId, input.encaissementId, input.userId)
    return input.sourceId
  }

  if (input.type === 'FEUILLE') {
    const link = await tx.factureFeuille.findUnique({
      where: { feuilleCirculationId: input.sourceId },
      select: { factureId: true },
    })
    if (link) {
      await enqueueBac(tx, link.factureId, input.encaissementId, input.userId)
      return link.factureId
    }

    const feuille = await tx.feuilleCirculation.findUnique({
      where: { id: input.sourceId },
      include: {
        visite: {
          select: {
            id: true,
            patientId: true,
            dateVisite: true,
            medecin: { select: { code: true } },
          },
        },
      },
    })
    if (!feuille) throw new Error('Feuille de circulation introuvable.')

    const m = await sumFeuilleInTx(tx, input.sourceId)
    // Feuille déjà payée : part patient de la facture = 0
    const montantPatient = 0
    const montantAssurance = m.montantAssurance
    const assuranceId =
      montantAssurance > 0
        ? await resolveActiveAssuranceId(feuille.visite.patientId, feuille.visite.dateVisite)
        : null

    const numero = await nextFactureNumero(tx, feuille.visite.medecin?.code)
    const facture = await tx.facture.create({
      data: {
        numero,
        visiteId: feuille.visite.id,
        patientId: feuille.visite.patientId,
        assuranceId,
        statut: 'PAYEE',
        montantPatient,
        montantAssurance,
        confirmedAt: now,
        paidAt: now,
        userId: input.userId,
        feuilles: {
          create: { feuilleCirculationId: input.sourceId },
        },
      },
    })

    await enqueueBac(tx, facture.id, input.encaissementId, input.userId)
    return facture.id
  }

  // PRESCRIPTION
  const existingRx = await tx.facturePrescription.findUnique({
    where: { prescriptionId: input.sourceId },
    select: { factureId: true },
  })
  if (existingRx) {
    await enqueueBac(tx, existingRx.factureId, input.encaissementId, input.userId)
    return existingRx.factureId
  }

  const prescription = await tx.prescription.findUnique({
    where: { id: input.sourceId },
    include: {
      visite: {
        select: {
          id: true,
          patientId: true,
          dateVisite: true,
          medecin: { select: { code: true } },
        },
      },
    },
  })
  if (!prescription) throw new Error('Prescription introuvable.')

  const m = await sumPrescriptionInTx(tx, input.sourceId)
  const montantPatient = 0
  const montantAssurance = m.montantAssurance
  const assuranceId =
    montantAssurance > 0
      ? await resolveActiveAssuranceId(
          prescription.visite.patientId,
          prescription.visite.dateVisite,
        )
      : null

  const numero = await nextFactureNumero(tx, prescription.visite.medecin?.code)
  const facture = await tx.facture.create({
    data: {
      numero,
      visiteId: prescription.visite.id,
      patientId: prescription.visite.patientId,
      assuranceId,
      statut: 'PAYEE',
      montantPatient,
      montantAssurance,
      confirmedAt: now,
      paidAt: now,
      userId: input.userId,
      prescriptions: {
        create: { prescriptionId: input.sourceId },
      },
    },
  })

  await enqueueBac(tx, facture.id, input.encaissementId, input.userId)
  return facture.id
}
