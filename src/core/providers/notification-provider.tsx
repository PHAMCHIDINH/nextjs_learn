'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { io, type Socket } from 'socket.io-client'
import { toast } from 'sonner'
import { getApiBaseUrl, notificationsApi } from '@/lib/api'
import type { Notification, NotificationType } from '@/lib/types'
import { useAuth } from '@/core/providers/auth-provider'
import { authApi } from '@/modules/auth/services/auth.api'

const MAX_NOTIFICATIONS = 20

type NotificationContextValue = {
  unreadCount: number
  chatUnreadCount: number
  notifications: Notification[]
  markRead: (id: string) => Promise<void>
  markAllRead: () => Promise<void>
  refresh: () => Promise<void>
}

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

const normalizeNotification = (value: unknown): Notification | null => {
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

const NotificationContext = createContext<NotificationContextValue | undefined>(undefined)

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const socketRef = useRef<Socket | null>(null)

  const clearState = useCallback(() => {
    setNotifications([])
    setUnreadCount(0)
  }, [])

  const refresh = useCallback(async () => {
    if (!user) {
      clearState()
      return
    }

    try {
      const [countResult, notificationsResult] = await Promise.all([
        notificationsApi.unreadCount(),
        notificationsApi.list({ page: 1, limit: MAX_NOTIFICATIONS }),
      ])

      setUnreadCount(countResult.count)
      setNotifications(notificationsResult.data)
    } catch {
      // keep previous state when fetch fails
    }
  }, [clearState, user])

  const markRead = useCallback(
    async (id: string) => {
      if (!user) {
        return
      }

      const target = notifications.find((item) => item.id === id)
      if (target && !target.isRead) {
        setUnreadCount((previous) => Math.max(previous - 1, 0))
      }

      setNotifications((previous) =>
        previous.map((item) =>
          item.id === id
            ? {
                ...item,
                isRead: true,
              }
            : item,
        ),
      )

      try {
        await notificationsApi.markRead(id)
      } catch {
        await refresh()
      }
    },
    [notifications, refresh, user],
  )

  const markAllRead = useCallback(async () => {
    if (!user) {
      return
    }

    setUnreadCount(0)
    setNotifications((previous) =>
      previous.map((item) =>
        item.isRead
          ? item
          : {
              ...item,
              isRead: true,
            },
      ),
    )

    try {
      await notificationsApi.markAllRead()
    } catch {
      await refresh()
    }
  }, [refresh, user])

  useEffect(() => {
    if (!user) {
      socketRef.current?.removeAllListeners()
      socketRef.current?.disconnect()
      socketRef.current = null
      clearState()
      return
    }

    void refresh()

    const socket = io(`${getApiBaseUrl()}/notifications`, {
      autoConnect: false,
      transports: ['websocket'],
      withCredentials: true,
      reconnection: true,
      reconnectionAttempts: Infinity,
      auth: (cb) => {
        void authApi
          .createSocketToken()
          .then(({ token }) => cb({ token }))
          .catch(() => cb({}))
      },
    })

    socketRef.current = socket

    socket.on('notification:new', (rawPayload: unknown) => {
      const incoming = normalizeNotification(rawPayload)
      if (!incoming) {
        return
      }

      let shouldIncrementUnread = !incoming.isRead
      setNotifications((previous) => {
        const existing = previous.find((item) => item.id === incoming.id)
        if (existing) {
          shouldIncrementUnread = !incoming.isRead && existing.isRead
        }

        const next = [incoming, ...previous.filter((item) => item.id !== incoming.id)]
        return next.slice(0, MAX_NOTIFICATIONS)
      })

      if (shouldIncrementUnread) {
        setUnreadCount((previous) => previous + 1)
      }

      toast(incoming.title || 'Thong bao moi', {
        description: incoming.body,
      })
    })

    socket.connect()

    return () => {
      socket.removeAllListeners()
      socket.disconnect()
      socketRef.current = null
    }
  }, [clearState, refresh, user])

  const chatUnreadCount = useMemo(
    () => notifications.filter((item) => !item.isRead && item.type === 'NEW_MESSAGE').length,
    [notifications],
  )

  const value = useMemo<NotificationContextValue>(
    () => ({
      unreadCount,
      chatUnreadCount,
      notifications,
      markRead,
      markAllRead,
      refresh,
    }),
    [chatUnreadCount, markAllRead, markRead, notifications, refresh, unreadCount],
  )

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>
}

export function useNotification() {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotification must be used within NotificationProvider')
  }

  return context
}
