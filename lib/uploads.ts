import path from 'node:path'

/**
 * Next.js ne sert que les fichiers de public/ présents au build : les fichiers téléversés
 * sont relus par app/uploads/[...path]/route.ts. En production, UPLOADS_DIR doit pointer
 * vers un volume persistant, sinon les fichiers disparaissent à chaque redéploiement.
 */
export function uploadsRootDir(): string {
  const configured = process.env.UPLOADS_DIR?.trim()
  return configured ? path.resolve(configured) : path.join(process.cwd(), 'public', 'uploads')
}

/** Chemin absolu sous le dossier des téléversements, ou null si le chemin en sort. */
export function resolveUploadPath(segments: string[]): string | null {
  const root = uploadsRootDir()
  const target = path.resolve(root, ...segments)
  if (target !== root && target.startsWith(root + path.sep)) return target
  return null
}

const MIME_BY_EXT: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
}

export function uploadMimeType(filePath: string): string | null {
  return MIME_BY_EXT[path.extname(filePath).toLowerCase()] ?? null
}
