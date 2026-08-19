export type WhatsAppEventType =
  | 'WALLET_RECHARGE'
  | 'ENCAISSEMENT'
  | 'RETOUR_PHARMACIE'
  | 'CAISSE_CLOTURE'

export type WhatsAppLogStatus = 'SENT' | 'FAILED' | 'SKIPPED'

export type WhatsAppSendResult = {
  success: boolean
  messageId?: string
  raw?: unknown
  error?: string
}

export type WhatsAppUploadResult = {
  success: boolean
  publicUrl?: string
  error?: string
}
