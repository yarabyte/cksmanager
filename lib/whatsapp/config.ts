const DEFAULT_BASE_URL = 'https://www.wasenderapi.com'

export function isWhatsAppNotificationsEnabled(): boolean {
  return process.env.WHATSAPP_NOTIFICATIONS_ENABLED === 'true'
}

export function getWasenderApiKey(): string | null {
  const key = process.env.WASENDER_API_KEY?.trim()
  return key || null
}

export function getWasenderBaseUrl(): string {
  return (process.env.WASENDER_API_BASE_URL?.trim() || DEFAULT_BASE_URL).replace(/\/$/, '')
}

export function getWhatsAppClinicNameFallback(): string | null {
  const name = process.env.WHATSAPP_CLINIC_NAME?.trim()
  return name || null
}

export const WASENDER_REQUEST_TIMEOUT_MS = 15_000
