import { NextResponse } from 'next/server'
import { authenticateUser } from '@/lib/auth/credentials'

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { email?: string; password?: string }
    const email = body.email?.trim()
    const password = body.password

    if (!email || !password) {
      return NextResponse.json(
        { ok: false, error: 'Email et mot de passe requis.' },
        { status: 400 },
      )
    }

    const result = await authenticateUser(email, password)
    if (!result.ok) {
      return NextResponse.json(result, { status: 401 })
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[auth/login]', error)
    const message = error instanceof Error ? error.message : ''
    if (message.includes('AUTH_SECRET')) {
      return NextResponse.json(
        { ok: false, error: 'AUTH_SECRET manquant sur le serveur.' },
        { status: 500 },
      )
    }
    const code =
      typeof error === 'object' && error !== null && 'code' in error
        ? String((error as { code?: string }).code)
        : ''
    if (code.startsWith('P1') || code === 'P2021' || code === 'P2022') {
      return NextResponse.json(
        {
          ok: false,
          error: 'Base de données inaccessible ou non initialisée (migrations).',
        },
        { status: 500 },
      )
    }
    return NextResponse.json(
      { ok: false, error: 'Erreur lors de la connexion.' },
      { status: 500 },
    )
  }
}
