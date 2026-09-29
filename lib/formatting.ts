import type { VisiteStatus, FactureStatus, Role } from "./types"
import { formatInAppTimezone } from "./timezone"

/** Affichage numéro de facture avec préfixe # (stocké sans # en base). */
export function formatFactureNumero(numero: string): string {
  if (!numero) return "—"
  return numero.startsWith("#") ? numero : `#${numero}`
}

// Date formatting — fuseau Africa/Douala (GMT+1)
export function formatDate(dateString: string): string {
  return formatInAppTimezone(dateString, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })
}

export function formatDateTime(dateString: string): string {
  return formatInAppTimezone(dateString, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export function formatTime(dateString: string): string {
  return formatInAppTimezone(dateString, {
    hour: "2-digit",
    minute: "2-digit",
  })
}

export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return "À l'instant"
  if (diffMins < 60) return `Il y a ${diffMins} min`
  if (diffHours < 24) return `Il y a ${diffHours}h`
  if (diffDays < 7) return `Il y a ${diffDays} jour${diffDays > 1 ? "s" : ""}`
  return formatDate(dateString)
}

/** Première lettre en majuscule, reste en minuscules (affichage titres). */
export function capitalizeFirstLetter(value: string): string {
  const trimmed = value.trim()
  if (!trimmed) return trimmed
  return trimmed.charAt(0).toLocaleUpperCase("fr-FR") + trimmed.slice(1).toLocaleLowerCase("fr-FR")
}

// Currency formatting (CFA Franc)
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "decimal",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount) + " FCFA"
}

export function formatCurrencyCompact(amount: number): string {
  if (amount >= 1000000) {
    return (amount / 1000000).toFixed(1).replace(".", ",") + " M"
  }
  if (amount >= 1000) {
    return (amount / 1000).toFixed(0) + " K"
  }
  return amount.toString()
}

// Status badge colors and labels
export function getVisiteStatusConfig(status: VisiteStatus): {
  label: string
  variant: "default" | "secondary" | "outline" | "destructive"
  className: string
} {
  switch (status) {
    case "En attente":
      return {
        label: "En attente",
        variant: "secondary",
        className: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
      }
    case "En consultation":
      return {
        label: "En consultation",
        variant: "default",
        className: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
      }
    case "Terminée":
      return {
        label: "Terminée",
        variant: "outline",
        className: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
      }
    case "Facturée":
      return {
        label: "Facturée",
        variant: "default",
        className: "bg-primary/10 text-primary dark:bg-primary/20",
      }
    default:
      return {
        label: status,
        variant: "secondary",
        className: "",
      }
  }
}

export function getFactureStatusConfig(status: FactureStatus): {
  label: string
  variant: "default" | "secondary" | "outline" | "destructive"
  className: string
} {
  switch (status) {
    case "Payée":
      return {
        label: "Payée",
        variant: "default",
        className: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
      }
    case "Partielle":
      return {
        label: "Partielle",
        variant: "secondary",
        className: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
      }
    case "Impayée":
      return {
        label: "Impayée",
        variant: "destructive",
        className: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
      }
    case "En attente assureur":
      return {
        label: "Attente assureur",
        variant: "outline",
        className: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
      }
    default:
      return {
        label: status,
        variant: "secondary",
        className: "",
      }
  }
}

export function getRoleConfig(role: Role): {
  label: string
  className: string
} {
  switch (role) {
    case "Admin":
      return {
        label: "Admin",
        className: "bg-[#cd3b86]/10 text-[#b8307a] border border-[#cd3b86]/20",
      }
    case "Manager":
      return {
        label: "Manager",
        className: "bg-violet-50 text-violet-700 border border-violet-200",
      }
    case "Médecin":
      return {
        label: "Médecin",
        className: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
      }
    case "Front Office":
      return {
        label: "Front Office",
        className: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
      }
    case "Caisse":
      return {
        label: "Caisse",
        className: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
      }
    case "Pharmacie":
      return {
        label: "Pharmacie",
        className: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400",
      }
    case "Commis Pharmacie":
      return {
        label: "Commis Pharmacie",
        className: "bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-400",
      }
    case "Sage femme":
      return {
        label: "Sage femme",
        className: "bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400",
      }
    default:
      return {
        label: role,
        className: "",
      }
  }
}

// Calculate age from birthDate
export function calculateAge(birthDate: string): number {
  const today = new Date()
  const birth = new Date(birthDate)
  let age = today.getFullYear() - birth.getFullYear()
  const monthDiff = today.getMonth() - birth.getMonth()
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--
  }
  
  return age
}

// Format patient full name
export function formatPatientName(firstName: string, lastName: string): string {
  return `${lastName.toUpperCase()} ${firstName}`
}

/**
 * Identité affichée : pour une patiente, ajoute le nom de jeune fille s’il est renseigné.
 * sexe : 1 = masculin, 2 = féminin (aligné sur le référentiel patients).
 */
export function formatPatientIdentityLine(
  patName: string,
  patSurname: string,
  sexe: number,
  nomJeuneFille?: string | null,
): string {
  const base = formatPatientName(patName, patSurname)
  if (sexe === 2 && nomJeuneFille?.trim()) {
    return `${base} (née ${nomJeuneFille.trim().toUpperCase()})`
  }
  return base
}

// Generate initials
export function getInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
}

/**
 * Date de naissance + âge calculé à jour, ex. "01/01/1990 (35 ans)".
 * Retourne null si la date est absente.
 */
export function formatBirthAge(dob?: string | null): string | null {
  if (!dob) return null
  const age = calculateAge(dob)
  return `${formatDate(dob)} (${age} an${age > 1 ? "s" : ""})`
}
