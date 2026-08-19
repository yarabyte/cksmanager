import type { FactureStatut } from '@/lib/types/facture'
import type { FactureSuiviAssureur } from '@/lib/types/bordereau'

export type PartPaiementStatut = 'SANS_PART' | 'IMPAYE' | 'PAYE'

export type FacturePaiementGlobal =
  | 'BROUILLON'
  | 'A_ENCAISSER'
  | 'PAYE_PATIENT'
  | 'PAYE_ASSUREUR'
  | 'TOTALEMENT_PAYE'

export type FacturePaiementStatus = {
  patient: PartPaiementStatut
  assureur: PartPaiementStatut
  global: FacturePaiementGlobal
  hasPartPatient: boolean
  hasPartAssureur: boolean
}

export function resolveFacturePaiementStatus(input: {
  statut: FactureStatut
  montantPatient: number
  montantAssurance: number
  suiviAssureur: FactureSuiviAssureur | null
}): FacturePaiementStatus {
  const hasPartPatient = input.montantPatient > 0
  const hasPartAssureur = input.montantAssurance > 0

  const patient: PartPaiementStatut = !hasPartPatient
    ? 'SANS_PART'
    : input.statut === 'PAYEE'
      ? 'PAYE'
      : 'IMPAYE'

  const assureur: PartPaiementStatut = !hasPartAssureur
    ? 'SANS_PART'
    : input.suiviAssureur?.statut === 'PAYE'
      ? 'PAYE'
      : 'IMPAYE'

  if (input.statut === 'BROUILLON') {
    return { patient, assureur, global: 'BROUILLON', hasPartPatient, hasPartAssureur }
  }

  const patientOk = patient !== 'IMPAYE'
  const assureurOk = assureur !== 'IMPAYE'

  if (patientOk && assureurOk) {
    return {
      patient,
      assureur,
      global: 'TOTALEMENT_PAYE',
      hasPartPatient,
      hasPartAssureur,
    }
  }

  if (patientOk && !assureurOk) {
    return {
      patient,
      assureur,
      global: hasPartAssureur ? 'PAYE_PATIENT' : 'TOTALEMENT_PAYE',
      hasPartPatient,
      hasPartAssureur,
    }
  }

  if (!patientOk && assureurOk) {
    return {
      patient,
      assureur,
      global: hasPartPatient ? 'PAYE_ASSUREUR' : 'TOTALEMENT_PAYE',
      hasPartPatient,
      hasPartAssureur,
    }
  }

  // Aucune part payée
  if (hasPartPatient && hasPartAssureur) {
    return { patient, assureur, global: 'A_ENCAISSER', hasPartPatient, hasPartAssureur }
  }

  return { patient, assureur, global: 'A_ENCAISSER', hasPartPatient, hasPartAssureur }
}

export const PAIEMENT_GLOBAL_LABEL: Record<FacturePaiementGlobal, string> = {
  BROUILLON: 'Brouillon',
  A_ENCAISSER: 'À encaisser',
  PAYE_PATIENT: 'Payé patient',
  PAYE_ASSUREUR: 'Payé assureur',
  TOTALEMENT_PAYE: 'Totalement payé',
}

export const PAIEMENT_GLOBAL_CLASS: Record<FacturePaiementGlobal, string> = {
  BROUILLON: 'bg-gray-100 text-gray-700',
  A_ENCAISSER: 'bg-blue-100 text-blue-800',
  PAYE_PATIENT: 'bg-[#cd3b86]/15 text-[#b8307a]',
  PAYE_ASSUREUR: 'bg-emerald-100 text-emerald-800',
  TOTALEMENT_PAYE: 'bg-emerald-100 text-emerald-800',
}

export const PART_PAIEMENT_LABEL: Record<PartPaiementStatut, string> = {
  SANS_PART: 'Sans part',
  IMPAYE: 'Impayé',
  PAYE: 'Payé',
}

export function partPaiementLabel(
  part: 'patient' | 'assureur',
  status: PartPaiementStatut,
): string {
  if (status === 'SANS_PART') return part === 'patient' ? 'Sans part patient' : 'Sans part assureur'
  if (status === 'PAYE') return part === 'patient' ? 'Payé patient' : 'Payé assureur'
  return part === 'patient' ? 'Impayé patient' : 'Impayé assureur'
}

export const PART_PAIEMENT_CLASS: Record<PartPaiementStatut, string> = {
  SANS_PART: 'bg-gray-100 text-gray-500',
  IMPAYE: 'bg-orange-100 text-orange-800',
  PAYE: 'bg-emerald-100 text-emerald-800',
}
