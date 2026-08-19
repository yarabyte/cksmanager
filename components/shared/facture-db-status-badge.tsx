import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { FactureStatut } from "@/lib/types/facture"
import type { FactureSuiviAssureur } from "@/lib/types/bordereau"
import {
  PAIEMENT_GLOBAL_CLASS,
  PAIEMENT_GLOBAL_LABEL,
  PART_PAIEMENT_CLASS,
  partPaiementLabel,
  resolveFacturePaiementStatus,
  type FacturePaiementGlobal,
  type PartPaiementStatut,
} from "@/lib/facture/paiement-status"

const config: Record<FactureStatut, { label: string; className: string }> = {
  BROUILLON: { label: "Brouillon", className: "bg-gray-100 text-gray-700" },
  CONFIRMEE: { label: "Confirmée", className: "bg-blue-100 text-blue-800" },
  PAYEE: { label: "Payée", className: "bg-emerald-100 text-emerald-800" },
}

/** Badge statut DB brut (liste, etc.). */
export function FactureDbStatusBadge({
  status,
  className,
}: {
  status: FactureStatut
  className?: string
}) {
  const c = config[status] ?? config.BROUILLON
  return (
    <Badge variant="secondary" className={cn("font-medium", c.className, className)}>
      {c.label}
    </Badge>
  )
}

/** Badge paiement global : payé patient / payé assureur / totalement payé. */
export function FacturePaiementGlobalBadge({
  status,
  className,
}: {
  status: FacturePaiementGlobal
  className?: string
}) {
  return (
    <Badge
      variant="secondary"
      className={cn("font-medium", PAIEMENT_GLOBAL_CLASS[status], className)}
    >
      {PAIEMENT_GLOBAL_LABEL[status]}
    </Badge>
  )
}

export function FacturePartPaiementBadge({
  part,
  status,
  className,
}: {
  part: "patient" | "assureur"
  status: PartPaiementStatut
  className?: string
}) {
  return (
    <Badge
      variant="secondary"
      className={cn("font-medium text-[10px]", PART_PAIEMENT_CLASS[status], className)}
    >
      {partPaiementLabel(part, status)}
    </Badge>
  )
}

export function FacturePaiementBadges({
  statut,
  montantPatient,
  montantAssurance,
  suiviAssureur,
  className,
}: {
  statut: FactureStatut
  montantPatient: number
  montantAssurance: number
  suiviAssureur: FactureSuiviAssureur | null
  className?: string
}) {
  const paiement = resolveFacturePaiementStatus({
    statut,
    montantPatient,
    montantAssurance,
    suiviAssureur,
  })

  return (
    <span className={cn("inline-flex flex-wrap items-center gap-1.5", className)}>
      <FacturePaiementGlobalBadge status={paiement.global} />
      {paiement.hasPartPatient && (
        <FacturePartPaiementBadge part="patient" status={paiement.patient} />
      )}
      {paiement.hasPartAssureur && (
        <FacturePartPaiementBadge part="assureur" status={paiement.assureur} />
      )}
    </span>
  )
}
