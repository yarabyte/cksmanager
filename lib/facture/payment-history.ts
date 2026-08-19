import { prisma } from '@/lib/prisma'
import { round2 } from '@/lib/caisse/helpers'
import { toSerializable } from '@/lib/json-bigint'
import type { FacturePaiementHistoriqueRow } from '@/lib/types/facture'

export function encaissementTypeLabel(type: string) {
  if (type === 'FEUILLE') return 'Feuille de circulation'
  if (type === 'FACTURE') return 'Facture'
  return type
}

export async function loadFactureHistoriquePaiements(
  factureId: bigint,
  feuilleIds: bigint[],
): Promise<{ rows: FacturePaiementHistoriqueRow[]; totalEncaisse: number }> {
  const or: object[] = [{ factureId }]
  if (feuilleIds.length > 0) {
    or.push({ feuilleId: { in: feuilleIds } })
  }

  const encaissements = await prisma.encaissement.findMany({
    where: { OR: or },
    include: {
      user: { select: { name: true } },
      feuille: { select: { id: true, numero: true } },
    },
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
  })

  let totalEncaisse = 0
  const rows: FacturePaiementHistoriqueRow[] = encaissements.map((e) => {
    const montant = round2(Number(e.montant))
    totalEncaisse += montant
    return {
      id: e.id.toString(),
      numero: e.numero,
      type: e.type as 'FEUILLE' | 'FACTURE',
      montant,
      createdAt: e.createdAt ? e.createdAt.toISOString() : new Date().toISOString(),
      caissierNom: e.user?.name ?? null,
      feuilleId: e.feuille?.id.toString() ?? null,
      feuilleNumero: e.feuille?.numero ?? null,
    }
  })

  return {
    rows: toSerializable(rows) as FacturePaiementHistoriqueRow[],
    totalEncaisse: round2(totalEncaisse),
  }
}
