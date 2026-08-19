'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  countMyUnreadNotifications,
  listMyNotifications,
  listMyRecentNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '@/app/actions/notifications'

const KEY = ['notifications'] as const

export function useRecentNotifications(enabled = true) {
  return useQuery({
    queryKey: [...KEY, 'recent'],
    queryFn: () => listMyRecentNotifications(10),
    enabled,
    refetchInterval: 30_000,
    staleTime: 10_000,
  })
}

export function useUnreadNotificationsCount(enabled = true) {
  return useQuery({
    queryKey: [...KEY, 'unread-count'],
    queryFn: () => countMyUnreadNotifications(),
    enabled,
    refetchInterval: 30_000,
    staleTime: 10_000,
  })
}

export function useNotificationsList(params?: {
  page?: number
  pageSize?: number
  onlyUnread?: boolean
}) {
  return useQuery({
    queryKey: [...KEY, 'list', params ?? {}],
    queryFn: () => listMyNotifications(params),
  })
}

export function useNotificationMutations() {
  const qc = useQueryClient()
  const invalidate = () =>
    void qc.invalidateQueries({ queryKey: [...KEY] })

  return {
    markRead: useMutation({
      mutationFn: markNotificationRead,
      onSuccess: invalidate,
    }),
    markAllRead: useMutation({
      mutationFn: markAllNotificationsRead,
      onSuccess: invalidate,
    }),
  }
}
