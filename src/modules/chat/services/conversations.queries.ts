import { useMutation, useQuery } from '@tanstack/react-query'
import type { ApiQueryValue } from '@/core/api/http'
import { queryKeys } from '@/core/query/keys'
import { conversationsApi } from './conversations.api'

type ConversationQueryParams = Record<string, ApiQueryValue>

export const useConversationsListQuery = (enabled = true) =>
  useQuery({
    queryKey: queryKeys.conversations.list(),
    queryFn: () => conversationsApi.list(),
    enabled,
  })

export const useConversationMessagesQuery = ({
  conversationId,
  params,
  enabled = true,
}: {
  conversationId: string
  params: ConversationQueryParams
  enabled?: boolean
}) =>
  useQuery({
    queryKey: queryKeys.conversations.messages(conversationId, params),
    queryFn: () => conversationsApi.messages(conversationId, params),
    enabled: Boolean(conversationId) && enabled,
  })

export const useCreateConversationMutation = () =>
  useMutation({
    mutationFn: conversationsApi.create,
  })

export const useSendMessageMutation = () =>
  useMutation({
    mutationFn: ({
      conversationId,
      payload,
    }: {
      conversationId: string
      payload: { content?: string; imageUrl?: string; type?: 'text' | 'image' }
    }) => conversationsApi.sendMessage(conversationId, payload),
  })

export const useMarkConversationReadMutation = () =>
  useMutation({
    mutationFn: (conversationId: string) => conversationsApi.markRead(conversationId),
  })
