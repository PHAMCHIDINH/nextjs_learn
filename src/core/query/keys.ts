import type { ApiQueryValue } from '@/core/api/http'

type QueryParams = Record<string, ApiQueryValue>

export const queryKeys = {
  auth: {
    all: ['auth'] as const,
    me: () => ['auth', 'me'] as const,
  },
  listings: {
    all: ['listings'] as const,
    list: (params: QueryParams) => ['listings', 'list', params] as const,
    byId: (id: string) => ['listings', 'detail', id] as const,
    bySeller: (sellerId: string, params: QueryParams) => ['listings', 'seller', sellerId, params] as const,
  },
  users: {
    all: ['users'] as const,
    list: () => ['users', 'list'] as const,
    profile: (id: string) => ['users', 'profile', id] as const,
    publicListings: (id: string, params: QueryParams) => ['users', 'publicListings', id, params] as const,
    myListings: (params: QueryParams) => ['users', 'myListings', params] as const,
    mySavedListings: (params: QueryParams) => ['users', 'mySavedListings', params] as const,
  },
  dashboard: {
    all: ['dashboard'] as const,
    summary: () => ['dashboard', 'summary'] as const,
  },
  admin: {
    all: ['admin'] as const,
    pendingListings: (params: QueryParams) => ['admin', 'pendingListings', params] as const,
    reports: (params: QueryParams) => ['admin', 'reports', params] as const,
  },
  notifications: {
    all: ['notifications'] as const,
    unreadCount: () => ['notifications', 'unreadCount'] as const,
    list: (params: QueryParams) => ['notifications', 'list', params] as const,
  },
  conversations: {
    all: ['conversations'] as const,
    list: () => ['conversations', 'list'] as const,
    messages: (conversationId: string, params: QueryParams) =>
      ['conversations', 'messages', conversationId, params] as const,
  },
  stats: {
    all: ['stats'] as const,
    public: () => ['stats', 'public'] as const,
  },
}
