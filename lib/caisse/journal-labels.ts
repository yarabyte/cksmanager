import { formatInAppTimezone } from "@/lib/timezone"

export const JOURNAL_PERIODE_OPTIONS = [
  { value: "today", label: "Aujourd'hui" },
  { value: "yesterday", label: "Hier" },
  { value: "week", label: "7 derniers jours" },
  { value: "last_week", label: "Semaine passée" },
  { value: "month", label: "Ce mois" },
  { value: "session", label: "Session en cours" },
  { value: "all", label: "Toutes les dates" },
  { value: "custom", label: "Personnalisé" },
] as const

function formatDateFr(iso: string) {
  return formatInAppTimezone(iso + "T12:00:00", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}

export function getJournalPeriodeLabel(
  value: string,
  dateFrom?: string,
  dateTo?: string,
) {
  if (value === "custom" && dateFrom) {
    const to = dateTo || dateFrom
    return dateFrom === to
      ? formatDateFr(dateFrom)
      : `${formatDateFr(dateFrom)} — ${formatDateFr(to)}`
  }
  return JOURNAL_PERIODE_OPTIONS.find((o) => o.value === value)?.label ?? value
}

export function buildJournalPrintUrl(filters: {
  periode: string
  dateFrom?: string
  dateTo?: string
}) {
  const params = new URLSearchParams({ periode: filters.periode })
  if (filters.periode === "custom" && filters.dateFrom) {
    params.set("dateFrom", filters.dateFrom)
    if (filters.dateTo) params.set("dateTo", filters.dateTo)
  }
  return `/caisse/journal/imprimer?${params.toString()}`
}
