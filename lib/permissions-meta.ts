import type { LucideIcon } from "lucide-react"
import {
  LayoutDashboard,
  Users,
  Stethoscope,
  ClipboardList,
  Receipt,
  Pill,
  Wallet,
  Settings,
  Eye,
  Plus,
  Pencil,
  Trash2,
} from "lucide-react"
import type { Action, Module } from "@/lib/types"

export const MODULE_META: Record<
  Module,
  { label: string; description: string; icon: LucideIcon; color: string }
> = {
  dashboard: {
    label: "Tableau de bord",
    description: "Indicateurs et synthèse d'activité",
    icon: LayoutDashboard,
    color: "#6366f1",
  },
  patients: {
    label: "Patients",
    description: "Dossiers, identité et parcours patient",
    icon: Users,
    color: "#cd3b86",
  },
  visites: {
    label: "Visites",
    description: "Consultations et feuilles de circulation",
    icon: Stethoscope,
    color: "#3b82f6",
  },
  prescriptions: {
    label: "Prescriptions",
    description: "Prescriptions medicales et circuit produit",
    icon: ClipboardList,
    color: "#f97316",
  },
  facturation: {
    label: "Facturation",
    description: "Factures, devis et encaissements",
    icon: Receipt,
    color: "#f59e0b",
  },
  pharmacie: {
    label: "Pharmacie",
    description: "Stock, produits et dispensation",
    icon: Pill,
    color: "#06b6d4",
  },
  caisse: {
    label: "Caisse",
    description: "Sessions, encaissements et versements",
    icon: Wallet,
    color: "#10b981",
  },
  configuration: {
    label: "Configuration",
    description: "Référentiels et paramètres système",
    icon: Settings,
    color: "#8b5cf6",
  },
}

export const ACTION_META: Record<
  Action,
  { label: string; short: string; icon: LucideIcon }
> = {
  view: { label: "Voir", short: "Lecture", icon: Eye },
  create: { label: "Créer", short: "Création", icon: Plus },
  edit: { label: "Modifier", short: "Édition", icon: Pencil },
  delete: { label: "Supprimer", short: "Suppression", icon: Trash2 },
}
