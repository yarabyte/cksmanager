import { mkdir, writeFile } from 'fs/promises'
import path from 'node:path'
import { randomUUID } from 'node:crypto'

const ALLOWED_TYPES = new Set([
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/svg+xml',
])
const MAX_BYTES = 2 * 1024 * 1024

function extForMime(mime: string): string {
  if (mime === 'image/png') return 'png'
  if (mime === 'image/jpeg') return 'jpg'
  if (mime === 'image/webp') return 'webp'
  return 'svg'
}

/** Téléversement du logo clinique vers /public/uploads/logos (servi en statique). */
export async function POST(req: Request) {
  try {
    const formData = await req.formData()
    const file = formData.get('file')
    if (!(file instanceof File) || file.size === 0) {
      return Response.json({ error: 'Fichier manquant' }, { status: 400 })
    }
    if (file.size > MAX_BYTES) {
      return Response.json(
        { error: 'Fichier trop volumineux (max 2 Mo)' },
        { status: 400 },
      )
    }
    if (!ALLOWED_TYPES.has(file.type)) {
      return Response.json(
        { error: 'Format non pris en charge (PNG, JPEG, WebP, SVG)' },
        { status: 400 },
      )
    }
    const ext = extForMime(file.type)
    const filename = `${randomUUID()}.${ext}`
    const dir = path.join(process.cwd(), 'public', 'uploads', 'logos')
    await mkdir(dir, { recursive: true })
    const buf = Buffer.from(await file.arrayBuffer())
    await writeFile(path.join(dir, filename), buf)
    const url = `/uploads/logos/${filename}`
    return Response.json({ url })
  } catch {
    return Response.json({ error: 'Échec du téléversement' }, { status: 500 })
  }
}
