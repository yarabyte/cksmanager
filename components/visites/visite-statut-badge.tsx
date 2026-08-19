import { Badge } from "@/components/ui/badge"

export type VisiteStatut = "EN_ATTENTE" | "EN_COURS" | "TERMINEE" | "FACTUREE"

export const STATUT_CONFIG: Record<
  VisiteStatut,
  {
    label: string
    dot: string
    badgeClass: string
    colBorder: string
    colBg: string
    colHeader: string
  }
> = {
  EN_ATTENTE: {
    label: "En attente",
    dot: "bg-amber-400",
    badgeClass: "bg-amber-50 text-amber-700 border-amber-200",
    colBorder: "border-t-amber-400",
    colBg: "bg-amber-50/40",
    colHeader: "text-amber-700",
  },
  EN_COURS: {
    label: "En consultation",
    dot: "bg-blue-500",
    badgeClass: "bg-blue-50 text-blue-700 border-blue-200",
    colBorder: "border-t-blue-500",
    colBg: "bg-blue-50/40",
    colHeader: "text-blue-700",
  },
  TERMINEE: {
    label: "Terminée",
    dot: "bg-emerald-500",
    badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
    colBorder: "border-t-emerald-500",
    colBg: "bg-emerald-50/30",
    colHeader: "text-emerald-700",
  },
  FACTUREE: {
    label: "Facturé",
    dot: "bg-[#cd3b86]",
    badgeClass: "bg-pink-50 text-pink-700 border-pink-200",
    colBorder: "border-t-[#cd3b86]",
    colBg: "bg-pink-50/30",
    colHeader: "text-[#cd3b86]",
  },
}

export const ALL_STATUTS: VisiteStatut[] = [
  "EN_ATTENTE",
  "FACTUREE",
  "EN_COURS",
  "TERMINEE",
]

export function VisiteStatutBadge({ statut }: { statut: string }) {
  const cfg = STATUT_CONFIG[statut as VisiteStatut]
  if (!cfg) return <Badge variant="outline" className="text-xs">{statut}</Badge>
  return (
    <Badge variant="outline" className={`text-xs font-medium ${cfg.badgeClass}`}>
      <span className={`mr-1.5 inline-block h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </Badge>
  )
}
