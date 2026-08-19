/** Fuseau horaire de la clinique (Douala, Cameroun — UTC+1, sans heure d'été). */
export const APP_TIMEZONE = "Africa/Douala"
export const APP_LOCALE = "fr-FR"

type ZonedParts = {
  year: number
  month: number
  day: number
  hour: number
  minute: number
}

function pad2(n: number) {
  return String(n).padStart(2, "0")
}

export function getZonedParts(date: Date, timeZone = APP_TIMEZONE): ZonedParts {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date)

  const num = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((p) => p.type === type)?.value ?? 0)

  const hour = num("hour")
  return {
    year: num("year"),
    month: num("month"),
    day: num("day"),
    hour: hour === 24 ? 0 : hour,
    minute: num("minute"),
  }
}

/** Convertit une date/heure « murale » Douala en instant UTC (UTC+1 fixe). */
export function zonedDateTimeToUtc(
  year: number,
  month: number,
  day: number,
  hour = 0,
  minute = 0,
  second = 0,
  ms = 0,
): Date {
  return new Date(Date.UTC(year, month - 1, day, hour - 1, minute, second, ms))
}

export function parseDoualaIsoDate(iso: string): Date | undefined {
  const match = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!match) return undefined
  return zonedDateTimeToUtc(+match[1], +match[2], +match[3], 0, 0, 0, 0)
}

/** yyyy-MM-ddTHH:mm en heure locale Douala. */
export function getDoualaDateTimeLocalValue(date = new Date()): string {
  const p = getZonedParts(date)
  return `${p.year}-${pad2(p.month)}-${pad2(p.day)}T${pad2(p.hour)}:${pad2(p.minute)}`
}

/** Parse yyyy-MM-ddTHH:mm interprété comme heure Douala → UTC. */
export function parseDoualaDateTimeLocal(value: string): Date {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/)
  if (!match) return new Date(NaN)
  const [, ys, ms, ds, hs, mins] = match
  return zonedDateTimeToUtc(+ys, +ms, +ds, +hs, +mins)
}

export function toDoualaIsoDate(date = new Date()): string {
  const p = getZonedParts(date)
  return `${p.year}-${pad2(p.month)}-${pad2(p.day)}`
}

export function shiftDoualaDays(reference: Date, days: number): Date {
  const p = getZonedParts(reference)
  const anchor = zonedDateTimeToUtc(p.year, p.month, p.day, 12, 0)
  anchor.setUTCDate(anchor.getUTCDate() + days)
  return anchor
}

export function startOfDayDouala(reference = new Date()): Date {
  const p = getZonedParts(reference)
  return zonedDateTimeToUtc(p.year, p.month, p.day, 0, 0, 0, 0)
}

export function endOfDayDouala(reference = new Date()): Date {
  const p = getZonedParts(reference)
  return zonedDateTimeToUtc(p.year, p.month, p.day, 23, 59, 59, 999)
}

export function startOfWeekDouala(reference = new Date()): Date {
  const p = getZonedParts(reference)
  const midday = zonedDateTimeToUtc(p.year, p.month, p.day, 12, 0)
  const weekday = new Intl.DateTimeFormat("en-US", {
    timeZone: APP_TIMEZONE,
    weekday: "short",
  }).format(midday)
  const map: Record<string, number> = {
    Mon: 0,
    Tue: 1,
    Wed: 2,
    Thu: 3,
    Fri: 4,
    Sat: 5,
    Sun: 6,
  }
  const diff = map[weekday] ?? 0
  return startOfDayDouala(shiftDoualaDays(midday, -diff))
}

export function formatInAppTimezone(
  date: Date | string,
  options: Intl.DateTimeFormatOptions,
): string {
  const d = typeof date === "string" ? new Date(date) : date
  if (Number.isNaN(d.getTime())) return "—"
  return new Intl.DateTimeFormat(APP_LOCALE, {
    timeZone: APP_TIMEZONE,
    ...options,
  }).format(d)
}
