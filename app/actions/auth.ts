'use server'

import { getCurrentUser } from '@/lib/auth/session'

/** Id utilisateur courant (string) pour les gardes UI client. */
export async function getAuthUserId(): Promise<string | null> {
  const user = await getCurrentUser()
  return user ? user.id.toString() : null
}
