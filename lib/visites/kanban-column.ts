import { toDoualaIsoDate } from "@/lib/timezone"
import type { VisiteStatut } from "@/components/visites/visite-statut-badge"

/** Ordre des colonnes kanban (distinct du tri des filtres génériques). */
export const KANBAN_STATUTS: VisiteStatut[] = [
  "EN_ATTENTE",
  "FACTUREE",
  "EN_COURS",
  "TERMINEE",
]

export type VisiteKanbanInput = {
  statut: string
  dateVisite: string
  motifLibelle?: string | null
  /** True si une fiche ParametrePatient existe pour cette visite. */
  parametresPatientRemplis?: boolean
}

/** Heuristique hospitalisation (motif) — à affiner quand le module sera disponible. */
export function isVisiteHospitalisation(visite: VisiteKanbanInput): boolean {
  const m = (visite.motifLibelle ?? "").toLowerCase()
  return m.includes("hospital") || m.includes("héberg") || m.includes("heberg")
}

/** Vrai à partir du lendemain calendaire de la visite (fuseau Douala). */
export function isApresJourVisite(dateVisiteIso: string, reference = new Date()): boolean {
  const visitDay = toDoualaIsoDate(new Date(dateVisiteIso))
  const today = toDoualaIsoDate(reference)
  return today > visitDay
}

/**
 * Visite éligible à la colonne « Terminée » :
 * lendemain du jour de visite atteint, sans hospitalisation.
 */
export function isVisiteTermineeKanban(visite: VisiteKanbanInput, reference = new Date()): boolean {
  if (isVisiteHospitalisation(visite)) return false
  return isApresJourVisite(visite.dateVisite, reference)
}

/** Vrai si une fiche paramètres patient a été saisie pour la visite. */
export function hasParametresPatientRemplis(visite: VisiteKanbanInput): boolean {
  return visite.parametresPatientRemplis === true
}

/** Colonne kanban d'affichage (priorité stricte, une visite = une colonne). */
export function resolveKanbanColumn(
  visite: VisiteKanbanInput,
  reference = new Date(),
): VisiteStatut {
  if (visite.statut === "EN_ATTENTE") return "EN_ATTENTE"
  if (visite.statut === "FACTUREE") return "FACTUREE"

  if (
    visite.statut === "EN_COURS" &&
    hasParametresPatientRemplis(visite) &&
    !isVisiteTermineeKanban(visite, reference)
  ) {
    return "EN_COURS"
  }

  if (
    visite.statut === "TERMINEE" ||
    isVisiteTermineeKanban(visite, reference)
  ) {
    return "TERMINEE"
  }

  if (visite.statut === "EN_COURS" && hasParametresPatientRemplis(visite)) {
    return "EN_COURS"
  }

  return (visite.statut as VisiteStatut) in KANBAN_STATUTS
    ? (visite.statut as VisiteStatut)
    : "TERMINEE"
}

export function groupVisitesByKanbanColumn<T extends VisiteKanbanInput>(
  visites: T[],
  reference = new Date(),
): Record<VisiteStatut, T[]> {
  const grouped: Record<VisiteStatut, T[]> = {
    EN_ATTENTE: [],
    FACTUREE: [],
    EN_COURS: [],
    TERMINEE: [],
  }
  for (const v of visites) {
    grouped[resolveKanbanColumn(v, reference)].push(v)
  }
  return grouped
}
