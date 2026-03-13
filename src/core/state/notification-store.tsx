'use client'

import {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from 'react'
import { useStore } from 'zustand'
import { createStore } from 'zustand/vanilla'
import type { Notification, NotificationType } from '@/lib/types'
import { notificationsApi } from '@/modules/notifications/services/notifications.api'

const MAX_NOTIFICATIONS = 20

type UnknownRecord = Record<string, unknown>

const isRecord = (value: unknown): value is UnknownRecord =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const toDate = (value: unknown): Date => {
  if (value instanceof Date) {
    return value
  }

  if (typeof value === 'string' || typeof value === 'number') {
    const parsed = new Date(value)
    if (!Number.isNaN(parsed.getTime())) {
      return parsed
    }
  }

  return new Date()
}

const normalizeNotificationType = (value: unknown): NotificationType => {
  if (
    value === 'NEW_MESSAGE' ||
    value === 'LISTING_APPROVED' ||
    value === 'LISTING_REJECTED' ||
    value === 'NEW_REVIEW'
  ) {
    return value
  }

  return 'NEW_MESSAGE'
}

export const normalizeNotification = (value: unknown): Notification | null => {
  if (!isRecord(value)) {
    return null
  }

  const id = typeof value.id === 'string' ? value.id : ''
  if (!id) {
    return null
  }

  return {
    id,
    type: normalizeNotificationType(value.type),
    title: typeof value.title === 'string' ? value.title : '',
    body: typeof value.body === 'string' ? value.body : '',
    isRead: typeof value.isRead === 'boolean' ? value.isRead : false,
    metadata: isRecord(value.metadata) ? value.metadata : undefined,
    createdAt: toDate(value.createdAt),
  }
}

export type NotificationStoreState = {
  notifications: Notification[]
  unreadCount: number
  socketConnected: boolean
  bootstrap: (userId?: string | null) => Promise<void>
  refresh: (userId?: string | null) => Promise<void>
  markRead: (id: string, userId?: string | null) => Promise<void>
  markAllRead: (userId?: string | null) => Promise<void>
  pushIncoming: (notification: Notification) => boolean
  setSocketConnected: (connected: boolean) => void
  clear: () => void
}

type NotificationStoreApi = ReturnType<typeof createNotificationStore>

const NotificationStoreContext = createContext<NotificationStoreApi | null>(null)

const createNotificationStore = () =>
  createStore<NotificationStoreState>((set, get) => ({
    notifications: [],
    unreadCount: 0,
    socketConnected: false,
    bootstrap: async (userId) => {
      await get().refresh(userId)
    },
    refresh: async (userId) => {
      if (!userId) {
        get().clear()
        return
      }

      const [listResult, unreadResult] = await Promise.all([
        notificationsApi.list({ page: 1, limit: MAX_NOTIFICATIONS }),
        notificationsApi.unreadCount(),
      ])

      set({
        notifications: listResult.data,
        unreadCount: unreadResult.count,
      })
    },
    markRead: async (id, userId) => {
      if (!userId) {
        return
      }

      const target = get().notifications.find((item) => item.id === id)

      set((state) => ({
        notifications: state.notifications.map((item) =>
          item.id === id
            ? {
                ...item,
                isRead: true,
              }
            : item,
        ),
        unreadCount:
          target && !target.isRead
            ? Math.max(state.unreadCount - 1, 0)
            : state.unreadCount,
      }))

      try {
        await notificationsApi.markRead(id)
      } catch {
        await get().refresh(userId)
      }
    },
    markAllRead: async (userId) => {
      if (!userId) {
        return
      }

      set((state) => ({
        unreadCount: 0,
        notifications: state.notifications.map((item) =>
          item.isRead
            ? item
            : {
                ...item,
                isRead: true,
              },
        ),
      }))

      try {
        await notificationsApi.markAllRead()
      } catch {
        await get().refresh(userId)
      }
    },
    pushIncoming: (notification) => {
      const existing = get().notifications.find((item) => item.id === notification.id)
      const shouldIncrementUnread = !notification.isRead && (!existing || existing.isRead)

      set((state) => ({
        notifications: [
          notification,
          ...state.notifications.filter((item) => item.id !== notification.id),
        ].slice(0, MAX_NOTIFICATIONS),
        unreadCount: shouldIncrementUnread ? state.unreadCount + 1 : state.unreadCount,
      }))

      return shouldIncrementUnread
    },
    setSocketConnected: (connected) => {
      set({ socketConnected: connected })
    },
    clear: () => {
      set({
        notifications: [],
        unreadCount: 0,
        socketConnected: false,
      })
    },
  }))

export function NotificationStoreProvider({
  children,
}: {
  children: ReactNode
}) {
  const [store] = useState(createNotificationStore)

  return (
    <NotificationStoreContext.Provider value={store}>
      {children}
    </NotificationStoreContext.Provider>
  )
}

export const useNotificationStore = <T,>(
  selector: (state: NotificationStoreState) => T,
): T => {
  const store = useContext(NotificationStoreContext)
  if (!store) {
    throw new Error(
      'useNotificationStore must be used within NotificationStoreProvider',
    )
  }

  return useStore(store, selector)
}

export const useNotificationStoreApi = () => {
  const store = useContext(NotificationStoreContext)
  if (!store) {
    throw new Error(
      'useNotificationStoreApi must be used within NotificationStoreProvider',
    )
  }

  return store
}
