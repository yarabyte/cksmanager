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
  } catch {
    return NextResponse.json(
      { ok: false, error: 'Erreur lors de la connexion.' },
      { status: 500 },
    )
  }
}
