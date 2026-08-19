/** Indicatifs supportés (Afrique francophone + Europe / US courants). */
export type PhoneCountry = {
  code: string
  name: string
  /** Chiffres sans « + » (ex. 237). */
  dial: string
  flag: string
  /** Longueur attendue de la partie nationale (si fixe). */
  nationalLength?: number
  /** Préfixe national obligatoire (ex. mobile CM : 6). */
  nationalStartsWith?: string
}

export const PHONE_COUNTRIES: PhoneCountry[] = [
  { code: "CM", name: "Cameroun", dial: "237", flag: "🇨🇲", nationalLength: 9, nationalStartsWith: "6" },
  { code: "SN", name: "Sénégal", dial: "221", flag: "🇸🇳", nationalLength: 9 },
  { code: "CI", name: "Côte d'Ivoire", dial: "225", flag: "🇨🇮", nationalLength: 10 },
  { code: "GA", name: "Gabon", dial: "241", flag: "🇬🇦", nationalLength: 8 },
  { code: "CD", name: "RD Congo", dial: "243", flag: "🇨🇩", nationalLength: 9 },
  { code: "CG", name: "Congo", dial: "242", flag: "🇨🇬", nationalLength: 9 },
  { code: "TG", name: "Togo", dial: "228", flag: "🇹🇬", nationalLength: 8 },
  { code: "BJ", name: "Bénin", dial: "229", flag: "🇧🇯", nationalLength: 8 },
  { code: "BF", name: "Burkina Faso", dial: "226", flag: "🇧🇫", nationalLength: 8 },
  { code: "ML", name: "Mali", dial: "223", flag: "🇲🇱", nationalLength: 8 },
  { code: "GN", name: "Guinée", dial: "224", flag: "🇬🇳", nationalLength: 9 },
  { code: "MG", name: "Madagascar", dial: "261", flag: "🇲🇬", nationalLength: 9 },
  { code: "FR", name: "France", dial: "33", flag: "🇫🇷", nationalLength: 9 },
  { code: "BE", name: "Belgique", dial: "32", flag: "🇧🇪", nationalLength: 9 },
  { code: "CH", name: "Suisse", dial: "41", flag: "🇨🇭", nationalLength: 9 },
  { code: "US", name: "États-Unis", dial: "1", flag: "🇺🇸", nationalLength: 10 },
]

const DEFAULT_COUNTRY = PHONE_COUNTRIES[0]!

export function digitsOnly(value: string): string {
  return value.replace(/\D/g, "")
}

function isValidNational(country: PhoneCountry, national: string): boolean {
  if (!national) return false
  if (country.nationalStartsWith && !national.startsWith(country.nationalStartsWith)) {
    return false
  }
  if (country.nationalLength != null) {
    return national.length === country.nationalLength
  }
  return national.length >= 6 && national.length <= 12
}

/** Pays dont l’indicatif (chiffres) correspond le mieux au numéro stocké. */
export function detectPhoneCountry(stored: string): PhoneCountry {
  const d = digitsOnly(stored)
  if (!d) return DEFAULT_COUNTRY
  const sorted = [...PHONE_COUNTRIES].sort((a, b) => b.dial.length - a.dial.length)
  for (const c of sorted) {
    if (!d.startsWith(c.dial)) continue
    const national = d.slice(c.dial.length)
    if (isValidNational(c, national) || national.length > 0) return c
  }
  return DEFAULT_COUNTRY
}

/**
 * Normalise un numéro mobile pour WhatsApp (E.164 sans « + »).
 * Accepte : partie nationale, 0…, indicatif + national, +indicatif…
 */
export function normalizeWhatsAppPhone(input: string): string | null {
  let d = digitsOnly(input.trim())
  if (!d) return null

  const sorted = [...PHONE_COUNTRIES].sort((a, b) => b.dial.length - a.dial.length)
  for (const c of sorted) {
    if (d.startsWith(c.dial)) {
      const national = d.slice(c.dial.length)
      if (isValidNational(c, national)) return `${c.dial}${national}`
      return null
    }
  }

  // Formats locaux Cameroun (défaut historique)
  const cm = DEFAULT_COUNTRY
  if (d.startsWith("0") && d.length === 10 && d[1] === "6") {
    return `${cm.dial}${d.slice(1)}`
  }
  if (d.length === 9 && d.startsWith("6")) {
    return `${cm.dial}${d}`
  }

  return null
}

export function isValidWhatsAppPhone(input: string): boolean {
  if (!input.trim()) return false
  return normalizeWhatsAppPhone(input) !== null
}

/** Affichage lisible : +237 6 90 93 10 10 */
export function formatWhatsAppPhoneDisplay(stored: string): string {
  const normalized = normalizeWhatsAppPhone(stored)
  if (!normalized) {
    const d = digitsOnly(stored)
    return d ? `+${d}` : stored
  }
  const country = detectPhoneCountry(normalized)
  const n = normalized.slice(country.dial.length)
  if (country.code === "CM" && n.length === 9) {
    return `+${country.dial} ${n[0]} ${n.slice(1, 3)} ${n.slice(3, 5)} ${n.slice(5, 7)} ${n.slice(7)}`
  }
  return `+${country.dial} ${n}`
}

export function whatsAppUrl(phone: string): string {
  const n = normalizeWhatsAppPhone(phone)
  return n ? `https://wa.me/${n}` : "#"
}

/** Partie nationale affichée dans le champ (sans indicatif). */
export function nationalPhonePart(stored: string): string {
  const normalized = normalizeWhatsAppPhone(stored)
  if (normalized) {
    const country = detectPhoneCountry(normalized)
    return normalized.slice(country.dial.length)
  }
  const d = digitsOnly(stored)
  const country = detectPhoneCountry(d)
  if (d.startsWith(country.dial)) return d.slice(country.dial.length)
  return d.replace(/^0/, "")
}

/** Construit un numéro normalisé à partir d’un indicatif et d’une saisie nationale. */
export function composeWhatsAppPhone(
  dialDigits: string,
  nationalRaw: string,
): string | null {
  const national = digitsOnly(nationalRaw).replace(/^0+/, "")
  if (!national) return null
  return normalizeWhatsAppPhone(`${dialDigits}${national}`)
}
