'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { toSerializable } from '@/lib/json-bigint'
import { requireUserId } from '@/lib/auth/session'
import { resolvePatientLabels, round2 } from '@/lib/caisse/helpers'

export type BacFactureRow = {
  id: string
  factureId: string
  factureNumero: string
  patientId: string
  patientLabel: string | null
  sourceType: 'FEUILLE' | 'PRESCRIPTION' | 'FACTURE' | 'MIXTE'
  sourceLabel: string | null
  montantPatient: number
  montantAssurance: number
  encaissementId: string | null
  encaissementNumero: string | null
  createdAt: string | null
}

export async function getBacFactureNavCount(): Promise<number> {
  return prisma.bacFacture.count({ where: { statut: 'PENDING' } })
}

export async function listBacFacturesPending(): Promise<BacFactureRow[]> {
  await requireUserId()
  const rows = await prisma.bacFacture.findMany({
    where: { statut: 'PENDING' },
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    include: {
      facture: {
        select: {
          id: true,
          numero: true,
          patientId: true,
          montantPatient: true,
          montantAssurance: true,
          feuilles: {
            include: { feuille: { select: { numero: true } } },
          },
          prescriptions: {
            include: { prescription: { select: { numero: true } } },
          },
        },
      },
      encaissement: {
        select: { id: true, numero: true, type: true },
      },
    },
  })

  const patientIds = [...new Set(rows.map((r) => r.facture.patientId))]
  const labels = await resolvePatientLabels(patientIds)

  return toSerializable(
    rows.map((r) => {
      const nbF = r.facture.feuilles.length
      const nbP = r.facture.prescriptions.length
      let sourceType: BacFactureRow['sourceType'] = 'FACTURE'
      let sourceLabel: string | null = null

      if (r.encaissement?.type === 'FEUILLE' || (nbF > 0 && nbP === 0)) {
        sourceType = 'FEUILLE'
        sourceLabel = r.facture.feuilles.map((l) => l.feuille.numero).join(', ') || null
      } else if (r.encaissement?.type === 'PRESCRIPTION' || (nbP > 0 && nbF === 0)) {
        sourceType = 'PRESCRIPTION'
        sourceLabel =
          r.facture.prescriptions.map((l) => l.prescription.numero).join(', ') || null
      } else if (nbF > 0 && nbP > 0) {
        sourceType = 'MIXTE'
        sourceLabel = [
          ...r.facture.feuilles.map((l) => l.feuille.numero),
          ...r.facture.prescriptions.map((l) => l.prescription.numero),
        ].join(', ')
      } else if (r.encaissement?.type === 'FACTURE') {
        sourceType = 'FACTURE'
        sourceLabel = r.facture.numero
      }

      return {
        id: r.id.toString(),
        factureId: r.facture.id.toString(),
        factureNumero: r.facture.numero,
        patientId: r.facture.patientId.toString(),
        patientLabel: labels.get(r.facture.patientId.toString())?.label ?? null,
        sourceType,
        sourceLabel,
        montantPatient: round2(Number(r.facture.montantPatient)),
        montantAssurance: round2(Number(r.facture.montantAssurance)),
        encaissementId: r.encaissement?.id.toString() ?? null,
        encaissementNumero: r.encaissement?.numero ?? null,
        createdAt: r.createdAt ? r.createdAt.toISOString() : null,
      }
    }),
  ) as BacFactureRow[]
}

export async function markBacFactureImprime(
  bacId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await requireUserId()
    const id = BigInt(bacId)
    const row = await prisma.bacFacture.findUnique({
      where: { id },
      select: { id: true, statut: true },
    })
    if (!row) return { ok: false, error: 'Élément introuvable dans le bac.' }
    if (row.statut === 'IMPRIME') return { ok: true }

    await prisma.bacFacture.update({
      where: { id },
      data: { statut: 'IMPRIME', printedAt: new Date() },
    })

    revalidatePath('/facturation/bac')
    revalidatePath('/facturation')
    return { ok: true }
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : 'Erreur lors du marquage',
    }
  }
}
