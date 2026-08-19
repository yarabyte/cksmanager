import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { BordereauStatut, FactureSuiviAssureurStatut } from "@/lib/types/bordereau"

const bordereauConfig: Record<BordereauStatut, { label: string; className: string }> = {
  BROUILLON: { label: "Brouillon", className: "bg-gray-100 text-gray-700" },
  DEPOSE: { label: "Déposé", className: "bg-amber-100 text-amber-800" },
  PAYE: { label: "Payé", className: "bg-emerald-100 text-emerald-800" },
}

const suiviConfig: Record<FactureSuiviAssureurStatut, { label: string; className: string }> = {
  A_DEPOSER: { label: "À déposer", className: "bg-orange-100 text-orange-800" },
  EN_BORDEREAU: { label: "En bordereau", className: "bg-blue-100 text-blue-800" },
  DEPOSE: { label: "Déposé", className: "bg-amber-100 text-amber-800" },
  PAYE: { label: "Payé assureur", className: "bg-emerald-100 text-emerald-800" },
}

export function BordereauStatusBadge({
  status,
  className,
}: {
  status: BordereauStatut
  className?: string
}) {
  const c = bordereauConfig[status] ?? bordereauConfig.BROUILLON
  return (
    <Badge variant="secondary" className={cn("font-medium", c.className, className)}>
      {c.label}
    </Badge>
  )
}

export function SuiviAssureurBadge({
  status,
  className,
}: {
  status: FactureSuiviAssureurStatut
  className?: string
}) {
  const c = suiviConfig[status] ?? suiviConfig.A_DEPOSER
  return (
    <Badge variant="secondary" className={cn("font-medium", c.className, className)}>
      {c.label}
    </Badge>
  )
}
