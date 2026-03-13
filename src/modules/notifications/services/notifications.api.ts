import type { ApiMeta, ApiQueryValue } from '@/core/api/http'
import { apiRequest, toQueryString } from '@/core/api/http'
import { mapMeta, mapNotification } from '@/core/api/mappers'
import type { Notification } from '@/lib/types'

export const notificationsApi = {
  list(query?: Record<string, ApiQueryValue>) {
    return apiRequest<{ data: unknown[]; meta: unknown }>(`/notifications${toQueryString(query)}`).then(
      (result): { data: Notification[]; meta: ApiMeta } => ({
        data: result.data.map(mapNotification),
        meta: mapMeta(result.meta),
      }),
    )
  },
  unreadCount() {
    return apiRequest<{ count: number }>('/notifications/unread-count')
  },
  markRead(id: string) {
    return apiRequest<{ message: string }>(`/notifications/${id}/read`, {
      method: 'PATCH',
    })
  },
  markAllRead() {
    return apiRequest<{ message: string; count: number }>('/notifications/read-all', {
      method: 'PATCH',
    })
  },
}
