import { useMutation, useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/core/query/keys'
import { notificationsApi } from './notifications.api'

export const MAX_NOTIFICATIONS = 20

export const useNotificationsUnreadCountQuery = (enabled = true) =>
  useQuery({
    queryKey: queryKeys.notifications.unreadCount(),
    queryFn: () => notificationsApi.unreadCount(),
    enabled,
    refetchInterval: enabled ? 30_000 : false,
  })

export const useNotificationsListQuery = (enabled = true) =>
  useQuery({
    queryKey: queryKeys.notifications.list({ page: 1, limit: MAX_NOTIFICATIONS }),
    queryFn: () => notificationsApi.list({ page: 1, limit: MAX_NOTIFICATIONS }),
    enabled,
    refetchInterval: enabled ? 30_000 : false,
  })

export const useMarkNotificationReadMutation = () =>
  useMutation({
    mutationFn: (id: string) => notificationsApi.markRead(id),
  })

export const useMarkAllNotificationsReadMutation = () =>
  useMutation({
    mutationFn: () => notificationsApi.markAllRead(),
  })
