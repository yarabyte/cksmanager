import { prisma } from '@/lib/prisma'
import { toSerializable } from '@/lib/json-bigint'
import {
  computeWalletSolde,
  loadFeuilleLignes,
  loadPrescriptionLignes,
  resolvePatientLabels,
  round2,
} from '@/lib/caisse/helpers'
import type { EncaissementRecuDetail } from '@/lib/types/caisse'

export async function loadEncaissementRecuDetail(
  id: string,
): Promise<EncaissementRecuDetail | null> {
  const enc = await prisma.encaissement.findUnique({
    where: { id: BigInt(id) },
    include: {
      user: { select: { name: true } },
      feuille: { select: { numero: true, visiteId: true } },
      facture: { select: { numero: true, visiteId: true, montantAssurance: true } },
      prescription: { select: { numero: true, visiteId: true } },
      walletTransaction: { select: { walletId: true } },
    },
  })
  if (!enc) return null

  const visiteId = enc.feuille?.visiteId ?? enc.facture?.visiteId ?? enc.prescription?.visiteId
  if (!visiteId) return null

  const visite = await prisma.visite.findUnique({
    where: { id: visiteId },
    include: { medecin: { select: { name: true, titre: true } } },
  })
  if (!visite) return null

  const labels = await resolvePatientLabels([enc.patientId])
  const pl = labels.get(enc.patientId.toString())

  const wallet = await prisma.wallet.findUnique({
    where: { patientId: enc.patientId },
  })
  let walletSoldeApres = 0
  if (wallet) {
    walletSoldeApres = await computeWalletSolde(wallet.id)
  }

  const feuillesRecu = []
  let montantAssurance = 0

  if (enc.type === 'FEUILLE' && enc.feuilleId) {
    const { lignes, totaux } = await loadFeuilleLignes(enc.feuilleId)
    montantAssurance = totaux.totalAssurance
    feuillesRecu.push({
      feuilleId: enc.feuilleId.toString(),
      numero: enc.feuille?.numero ?? '',
      lignes,
      totaux,
    })
  } else if (enc.type === 'FACTURE' && enc.factureId) {
    montantAssurance = round2(Number(enc.facture?.montantAssurance ?? 0))
    const links = await prisma.factureFeuille.findMany({
      where: { factureId: enc.factureId },
      include: { feuille: { select: { id: true, numero: true } } },
    })
    for (const link of links) {
      const { lignes, totaux } = await loadFeuilleLignes(link.feuilleCirculationId)
      feuillesRecu.push({
        feuilleId: link.feuille.id.toString(),
        numero: link.feuille.numero,
        lignes,
        totaux,
      })
    }
  } else if (enc.type === 'PRESCRIPTION' && enc.prescriptionId) {
    const { lignes, totaux } = await loadPrescriptionLignes(enc.prescriptionId)
    montantAssurance = totaux.totalAssurance
    feuillesRecu.push({
      feuilleId: enc.prescriptionId.toString(),
      numero: enc.prescription?.numero ?? '',
      lignes,
      totaux,
    })
  }

  const parametres = await prisma.parametre.findFirst()

  const medecinNom = visite.medecin
    ? `${visite.medecin.titre ? visite.medecin.titre + ' ' : ''}${visite.medecin.name}`
    : null

  return toSerializable({
    id: enc.id.toString(),
    numero: enc.numero,
    type: enc.type as 'FEUILLE' | 'FACTURE' | 'PRESCRIPTION',
    montant: round2(Number(enc.montant)),
    createdAt: enc.createdAt ? enc.createdAt.toISOString() : new Date().toISOString(),
    caissierNom: enc.user?.name ?? null,
    patientId: enc.patientId.toString(),
    patientLabel: pl?.label ?? null,
    patientDob: pl?.dob ?? null,
    visiteId: visite.id.toString(),
    dateVisite: visite.dateVisite.toISOString(),
    medecinNom,
    feuilleNumero: enc.feuille?.numero ?? null,
    factureNumero: enc.facture?.numero ?? null,
    prescriptionNumero: enc.prescription?.numero ?? null,
    montantAssurance,
    walletSoldeApres,
    feuilles: feuillesRecu,
    clinique: {
      nomClinique: parametres?.nomClinique ?? null,
      adresse: parametres?.adresse ?? null,
      telephone: parametres?.telephone ?? null,
      email: parametres?.email ?? null,
      niu: parametres?.niu ?? null,
      registreCommerce: parametres?.registreCommerce ?? null,
    },
  }) as EncaissementRecuDetail
}
