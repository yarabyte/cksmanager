import {
  getWasenderApiKey,
  getWasenderBaseUrl,
  WASENDER_REQUEST_TIMEOUT_MS,
} from '@/lib/whatsapp/config'
import type { WhatsAppSendResult, WhatsAppUploadResult } from '@/lib/whatsapp/types'

function authHeaders(json = true): HeadersInit {
  const apiKey = getWasenderApiKey()
  if (!apiKey) throw new Error('WASENDER_API_KEY manquant.')
  return {
    Authorization: `Bearer ${apiKey}`,
    ...(json ? { 'Content-Type': 'application/json' } : {}),
  }
}

async function parseJsonSafe(res: Response): Promise<unknown> {
  try {
    return await res.json()
  } catch {
    return { raw: await res.text() }
  }
}

function extractError(body: unknown, fallback: string): string {
  if (body && typeof body === 'object') {
    const o = body as Record<string, unknown>
    if (typeof o.error === 'string') return o.error
    if (typeof o.message === 'string') return o.message
  }
  return fallback
}

const RATE_LIMIT_PATTERN = /1 message every 5 seconds/i
const RATE_LIMIT_RETRY_DELAY_MS = 5500
const RATE_LIMIT_MAX_ATTEMPTS = 3

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function isRateLimitError(error: string | undefined): boolean {
  return Boolean(error && RATE_LIMIT_PATTERN.test(error))
}

async function withRateLimitRetry<T extends { success: boolean; error?: string }>(
  send: () => Promise<T>,
): Promise<T> {
  let last: T | undefined
  for (let attempt = 0; attempt < RATE_LIMIT_MAX_ATTEMPTS; attempt++) {
    const result = await send()
    last = result
    if (result.success || !isRateLimitError(result.error)) {
      return result
    }
    if (attempt < RATE_LIMIT_MAX_ATTEMPTS - 1) {
      await sleep(RATE_LIMIT_RETRY_DELAY_MS)
    }
  }
  return last!
}

/** Format E.164 pour Wasender (ex. +237690931010). */
export function formatPhoneForWasender(storedPhone: string): string {
  const digits = storedPhone.replace(/\D/g, '')
  return digits.startsWith('+') ? digits : `+${digits}`
}

export async function sendTextMessage(to: string, text: string): Promise<WhatsAppSendResult> {
  return withRateLimitRetry(async () => {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), WASENDER_REQUEST_TIMEOUT_MS)
    try {
      const res = await fetch(`${getWasenderBaseUrl()}/api/send-message`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ to, text }),
        signal: controller.signal,
      })
      const body = await parseJsonSafe(res)
      if (!res.ok) {
        return { success: false, error: extractError(body, `HTTP ${res.status}`), raw: body }
      }
      const messageId =
        body && typeof body === 'object' && 'data' in body
          ? String((body as { data?: { id?: string } }).data?.id ?? '')
          : undefined
      return { success: true, messageId: messageId || undefined, raw: body }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Erreur réseau Wasender'
      return { success: false, error: msg }
    } finally {
      clearTimeout(timer)
    }
  })
}

export async function uploadPdfBuffer(buffer: Buffer): Promise<WhatsAppUploadResult> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), WASENDER_REQUEST_TIMEOUT_MS)
  try {
    const apiKey = getWasenderApiKey()
    if (!apiKey) return { success: false, error: 'WASENDER_API_KEY manquant.' }

    const res = await fetch(`${getWasenderBaseUrl()}/api/upload`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/pdf',
      },
      body: new Uint8Array(buffer),
      signal: controller.signal,
    })
    const body = await parseJsonSafe(res)
    if (!res.ok) {
      return { success: false, error: extractError(body, `HTTP ${res.status}`) }
    }
    const publicUrl =
      body && typeof body === 'object' && 'publicUrl' in body
        ? String((body as { publicUrl?: string }).publicUrl ?? '')
        : ''
    if (!publicUrl) {
      return { success: false, error: 'Réponse upload sans publicUrl' }
    }
    return { success: true, publicUrl }
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Erreur upload Wasender'
    return { success: false, error: msg }
  } finally {
    clearTimeout(timer)
  }
}

export async function sendDocumentMessage(input: {
  to: string
  text: string
  documentUrl: string
  fileName: string
}): Promise<WhatsAppSendResult> {
  return withRateLimitRetry(async () => {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), WASENDER_REQUEST_TIMEOUT_MS)
    try {
      const res = await fetch(`${getWasenderBaseUrl()}/api/send-message`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          to: input.to,
          text: input.text,
          documentUrl: input.documentUrl,
          fileName: input.fileName,
        }),
        signal: controller.signal,
      })
      const body = await parseJsonSafe(res)
      if (!res.ok) {
        return { success: false, error: extractError(body, `HTTP ${res.status}`), raw: body }
      }
      return { success: true, raw: body }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Erreur réseau Wasender'
      return { success: false, error: msg }
    } finally {
      clearTimeout(timer)
    }
  })
}
