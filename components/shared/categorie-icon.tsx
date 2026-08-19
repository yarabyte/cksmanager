import {
  Activity,
  BedDouble,
  Eye,
  FlaskConical,
  Layers,
  Pill,
  ScanLine,
  Stethoscope,
  Syringe,
  type LucideIcon,
} from "lucide-react"
import { capitalizeFirstLetter } from "@/lib/formatting"

/** Retourne l'icône correspondant à une catégorie d'acte (par mots-clés du nom). */
export function getCategorieIcon(nom: string | null | undefined): LucideIcon {
  const n = (nom ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")

  if (n.includes("pharm")) return Pill
  if (n.includes("ophtalmo") || n.includes("oeil") || n.includes("optique")) return Eye
  if (n.includes("labo") || n.includes("analyse")) return FlaskConical
  if (n.includes("imagerie") || n.includes("radio") || n.includes("scanner") || n.includes("echograph"))
    return ScanLine
  if (n.includes("hotel") || n.includes("hospitalisation") || n.includes("chambre")) return BedDouble
  if (n.includes("kine") || n.includes("reeducation") || n.includes("reeduc")) return Activity
  if (n.includes("bloc") || n.includes("chirurg") || n.includes("operatoire")) return Syringe
  if (n.includes("consult")) return Stethoscope
  return Layers
}

/** Nom de catégorie en casse normalisée (première lettre majuscule, reste minuscule). */
export function formatCategorieLabel(nom: string | null | undefined): string {
  return capitalizeFirstLetter(nom ?? "")
}

export function CategorieIcon({
  nom,
  className,
}: {
  nom: string | null | undefined
  className?: string
}) {
  const Icon = getCategorieIcon(nom)
  return <Icon className={className} />
}
