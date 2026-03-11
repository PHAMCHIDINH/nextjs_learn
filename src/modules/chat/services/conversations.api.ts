import type { ApiMeta, ApiQueryValue } from '@/core/api/http'
import { apiRequest, toQueryString } from '@/core/api/http'
import { mapConversation, mapMessage, mapMeta } from '@/core/api/mappers'
import type { Message } from '@/lib/types'

export const conversationsApi = {
  list() {
    return apiRequest<unknown[]>('/conversations').then((items) => items.map(mapConversation))
  },
  create(payload: { participantId: string; productId?: string }) {
    return apiRequest<unknown>('/conversations', {
      method: 'POST',
      json: payload,
    }).then(mapConversation)
  },
  messages(conversationId: string, query?: Record<string, ApiQueryValue>) {
    return apiRequest<{ data: unknown[]; meta: unknown }>(
      `/conversations/${conversationId}/messages${toQueryString(query)}`,
    ).then((result): { data: Message[]; meta: ApiMeta } => ({
      data: result.data.map(mapMessage),
      meta: mapMeta(result.meta),
    }))
  },
  sendMessage(
    conversationId: string,
    payload: { content?: string; imageUrl?: string; type?: 'text' | 'image' },
  ) {
    return apiRequest<unknown>(`/conversations/${conversationId}/messages`, {
      method: 'POST',
      json: payload,
    }).then(mapMessage)
  },
  markRead(conversationId: string) {
    return apiRequest<{ message: string }>(`/conversations/${conversationId}/read`, {
      method: 'PATCH',
    })
  },
}
