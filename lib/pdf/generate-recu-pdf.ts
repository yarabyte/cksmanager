import { renderToBuffer } from '@react-pdf/renderer'
import { RecuPdfDocument } from '@/lib/pdf/recu-pdf-document'
import type { EncaissementRecuDetail } from '@/lib/types/caisse'

export async function generateRecuPdfBuffer(recu: EncaissementRecuDetail): Promise<Buffer> {
  const element = RecuPdfDocument({ recu })
  const buffer = await renderToBuffer(element)
  return Buffer.from(buffer)
}
