'use server'

import { prisma } from '@/lib/prisma'
import { requireUserId } from '@/lib/auth/session'
import { toSerializable } from '@/lib/json-bigint'

export type NotificationListItem = {
  id: string
  recipientId: string
  type: string
  message: string
  href: string | null
  entityType: string | null
  entityId: string | null
  readAt: string | null
  createdAt: string
}

export type ListMyNotificationsResult = {
  items: NotificationListItem[]
  total: number
  page: number
  pageSize: number
  unreadCount: number
}

function mapItem(row: {
  id: bigint
  readAt: Date | null
  notification: {
    id: bigint
    type: string
    message: string
    href: string | null
    entityType: string | null
    entityId: bigint | null
    createdAt: Date
  }
}): NotificationListItem {
  return {
    id: row.notification.id.toString(),
    recipientId: row.id.toString(),
    type: row.notification.type,
    message: row.notification.message,
    href: row.notification.href,
    entityType: row.notification.entityType,
    entityId: row.notification.entityId?.toString() ?? null,
    readAt: row.readAt?.toISOString() ?? null,
    createdAt: row.notification.createdAt.toISOString(),
  }
}

export async function countMyUnreadNotifications(): Promise<number> {
  const userId = await requireUserId()
  return prisma.notificationRecipient.count({
    where: { userId, readAt: null },
  })
}

export async function listMyNotifications(params?: {
  page?: number
  pageSize?: number
  onlyUnread?: boolean
}): Promise<ListMyNotificationsResult> {
  const userId = await requireUserId()
  const pageSize = Math.min(50, Math.max(1, params?.pageSize ?? 20))
  let page = Math.max(1, params?.page ?? 1)

  const where = {
    userId,
    ...(params?.onlyUnread ? { readAt: null } : {}),
  }

  const [total, unreadCount, rows] = await Promise.all([
    prisma.notificationRecipient.count({ where }),
    prisma.notificationRecipient.count({
      where: { userId, readAt: null },
    }),
    prisma.notificationRecipient.findMany({
      where,
      include: {
        notification: {
          select: {
            id: true,
            type: true,
            message: true,
            href: true,
            entityType: true,
            entityId: true,
            createdAt: true,
          },
        },
      },
      orderBy: { notification: { createdAt: 'desc' } },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ])

  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  if (page > totalPages) page = totalPages

  return toSerializable({
    items: rows.map(mapItem),
    total,
    page,
    pageSize,
    unreadCount,
  }) as ListMyNotificationsResult
}

export async function listMyRecentNotifications(
  limit = 10,
): Promise<{ items: NotificationListItem[]; unreadCount: number }> {
  const userId = await requireUserId()
  const take = Math.min(20, Math.max(1, limit))

  const [unreadCount, rows] = await Promise.all([
    prisma.notificationRecipient.count({
      where: { userId, readAt: null },
    }),
    prisma.notificationRecipient.findMany({
      where: { userId },
      include: {
        notification: {
          select: {
            id: true,
            type: true,
            message: true,
            href: true,
            entityType: true,
            entityId: true,
            createdAt: true,
          },
        },
      },
      orderBy: { notification: { createdAt: 'desc' } },
      take,
    }),
  ])

  return {
    items: rows.map(mapItem),
    unreadCount,
  }
}

export async function markNotificationRead(
  notificationId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    if (!/^\d+$/.test(notificationId)) {
      return { ok: false, error: 'Identifiant invalide.' }
    }
    const userId = await requireUserId()
    await prisma.notificationRecipient.updateMany({
      where: {
        userId,
        notificationId: BigInt(notificationId),
        readAt: null,
      },
      data: { readAt: new Date() },
    })
    return { ok: true }
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : 'Erreur',
    }
  }
}

export async function markAllNotificationsRead(): Promise<
  { ok: true; count: number } | { ok: false; error: string }
> {
  try {
    const userId = await requireUserId()
    const result = await prisma.notificationRecipient.updateMany({
      where: { userId, readAt: null },
      data: { readAt: new Date() },
    })
    return { ok: true, count: result.count }
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : 'Erreur',
    }
  }
}
