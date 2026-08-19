import { prisma } from '@/lib/prisma'
import { mapLegacyRoleStringToAppRoles } from '@/lib/user-role'
import {
  NOTIFICATION_ROLES,
  type NotificationType,
} from '@/lib/notifications/roles-map'

export type NotifyEventInput = {
  type: NotificationType
  message: string
  href?: string | null
  entityType?: string | null
  entityId?: bigint | string | number | null
  actorUserId?: bigint | string | number | null
}

function toBigIntOrNull(
  v: bigint | string | number | null | undefined,
): bigint | null {
  if (v == null || v === '') return null
  try {
    return typeof v === 'bigint' ? v : BigInt(v)
  } catch {
    return null
  }
}

/**
 * Crée une notification et des destinataires selon le mapping de rôles.
 * N’échoue jamais l’appelant : erreurs loguées seulement.
 */
export async function notifyEvent(input: NotifyEventInput): Promise<void> {
  try {
    const roles = NOTIFICATION_ROLES[input.type]
    if (!roles?.length) return

    const actorUserId = toBigIntOrNull(input.actorUserId)
    const entityId = toBigIntOrNull(input.entityId)
    const message = input.message.trim().slice(0, 500)
    if (!message) return

    const users = await prisma.user.findMany({
      where: { actif: true },
      select: { id: true, role: true },
    })

    const roleSet = new Set(roles)
    const recipientIds = users
      .filter((u) => {
        if (actorUserId != null && u.id === actorUserId) return false
        const appRoles = mapLegacyRoleStringToAppRoles(u.role)
        return appRoles.some((r) => roleSet.has(r))
      })
      .map((u) => u.id)

    if (recipientIds.length === 0) return

    await prisma.notification.create({
      data: {
        type: input.type,
        message,
        href: input.href?.trim() || null,
        entityType: input.entityType ?? null,
        entityId,
        actorUserId,
        recipients: {
          createMany: {
            data: recipientIds.map((userId) => ({ userId })),
            skipDuplicates: true,
          },
        },
      },
    })
  } catch (e) {
    console.error('[notifications] notifyEvent failed:', e)
  }
}

/** Variante fire-and-forget pour les actions serveur. */
export function notifyEventAsync(input: NotifyEventInput): void {
  void notifyEvent(input)
}
