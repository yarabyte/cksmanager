import { readFile } from 'fs/promises'
import { resolveUploadPath, uploadMimeType } from '@/lib/uploads'

export async function GET(_req: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const { path: segments } = await params
  const filePath = resolveUploadPath(segments)
  const mime = filePath ? uploadMimeType(filePath) : null
  if (!filePath || !mime) {
    return new Response('Not found', { status: 404 })
  }
  try {
    const data = await readFile(filePath)
    return new Response(new Uint8Array(data), {
      headers: {
        'Content-Type': mime,
        'Cache-Control': 'public, max-age=31536000, immutable',
        ...(mime === 'image/svg+xml' ? { 'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'" } : {}),
      },
    })
  } catch {
    return new Response('Not found', { status: 404 })
  }
}
